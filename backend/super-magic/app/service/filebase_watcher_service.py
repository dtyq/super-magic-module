import asyncio
import os
import queue
import time
from pathlib import Path
from typing import Any, Dict, List

import psutil
from watchdog.events import FileSystemEvent, FileSystemEventHandler

# 导入watchdog库用于文件监控
from watchdog.observers import Observer

from app.filebase.filebase import Filebase
from app.filebase.filebase_config import FilebaseConfig
from app.logger import get_logger
from app.paths import PathManager

logger = get_logger(__name__)

class FilebaseWatcher(FileSystemEventHandler):
    """监控文件系统事件并同步到Filebase的处理器"""

    def __init__(self, sandbox_id: str, workspace_dir: str):
        """初始化文件监控处理器

        Args:
            sandbox_id: 沙盒ID
            workspace_dir: 监控的目录路径
        """
        # 初始化Filebase配置
        self.config = FilebaseConfig()
        # 使用配置初始化Filebase
        self.filebase = Filebase(self.config)

        self.sandbox_id = sandbox_id
        self.workspace_dir = Path(workspace_dir).resolve()

        # 缓存已处理的文件，避免重复处理
        self.indexed_files: Dict[str, str] = {}  # 路径 -> 文件ID映射
        self.pending_events: Dict[str, asyncio.Event] = {}  # 路径 -> 事件对象
        self.is_running = True

        # 用于跨线程通信的队列
        self.event_queue = queue.Queue()

        # 恢复机制状态变量
        self.workspace_missing = False
        self.recovery_attempts = 0
        self.max_recovery_attempts = 120  # 最大尝试恢复次数（比如等待10分钟）
        self.recovery_interval = 5  # 恢复检查间隔（秒）

        # 心跳机制状态变量
        self.last_heartbeat_time = time.time()
        self.heartbeat_interval = 60  # 心跳间隔（秒）
        self.stats = {
            "events_processed": 0,
            "files_indexed": 0,
            "files_updated": 0,
            "files_deleted": 0,
            "errors": 0,
            "watchdog_resets": 0,
            "pending_timeouts": 0
        }

        # 死锁检测变量
        self.last_activity_time = time.time()
        self.activity_timeout = 300  # 5分钟无活动视为可能死锁

        # 看门狗定时器变量
        self.watchdog_last_reset = time.time()
        self.watchdog_timeout = 600  # 10分钟无重置触发看门狗

        self.start_time = time.time()

        logger.info(f"初始化文件监控器: sandbox={sandbox_id}, path={workspace_dir}")

    async def watch_command(self, sandbox_id: str, workspace_dir: str, once: bool = False, refresh: bool = False):
        """执行监控命令
        
        Args:
            sandbox_id: 沙盒ID
            workspace_dir: 监控的目录路径
            once: 是否只运行一次
            refresh: 是否清空集合并重新建立索引
        """
        # 检查目录是否存在
        workspace_dir = PathManager.get_project_root().joinpath(workspace_dir)
        if not os.path.exists(workspace_dir):
            logger.warning(f"监控目录不存在: {workspace_dir}，等待目录创建...")
            # 目录不存在时，等待创建
            max_wait_time = 3600  # 最长等待时间（秒）
            wait_interval = 60    # 检查间隔（秒）
            total_wait_time = 0

            while not os.path.exists(workspace_dir):
                # 检查是否超过最大等待时间
                if total_wait_time >= max_wait_time:
                    logger.error(f"等待超时，监控目录 {workspace_dir} 在 {max_wait_time} 秒内未创建")
                    raise Exception(f"监控目录 {workspace_dir} 在 {max_wait_time} 秒内未创建")

                # 等待指定时间后再次检查
                logger.info(f"等待监控目录 {workspace_dir} 创建，将在 {wait_interval} 秒后重试...（已等待 {total_wait_time} 秒）")
                await asyncio.sleep(wait_interval)
                total_wait_time += wait_interval

            logger.info(f"监控目录 {workspace_dir} 已创建，继续执行")

        # 初始化文件监控器
        event_handler = FilebaseWatcher(sandbox_id, workspace_dir)

        # 如果指定了refresh参数，则清空集合并重新建立索引
        if refresh:
            logger.info(f"指定了refresh参数，将清空集合 {sandbox_id} 并重新建立索引")
            await event_handler._clear_all_collection_points()

        # 启动前先清理已不存在文件的索引
        logger.info("启动前先清理已不存在文件的索引...")
        await event_handler.scan_for_deleted_files()

        # 如果只扫描一次
        if once:
            logger.info(f"一次性扫描模式: 只扫描 {workspace_dir} 中的文件，不持续监控")
            await event_handler.scan_existing_files()
            logger.info("扫描完成，退出")
            return

        # 设置观察者
        observer = Observer()
        observer.schedule(event_handler, workspace_dir, recursive=True)
        observer.start()

        logger.info(f"开始监控目录: {workspace_dir} (sandbox: {sandbox_id})")

        # 设置主循环的监控变量
        last_check_time = time.time()
        observer_check_interval = 30  # 每30秒检查一次观察者状态

        try:
            # 启动事件处理任务
            event_task = asyncio.create_task(event_handler.process_events())

            # 创建一个任务定期检查看门狗
            async def watchdog_monitor():
                nonlocal event_task  # 将nonlocal声明移到函数开始处

                while event_handler.is_running:
                    try:
                        # 检查看门狗是否超时
                        watchdog_triggered = await event_handler._check_watchdog()

                        if watchdog_triggered:
                            # 看门狗触发，检查事件处理任务状态
                            if not event_task.done():
                                logger.warning("看门狗触发: 尝试重启事件处理任务")
                                # 取消当前任务
                                event_task.cancel()

                                try:
                                    # 等待任务取消
                                    await asyncio.wait_for(asyncio.shield(event_task), timeout=5)
                                except (asyncio.TimeoutError, asyncio.CancelledError):
                                    logger.warning("事件处理任务取消超时或被取消")

                                # 创建新的事件处理任务
                                event_task = asyncio.create_task(event_handler.process_events())
                                logger.info("已创建新的事件处理任务")
                    except Exception as e:
                        logger.error(f"看门狗监控任务出错: {e!s}", exc_info=True)

                    # 每分钟检查一次
                    await asyncio.sleep(60)

            # 启动看门狗监控任务
            watchdog_task = asyncio.create_task(watchdog_monitor())

            # 扫描现有文件
            await event_handler.scan_existing_files()

            # 保持程序运行
            while event_handler.is_running:
                current_time = time.time()

                # 定期检查观察者状态
                if current_time - last_check_time >= observer_check_interval:
                    last_check_time = current_time

                    # 检查观察者状态
                    if not observer.is_alive():
                        logger.warning("观察者已停止，尝试重启...")
                        # 尝试重启观察者
                        try:
                            observer.stop()
                            observer.join(timeout=5)  # 等待观察者完全停止

                            # 检查目录是否存在
                            if os.path.exists(workspace_dir):
                                # 创建新的观察者
                                observer = Observer()
                                observer.schedule(event_handler, workspace_dir, recursive=True)
                                observer.start()
                                logger.info("观察者已重启")
                            else:
                                logger.warning(f"目录 {workspace_dir} 不存在，等待恢复...")
                                # 等待目录恢复后再创建新的观察者
                        except Exception as e:
                            logger.error(f"重启观察者失败: {e!s}")

                # 检查事件处理任务是否有问题
                if event_task.done():
                    if event_task.exception():
                        logger.error(f"事件处理任务异常退出: {event_task.exception()}")
                        # 创建新的事件处理任务
                        event_task = asyncio.create_task(event_handler.process_events())
                        logger.info("已重新启动事件处理任务")
                    else:
                        logger.warning("事件处理任务已完成，退出监控循环")
                        break

                await asyncio.sleep(1)  # 短暂休眠，保持主循环响应性

        except KeyboardInterrupt:
            logger.info("接收到终止信号，正在清理...")
            event_handler.is_running = False
            if not event_task.done():
                event_task.cancel()
            if 'watchdog_task' in locals() and not watchdog_task.done():
                watchdog_task.cancel()
            observer.stop()
        except Exception as e:
            logger.error(f"监控过程中发生错误: {e!s}", exc_info=True)
            event_handler.is_running = False
            if not event_task.done():
                event_task.cancel()
            if 'watchdog_task' in locals() and not watchdog_task.done():
                watchdog_task.cancel()
            observer.stop()
        finally:
            logger.info("等待观察者停止...")
            observer.join(timeout=15)  # 设置超时时间，避免无限等待

            # 确保事件处理任务干净地退出
            if not event_task.done():
                event_task.cancel()
                try:
                    # 等待任务取消
                    await asyncio.wait_for(event_task, timeout=5)
                except asyncio.TimeoutError:
                    logger.warning("事件处理任务取消超时")

            # 确保看门狗任务干净地退出
            if 'watchdog_task' in locals() and not watchdog_task.done():
                watchdog_task.cancel()
                try:
                    # 等待任务取消
                    await asyncio.wait_for(watchdog_task, timeout=5)
                except asyncio.TimeoutError:
                    logger.warning("看门狗任务取消超时")

            logger.info("文件监控器已停止")

    async def ensure_workspace_exists(self) -> bool:
        """确保.workspace目录存在，如果不存在则等待恢复。
        当目录不存在时会清空对应集合中的所有点，恢复后会重新建立索引。

        Returns:
            bool: 工作空间目录是否存在或已恢复
        """
        workspace_exists = os.path.exists(self.workspace_dir) and os.path.isdir(self.workspace_dir)

        # 目录存在
        if workspace_exists:
            # 如果之前检测到目录丢失，现在恢复了，则记录日志并重新索引
            if self.workspace_missing:
                logger.info(f".workspace目录已恢复: {self.workspace_dir}")
                self.workspace_missing = False
                self.recovery_attempts = 0

                # 目录恢复后重新建立索引
                try:
                    logger.info("目录恢复后开始重新索引所有文件...")
                    asyncio.create_task(self.scan_existing_files())
                except Exception as e:
                    logger.error(f"目录恢复后重新索引文件失败: {e}")

            return True

        # 目录不存在，记录状态
        if not self.workspace_missing:
            logger.error(f".workspace目录不存在: {self.workspace_dir}")
            self.workspace_missing = True
            self.recovery_attempts = 0

            # 清空对应集合中的所有点
            try:
                logger.info("目录不存在，开始清空集合中的所有点...")
                await self._clear_all_collection_points()
            except Exception as e:
                logger.error(f"清空集合点失败: {e}")

        # 检查是否超过最大尝试恢复次数
        if self.recovery_attempts >= self.max_recovery_attempts:
            logger.critical(f"已尝试恢复 {self.recovery_attempts} 次，超过最大尝试次数，停止尝试恢复")
            self.is_running = False
            return False

        # 增加恢复尝试计数
        self.recovery_attempts += 1
        logger.warning(f"等待.workspace目录恢复，第 {self.recovery_attempts} 次尝试，将在 {self.recovery_interval} 秒后重试...")

        # 等待指定时间后重试
        await asyncio.sleep(self.recovery_interval)
        return await self.ensure_workspace_exists()

    async def _clear_all_collection_points(self) -> None:
        """当.workspace目录不存在时，清空相应集合中的所有点
        """
        try:
            # 初始化 filebase
            await self.filebase.initialize(self.sandbox_id)

            # 获取集合名称
            collection_name = f"{self.filebase.config.collection_prefix}-SANDBOX-{self.sandbox_id}"
            logger.info(f"开始清空集合 {collection_name} 中的所有点...")

            # 获取driver实例
            driver = self.filebase.index_manager.vector_store.vector_database_client.driver

            # 确保driver的client可用
            if not hasattr(driver, 'client') or not driver.client:
                logger.error("Vector store driver client不可用，无法清空集合")
                return

            # 检查集合是否存在
            if not await self.filebase.index_manager.vector_store.collection_exists(collection_name):
                logger.warning(f"集合 {collection_name} 不存在，无需清空")
                return

            # 方法1: 尝试使用delete_collection然后重新创建集合
            try:
                logger.info(f"尝试删除并重建集合 {collection_name}...")

                # 获取向量维度
                vector_dim = self.filebase.index_manager.vector_store.embedding_dimension

                # 删除集合
                await self.filebase.index_manager.vector_store.delete_collection(collection_name)
                logger.info(f"成功删除集合 {collection_name}")

                # 重新创建集合
                await self.filebase.index_manager.vector_store.create_collection(collection_name, vector_dim)
                logger.info(f"成功重建集合 {collection_name}")

                # 清空已索引文件缓存
                self.indexed_files.clear()
                logger.info("已清空索引文件缓存")

                return
            except Exception as e:
                logger.warning(f"删除并重建集合失败: {e}，尝试使用scroll API清空集合...")

            # 方法2: 使用scroll API获取所有点，然后批量删除
            all_point_ids = []
            offset_id = None
            batch_size = 100
            total_scanned = 0

            # 循环获取所有点ID
            while True:
                try:
                    # 构建scroll参数
                    scroll_params = {
                        "collection_name": collection_name,
                        "limit": batch_size,
                        "with_payload": False,  # 只需要ID，不需要payload
                        "with_vectors": False   # 不需要向量数据
                    }

                    # 如果有偏移，添加到参数中
                    if offset_id is not None:
                        scroll_params["offset"] = offset_id

                    # 获取一批点
                    scroll_result = driver.client.scroll(**scroll_params)

                    # 检查结果
                    if (not scroll_result) or (isinstance(scroll_result, tuple) and (not scroll_result[0] or len(scroll_result[0]) == 0)):
                        break

                    # 解析结果
                    points = scroll_result[0] if isinstance(scroll_result, tuple) else scroll_result
                    next_offset = scroll_result[1] if isinstance(scroll_result, tuple) and len(scroll_result) > 1 else None

                    # 更新扫描计数
                    total_scanned += len(points)

                    # 收集点ID
                    for point in points:
                        if isinstance(point, dict):
                            point_id = point.get('id')
                        else:
                            point_id = getattr(point, 'id', None)

                        if point_id:
                            all_point_ids.append(point_id)

                    logger.info(f"已扫描 {total_scanned} 个点，收集了 {len(all_point_ids)} 个点ID")

                    # 更新offset
                    if next_offset:
                        offset_id = next_offset
                    elif points and len(points) > 0:
                        # 使用最后一个点的ID作为offset
                        last_point = points[-1]
                        if isinstance(last_point, dict):
                            offset_id = last_point.get('id')
                        else:
                            offset_id = getattr(last_point, 'id', None)
                    else:
                        # 没有更多点
                        break

                except Exception as e:
                    logger.error(f"扫描集合点时出错: {e}")
                    break

            # 如果有点需要删除
            if all_point_ids:
                logger.info(f"尝试删除 {len(all_point_ids)} 个点...")

                # 为了避免请求过大，分批删除
                batch_size = 100
                for i in range(0, len(all_point_ids), batch_size):
                    batch = all_point_ids[i:i+batch_size]
                    try:
                        await self.filebase.index_manager.vector_store.delete_points(
                            collection_name=collection_name,
                            ids=batch
                        )
                        logger.info(f"成功删除 {len(batch)} 个点，进度 {i+len(batch)}/{len(all_point_ids)}")
                    except Exception as e:
                        logger.error(f"删除点批次失败: {e}")

                # 清空已索引文件缓存
                self.indexed_files.clear()
                logger.info("已清空索引文件缓存")
            else:
                logger.info("没有找到需要删除的点")

        except Exception as e:
            logger.error(f"清空集合 {collection_name} 失败: {e}")

    async def scan_existing_files(self) -> None:
        """扫描并索引已存在的文件"""
        logger.info("扫描已存在的文件...")

        # 检查目录是否存在
        if not os.path.exists(self.workspace_dir) or not os.path.isdir(self.workspace_dir):
            logger.warning(f"工作空间目录 {self.workspace_dir} 不存在，无法扫描文件")
            return

        # 记录需要索引和跳过的文件计数
        indexed_files_count = 0
        skipped_files_count = 0

        # 获取所有文件
        all_files = []
        for root, _, files in os.walk(self.workspace_dir):
            for file in files:
                file_path = os.path.join(root, file)
                all_files.append(file_path)

        logger.info(f"发现 {len(all_files)} 个文件，正在检查索引状态...")

        # 初始化 filebase
        await self.filebase.initialize(self.sandbox_id)

        for file_path in all_files:
            # 检查文件类型是否支持
            if not self.filebase.is_file_type_supported(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                logger.info(f"跳过不支持的文件类型: {ext} ({file_path})")
                continue

            try:
                # 处理文件路径，只保留 .workspace 后的部分
                workspace_path = file_path
                workspace_index = file_path.find('.workspace')
                if workspace_index != -1:
                    # 找到 .workspace 后的路径，确保包含 .workspace
                    workspace_path = file_path[workspace_index:]

                # 生成文件 ID
                # 使用与 index_manager.py 中相同的逻辑生成文件 ID
                import hashlib
                file_id = hashlib.md5(workspace_path.encode()).hexdigest()

                # 检查文件是否已被索引
                collection_name = f"{self.filebase.config.collection_prefix}-SANDBOX-{self.sandbox_id}"
                is_indexed = await self.filebase.index_manager.is_file_indexed(collection_name, file_id)

                if is_indexed:
                    # 检查文件修改时间与索引时间的比较
                    # 如果文件修改时间较新，则重新索引
                    file_modified_time = os.path.getmtime(file_path)

                    # 获取已有索引中的文件元数据，检查是否需要更新
                    chunks = await self.filebase.index_manager._get_file_chunks(collection_name, file_id)

                    if chunks and len(chunks) > 0:
                        need_update = await self._check_if_file_changed(file_path, chunks, workspace_path)

                        if not need_update:
                            logger.info(f"文件未变化，跳过索引: {file_path}")
                            self.indexed_files[file_path] = file_id  # 添加到已索引缓存
                            skipped_files_count += 1
                            continue

                # 如果文件未索引或需要更新，进行索引
                logger.info(f"索引文件: {file_path}")

                # 准备文件元数据
                metadata = {
                    'sandbox_id': self.sandbox_id,
                    'file_path': workspace_path,  # 使用处理后的路径
                }

                # 索引文件（使用 index_file 方法内部的增量更新逻辑）
                file_id = await self.filebase.index_file(file_path, metadata)

                if file_id:
                    # 添加到已索引缓存
                    self.indexed_files[file_path] = file_id
                    indexed_files_count += 1
                    logger.info(f"已完成文件索引: {file_path} -> {file_id}")

            except Exception as e:
                logger.error(f"扫描文件失败: {file_path}, 错误: {e}")

        logger.info(f"已完成现有文件扫描，共索引 {indexed_files_count} 个文件，跳过 {skipped_files_count} 个未变化文件")

    async def _check_if_file_changed(self, file_path: str, existing_chunks: List[Dict[str, Any]], workspace_path: str) -> bool:
        """
        检查文件是否发生变化
        
        Args:
            file_path: 文件绝对路径
            existing_chunks: 现有的 chunks
            workspace_path: 处理后的文件路径
            
        Returns:
            bool: 如果文件需要更新返回 True，否则返回 False
        """
        try:
            # 获取文件最新内容并生成 chunks，但不添加到数据库
            metadata = {
                'sandbox_id': self.sandbox_id,
                'file_path': workspace_path,
            }

            # 获取适合的解析器（使用与 index_file 相同的方式）
            from app.filebase.parsers.parser_factory import ParserFactory
            parser = ParserFactory.get_parser_for_file(file_path, self.filebase.index_manager.vector_store)
            if not parser:
                # 如果无法获取解析器，认为文件需要更新
                logger.warning(f"无法获取文件 {file_path} 的解析器，默认认为文件需要更新")
                return True

            # 解析文件但不添加到数据库
            parse_result = parser.parse(file_path, metadata)
            new_chunks = parse_result.get('chunks', [])

            # 如果 chunks 数量不同，文件肯定变化了
            if len(existing_chunks) != len(new_chunks):
                logger.info(f"文件 {file_path} 的分块数量变化: {len(existing_chunks)} -> {len(new_chunks)}")
                return True

            # 比较文本内容是否有变化
            # 创建现有 chunks 的文本集合
            existing_texts = {chunk.get("text", "") for chunk in existing_chunks}

            # 检查新的 chunks 是否有不在现有 chunks 中的内容
            for new_chunk in new_chunks:
                # FileChunk 对象可以直接调用 get_text()
                chunk_text = new_chunk.get_text() if hasattr(new_chunk, 'get_text') else new_chunk.get('text', '')
                if chunk_text not in existing_texts:
                    # 发现新内容，文件需要更新
                    return True

            # 所有内容都匹配，文件未变化
            return False
        except Exception as e:
            logger.error(f"检查文件变化时出错: {file_path}, 错误: {e!s}")
            # 出错时默认认为文件需要更新
            return True

    def on_created(self, event: FileSystemEvent) -> None:
        """处理文件创建事件

        Args:
            event: 文件系统事件
        """
        if event.is_directory:
            return

        src_path = Path(event.src_path).resolve()
        # 将事件放入队列，不直接调用异步函数
        self.event_queue.put(("created", str(src_path)))

    def on_modified(self, event: FileSystemEvent) -> None:
        """处理文件修改事件

        Args:
            event: 文件系统事件
        """
        if event.is_directory:
            return

        src_path = Path(event.src_path).resolve()
        # 将事件放入队列，不直接调用异步函数
        self.event_queue.put(("modified", str(src_path)))

    def on_deleted(self, event: FileSystemEvent) -> None:
        """处理文件删除事件

        Args:
            event: 文件系统事件
        """
        if event.is_directory:
            return

        src_path = Path(event.src_path).resolve()
        # 将事件放入队列，不直接调用异步函数
        self.event_queue.put(("deleted", str(src_path)))

    def on_moved(self, event: FileSystemEvent) -> None:
        """处理文件移动事件

        Args:
            event: 文件系统事件
        """
        if event.is_directory:
            return

        src_path = Path(event.src_path).resolve()
        dest_path = Path(event.dest_path).resolve()

        # 将事件放入队列，不直接调用异步函数
        self.event_queue.put(("deleted", str(src_path)))
        self.event_queue.put(("created", str(dest_path)))

    async def process_events(self) -> None:
        """处理队列中的文件事件"""
        while self.is_running:
            try:
                # 首先检查工作空间目录是否存在
                if not await self.ensure_workspace_exists():
                    # 如果恢复失败，退出循环
                    logger.error("无法恢复.workspace目录，停止处理事件")
                    break

                # 发送心跳和重置看门狗
                await self._send_heartbeat()
                self._reset_watchdog()

                # 检查是否长时间无活动
                await self._check_for_deadlock()

                # 检查长时间未完成的事件
                await self._check_pending_timeouts()

                # 非阻塞方式检查队列
                event_processed = False
                try:
                    # 获取队列中的事件
                    while not self.event_queue.empty():
                        event_type, file_path = self.event_queue.get_nowait()
                        logger.info(f"处理事件: {event_type} {file_path}")

                        # 根据事件类型调用相应的处理函数
                        if event_type == "created":
                            await self._handle_file_created(file_path)
                            self.stats["files_indexed"] += 1
                        elif event_type == "modified":
                            await self._handle_file_modified(file_path)
                            self.stats["files_updated"] += 1
                        elif event_type == "deleted":
                            await self._handle_file_deleted(file_path)
                            self.stats["files_deleted"] += 1

                        # 更新事件处理计数和活动时间
                        self.stats["events_processed"] += 1
                        self.last_activity_time = time.time()
                        event_processed = True

                        # 标记任务完成
                        self.event_queue.task_done()
                except queue.Empty:
                    pass
                except Exception as e:
                    self.stats["errors"] += 1
                    logger.error(f"处理事件时出错: {e!s}", exc_info=True)
                    self.last_activity_time = time.time()  # 出错也是一种活动

                # 如果处理了事件，立即进入下一个循环
                if event_processed:
                    continue

                # 短暂休眠，让出控制权
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                logger.info("事件处理任务被取消")
                break
            except Exception as e:
                self.stats["errors"] += 1
                logger.error(f"事件处理循环出错: {e!s}", exc_info=True)
                # 出现异常时短暂暂停，避免无限错误循环消耗资源
                await asyncio.sleep(5)

    async def _send_heartbeat(self) -> None:
        """发送心跳，输出当前状态信息"""
        try:
            current_time = time.time()
            if current_time - self.last_heartbeat_time >= self.heartbeat_interval:
                self.last_heartbeat_time = current_time

                # 获取队列长度和内存使用情况
                queue_size = self.event_queue.qsize()
                memory_usage = self._get_memory_usage()

                # 获取当前等待处理的文件数
                pending_files = len(self.pending_events)

                # 生成状态信息
                uptime = int(current_time - self.start_time) if 'start_time' in globals() else 0
                hours, remainder = divmod(uptime, 3600)
                minutes, seconds = divmod(remainder, 60)
                uptime_str = f"{int(hours)}h {int(minutes)}m {int(seconds)}s"

                # 计算活动状态
                idle_time = int(current_time - self.last_activity_time)
                idle_minutes, idle_seconds = divmod(idle_time, 60)
                idle_str = f"{int(idle_minutes)}m {int(idle_seconds)}s"

                # 输出心跳信息
                logger.info(
                    f"心跳 - 运行时间: {uptime_str}, 空闲: {idle_str}, "
                    f"队列: {queue_size}, 待处理: {pending_files}, "
                    f"已处理: {self.stats['events_processed']}, "
                    f"已索引: {self.stats['files_indexed']}, "
                    f"已更新: {self.stats['files_updated']}, "
                    f"已删除: {self.stats['files_deleted']}, "
                    f"错误: {self.stats['errors']}, "
                    f"内存: {memory_usage:.1f}MB"
                )
        except Exception as e:
            logger.error(f"发送心跳时出错: {e!s}", exc_info=True)

    async def _check_for_deadlock(self) -> None:
        """检查是否出现死锁状态（长时间无活动）"""
        try:
            current_time = time.time()
            idle_time = current_time - self.last_activity_time

            # 如果长时间无活动但队列不为空或有待处理的事件，可能存在死锁
            if idle_time > self.activity_timeout:
                queue_size = self.event_queue.qsize()
                pending_files = len(self.pending_events)

                if queue_size > 0 or pending_files > 0:
                    logger.warning(
                        f"可能存在死锁: {int(idle_time)}秒无活动，"
                        f"但队列中有 {queue_size} 个事件，"
                        f"有 {pending_files} 个文件待处理"
                    )

                    # 输出待处理的文件路径以帮助诊断
                    if pending_files > 0:
                        pending_list = ", ".join(list(self.pending_events.keys())[:5])
                        logger.warning(f"待处理文件示例: {pending_list}" + 
                                     (f" 等共 {pending_files} 个" if pending_files > 5 else ""))

                    # 更新活动时间，避免重复警告
                    self.last_activity_time = current_time
        except Exception as e:
            logger.error(f"检查死锁时出错: {e!s}", exc_info=True)

    def _reset_watchdog(self) -> None:
        """重置看门狗定时器"""
        self.watchdog_last_reset = time.time()

    async def _check_watchdog(self) -> bool:
        """
        检查看门狗定时器是否超时
        
        Returns:
            bool: 如果看门狗超时返回True，否则返回False
        """
        current_time = time.time()
        elapsed = current_time - self.watchdog_last_reset

        if elapsed > self.watchdog_timeout:
            logger.warning(f"看门狗超时: {int(elapsed)}秒无重置，可能表示程序卡死")
            self.stats["watchdog_resets"] += 1
            self._reset_watchdog()  # 重置看门狗
            return True
        return False

    async def _check_pending_timeouts(self) -> None:
        """检查长时间未完成的事件，并尝试恢复"""
        try:
            current_time = time.time()

            # 复制一份待处理事件的列表，避免在迭代时修改
            pending_events = dict(self.pending_events)

            for file_path, event_obj in pending_events.items():
                if not hasattr(event_obj, 'creation_time'):
                    # 为事件添加创建时间属性
                    event_obj.creation_time = current_time
                    continue

                # 计算等待时间
                wait_time = current_time - event_obj.creation_time

                # 如果等待时间超过5分钟，判定为超时
                if wait_time > 300:  # 5分钟
                    logger.warning(f"文件处理超时: {file_path} 已等待 {int(wait_time)}秒")

                    # 尝试解锁该文件
                    if file_path in self.pending_events:
                        self.pending_events[file_path].set()
                        del self.pending_events[file_path]
                        self.stats["pending_timeouts"] += 1

                        # 如果文件仍然存在，重新放入队列尝试处理
                        if os.path.exists(file_path):
                            logger.info(f"重新放入队列处理文件: {file_path}")
                            if file_path in self.indexed_files:
                                # 如果已经在索引中，则作为修改处理
                                self.event_queue.put(("modified", file_path))
                            else:
                                # 否则作为新文件处理
                                self.event_queue.put(("created", file_path))
        except Exception as e:
            logger.error(f"检查事件超时时出错: {e!s}", exc_info=True)

    def _get_memory_usage(self) -> float:
        """获取当前进程的内存使用情况（MB）"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            # 返回MB为单位的内存使用
            return memory_info.rss / 1024 / 1024
        except Exception as e:
            logger.warning(f"获取内存使用信息失败: {e!s}")
            return -1

    async def _handle_file_created(self, file_path: str) -> None:
        """处理文件创建的异步操作

        Args:
            file_path: 文件路径
        """
        # 创建一个事件对象，用于防止并发处理同一文件
        if file_path in self.pending_events:
            # 等待现有操作完成
            await self.pending_events[file_path].wait()
            return

        self.pending_events[file_path] = asyncio.Event()

        try:
            # 确保文件稳定 (写入完成)
            await asyncio.sleep(1)

            # 检查文件是否存在
            if not os.path.exists(file_path):
                logger.warning(f"文件在处理前已删除: {file_path}")
                # 如果文件在处理前已被删除，处理为删除事件
                await self._handle_file_deleted(file_path)
                return

            # 检查工作空间目录是否存在
            if not await self.ensure_workspace_exists():
                logger.warning(f"工作空间目录不存在，无法处理文件: {file_path}")
                return

            # 检查文件是否在监控目录下
            if not str(file_path).startswith(str(self.workspace_dir)):
                return

            # 检查文件类型
            if not self.filebase.is_file_type_supported(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                logger.warning(f"跳过不支持的文件类型: {ext} ({file_path})")
                return

            logger.info(f"索引新文件: {file_path}")

            try:
                # 准备文件元数据
                # 处理文件路径，只保留 .workspace 后的部分
                workspace_path = file_path
                workspace_index = file_path.find('.workspace')
                if workspace_index != -1:
                    # 找到 .workspace 后的路径，确保包含 .workspace
                    workspace_path = file_path[workspace_index:]
                    logger.debug(f"文件路径处理: {file_path} -> {workspace_path}")

                metadata = {
                    'sandbox_id': self.sandbox_id,
                    'file_path': workspace_path,  # 使用处理后的路径
                }

                # 索引文件
                await self.filebase.initialize(self.sandbox_id)
                file_id = await self.filebase.index_file(file_path, metadata)

                # 添加到已索引缓存
                self.indexed_files[file_path] = file_id
                logger.info(f"已完成文件索引: {file_path} -> {file_id}")
            except Exception as e:
                logger.error(f"索引文件失败: {file_path}, 错误: {e}")

        except Exception as e:
            logger.error(f"处理文件创建事件失败: {file_path}, 错误: {e}")
        finally:
            # 标记处理完成
            self.pending_events[file_path].set()
            del self.pending_events[file_path]

    async def _handle_file_modified(self, file_path: str) -> None:
        """处理文件修改的异步操作

        Args:
            file_path: 文件路径
        """
        # 如果文件不在索引中，当作新文件处理
        if file_path not in self.indexed_files:
            await self._handle_file_created(file_path)
            return

        # 创建一个事件对象，用于防止并发处理同一文件
        if file_path in self.pending_events:
            # 等待现有操作完成
            await self.pending_events[file_path].wait()
            return

        self.pending_events[file_path] = asyncio.Event()

        try:
            # 确保文件稳定 (写入完成)
            await asyncio.sleep(1)

            if not os.path.exists(file_path):
                logger.warning(f"文件在处理前已删除: {file_path}")
                # 如果文件不存在，处理为删除事件
                await self._handle_file_deleted(file_path)
                return

            # 检查工作空间目录是否存在
            if not await self.ensure_workspace_exists():
                logger.warning(f"工作空间目录不存在，无法处理文件修改: {file_path}")
                return

            # 检查文件是否在监控目录下
            if not str(file_path).startswith(str(self.workspace_dir)):
                return

            # 检查文件类型
            if not self.filebase.is_file_type_supported(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                logger.warning(f"跳过不支持的文件类型: {ext} ({file_path})")
                # 从索引缓存中移除
                if file_path in self.indexed_files:
                    del self.indexed_files[file_path]
                return

            logger.info(f"更新文件索引: {file_path}")

            try:
                # 初始化filebase
                await self.filebase.initialize(self.sandbox_id)

                # 准备文件元数据
                # 处理文件路径，只保留 .workspace 后的部分
                workspace_path = file_path
                workspace_index = file_path.find('.workspace')
                if workspace_index != -1:
                    # 找到 .workspace 后的路径，确保包含 .workspace
                    workspace_path = file_path[workspace_index:]
                    logger.debug(f"文件路径处理: {file_path} -> {workspace_path}")

                metadata = {
                    'sandbox_id': self.sandbox_id,
                    'file_path': workspace_path,  # 使用处理后的路径
                }

                # 不再显式调用删除操作，而是让index_file方法内部处理
                # 因为index_file方法已经包含了检查和删除旧索引的逻辑
                file_id = await self.filebase.index_file(file_path, metadata)

                # 更新缓存
                self.indexed_files[file_path] = file_id
                logger.info(f"已完成文件更新索引: {file_path} -> {file_id}")
            except Exception as e:
                logger.error(f"更新文件索引失败: {file_path}, 错误: {e}")

        except Exception as e:
            logger.error(f"处理文件修改事件失败: {file_path}, 错误: {e}")
        finally:
            # 标记处理完成
            self.pending_events[file_path].set()
            del self.pending_events[file_path]

    async def _handle_file_deleted(self, file_path: str) -> None:
        """处理文件删除的异步操作

        Args:
            file_path: 文件路径
        """
        # 创建一个事件对象，用于防止并发处理同一文件
        if file_path in self.pending_events:
            # 等待现有操作完成
            await self.pending_events[file_path].wait()
            return

        self.pending_events[file_path] = asyncio.Event()

        try:
            # 检查工作空间目录是否存在
            if not await self.ensure_workspace_exists():
                logger.warning(f"工作空间目录不存在，延迟处理文件删除: {file_path}")
                # 将删除事件重新放入队列，稍后处理
                self.event_queue.put(("deleted", file_path))
                return

            # 无论文件是否在索引缓存中，都尝试清理索引
            logger.info(f"开始删除文件索引: {file_path}")

            # 获取文件的 workspace 路径
            workspace_path = file_path
            workspace_index = file_path.find('.workspace')
            if workspace_index != -1:
                workspace_path = file_path[workspace_index:]
                logger.info(f"处理后的文件路径: {workspace_path}")

            # 初始化 filebase 
            await self.filebase.initialize(self.sandbox_id)

            # 获取集合名称
            collection_name = f"{self.filebase.config.collection_prefix}-SANDBOX-{self.sandbox_id}"

            # 构造精确过滤条件，查找所有与此文件相关的点
            filter_condition = {
                "must": [
                    {
                        "key": "metadata.file_path",
                        "match": {
                            "value": workspace_path
                        }
                    }
                ]
            }

            logger.info(f"使用过滤条件搜索点: {filter_condition}")

            # 执行搜索查询
            related_points = await self.filebase.index_manager.vector_store.search(
                collection_name=collection_name,
                query_text="",  # 空查询
                filter_condition=filter_condition,
                limit=1000      # 尝试获取所有相关点
            )

            if related_points and len(related_points) > 0:
                # 获取所有点的ID
                point_ids = [point.get("id") for point in related_points if "id" in point]

                if point_ids and len(point_ids) > 0:
                    # 删除所有点
                    logger.info(f"找到 {len(point_ids)} 个与文件 {workspace_path} 相关的索引点，开始删除")

                    # 执行删除操作
                    success = await self.filebase.index_manager.vector_store.delete_points(
                        collection_name=collection_name,
                        ids=point_ids
                    )

                    if success:
                        logger.info(f"成功删除 {len(point_ids)} 个索引点")
                    else:
                        logger.error("删除索引点失败")
                else:
                    logger.warning("在搜索结果中未找到有效的点ID")
            else:
                logger.warning(f"未找到与文件 {workspace_path} 相关的索引点")

            # 如果文件在缓存中，从缓存中移除
            if file_path in self.indexed_files:
                file_id = self.indexed_files[file_path]
                del self.indexed_files[file_path]
                logger.info(f"从索引缓存中移除文件: {file_path} -> {file_id}")

            logger.info(f"完成文件索引删除处理: {file_path}")

        except Exception as e:
            logger.error(f"删除文件索引失败: {file_path}, 错误: {e}")
            logger.exception(e)  # 打印详细的异常堆栈
        finally:
            # 标记处理完成
            self.pending_events[file_path].set()
            del self.pending_events[file_path]

    def stop(self) -> None:
        """停止监控"""
        self.is_running = False

    async def scan_for_deleted_files(self) -> None:
        """扫描并清理已经不存在的文件的索引"""
        logger.info("开始扫描清理已删除文件的索引...")

        # 初始化 filebase
        await self.filebase.initialize(self.sandbox_id)

        # 获取集合名称
        collection_name = f"{self.filebase.config.collection_prefix}-SANDBOX-{self.sandbox_id}"

        try:
            # 检查集合是否存在
            if not await self.filebase.index_manager.vector_store.collection_exists(collection_name):
                logger.warning(f"集合 {collection_name} 不存在，无需清理")
                return

            # 记录删除的点数量和处理过的文件路径
            total_deleted_points = 0
            total_processed_points = 0
            batch_size = 100  # 每次处理的点数
            processed_file_paths = set()  # 跟踪已处理的文件路径，避免重复检查

            # 跟踪已处理的点ID，避免重复处理
            processed_point_ids = set()

            # 当前批次
            current_batch = 0
            max_iterations = 100  # 防止无限循环的安全限制

            # 循环处理，直到没有新的点需要处理或达到最大迭代次数
            while current_batch < max_iterations:
                current_batch += 1

                # 获取一批点
                points = await self._get_points_batch(collection_name, batch_size)

                # 如果没有更多点，结束处理
                if not points:
                    logger.info("没有更多索引点，结束处理")
                    break

                # 跟踪本批次的新点数量
                new_points_count = 0

                # 收集要删除的点ID
                to_delete_ids = []

                # 处理每个点
                for point in points:
                    if "id" in point and point["id"] not in processed_point_ids:
                        processed_point_ids.add(point["id"])
                        total_processed_points += 1
                        new_points_count += 1

                        if "payload" in point and "metadata" in point["payload"]:
                            metadata = point["payload"]["metadata"]
                            file_path = metadata.get("file_path", "")

                            # 如果文件路径无效或已处理过，跳过
                            if not file_path or file_path in processed_file_paths:
                                continue

                            processed_file_paths.add(file_path)

                            # 处理文件路径并检查文件是否存在
                            full_path = self._get_full_path(file_path)

                            # 检查文件是否存在
                            if not os.path.exists(full_path):
                                logger.info(f"文件 {full_path} 不存在，准备删除其索引点")

                                # 构造过滤条件，查找所有与此文件相关的点
                                filter_condition = {
                                    "must": [
                                        {
                                            "key": "metadata.file_path",
                                            "match": {
                                                "value": file_path
                                            }
                                        }
                                    ]
                                }

                                # 查找所有与此文件相关的点
                                related_points = await self.filebase.index_manager.vector_store.search(
                                    collection_name=collection_name,
                                    query_text="",  # 空查询
                                    filter_condition=filter_condition,
                                    limit=1000  # 尝试获取所有相关点
                                )

                                # 收集点ID
                                for related_point in related_points:
                                    if "id" in related_point and related_point["id"] not in to_delete_ids:
                                        to_delete_ids.append(related_point["id"])

                # 批量删除
                if to_delete_ids:
                    logger.info(f"准备删除 {len(to_delete_ids)} 个无效文件的索引点")
                    success = await self.filebase.index_manager.vector_store.delete_points(
                        collection_name=collection_name,
                        ids=to_delete_ids
                    )
                    if success:
                        total_deleted_points += len(to_delete_ids)
                        logger.info(f"成功删除 {len(to_delete_ids)} 个索引点")
                    else:
                        logger.error("删除索引点失败")

                # 如果本批次没有新的点，说明已经处理完所有点
                if new_points_count == 0:
                    logger.info("没有新的点，处理完成")
                    break

                logger.info(f"已处理 {total_processed_points} 个索引点，继续处理下一批")

            logger.info(f"清理完成，共处理 {total_processed_points} 个索引点，删除 {total_deleted_points} 个无效文件的索引点")
            logger.info(f"共处理了 {len(processed_file_paths)} 个不同的文件路径")

        except Exception as e:
            logger.error(f"扫描清理已删除文件索引时出错: {e!s}")
            logger.exception(e)  # 打印详细的异常信息和堆栈跟踪

    async def _get_points_batch(self, collection_name: str, batch_size: int, offset: int = 0) -> List[Dict]:
        """
        获取一批索引点并清理无效文件的索引
        
        Args:
            collection_name: 集合名称
            batch_size: 批次大小
            offset: 偏移量（当前未使用）
            
        Returns:
            List[Dict]: 点列表
        """
        try:
            # 获取driver实例
            driver = self.filebase.index_manager.vector_store.vector_database_client.driver

            # 确保driver的client可用
            if not hasattr(driver, 'client') or not driver.client:
                logger.error("Vector store driver client不可用")
                return []

            logger.info(f"使用scroll API从集合 {collection_name} 获取并清理索引点")

            # 用于分页的offset
            offset_point_id = None
            total_processed = 0
            total_deleted = 0

            # 防止死循环的机制
            max_iterations = 100  # 最大迭代次数
            current_iteration = 0
            processed_ids = set()  # 已处理的点ID集合

            # 循环翻页直到处理完所有点
            while True:
                # 防止死循环
                current_iteration += 1
                if current_iteration > max_iterations:
                    logger.warning(f"已达到最大迭代次数({max_iterations})，强制结束扫描")
                    break

                try:
                    # 构建scroll参数
                    scroll_params = {
                        "collection_name": collection_name,
                        "limit": batch_size,
                        "with_payload": True,
                        "with_vectors": False  # 不需要向量数据，减少传输数据量
                    }

                    # 如果有偏移点ID，增加到查询参数中
                    if offset_point_id is not None:
                        scroll_params["offset"] = offset_point_id

                    # 使用scroll API获取当前页的点
                    scroll_result = driver.client.scroll(**scroll_params)

                    # 检查scroll_result是否为空
                    if not scroll_result:
                        logger.info("没有获取到有效的scroll结果，结束扫描")
                        break

                    # scroll_result应该是一个元组，解包它
                    # 通常格式为 (points, next_page_offset)
                    if isinstance(scroll_result, tuple) and len(scroll_result) >= 1:
                        points = scroll_result[0]  # 第一个元素是点列表
                        next_page_offset = scroll_result[1] if len(scroll_result) > 1 else None  # 第二个元素是next_page_offset
                    else:
                        # 如果不是元组格式
                        logger.warning(f"意外的scroll_result格式: {type(scroll_result)}")
                        points = scroll_result  # 尝试直接使用
                        next_page_offset = None

                    # 如果没有points或者points为空，结束循环
                    if not points:
                        logger.info(f"没有更多索引点，结束扫描。总计处理: {total_processed} 个点，删除: {total_deleted} 个无效点")
                        break

                    # 记录本批次处理的点数
                    current_batch_size = len(points)

                    # 检查是否存在循环：检查本批次的点是否已经处理过
                    new_ids = set()
                    duplicate_ids = 0

                    for point in points:
                        # 提取点ID
                        point_id = None
                        if isinstance(point, dict):
                            point_id = point.get('id')
                        else:
                            point_id = getattr(point, 'id', None)

                        # 检查是否是重复的点ID
                        if point_id and point_id in processed_ids:
                            duplicate_ids += 1
                        elif point_id:
                            new_ids.add(point_id)

                    # 如果全部都是重复的点，说明分页出错，强制结束
                    if duplicate_ids == current_batch_size:
                        logger.warning(f"检测到所有点({current_batch_size}个)已处理过，可能存在循环，结束扫描")
                        break

                    # 没有新的点也结束
                    if not new_ids:
                        logger.warning("没有新的点ID，结束扫描")
                        break

                    # 将新ID添加到已处理集合中
                    processed_ids.update(new_ids)

                    # 更新总处理数
                    total_processed += len(new_ids)

                    # 更新下一页的偏移点ID
                    if next_page_offset:
                        # 记录当前的offset用于日志
                        old_offset = offset_point_id
                        offset_point_id = next_page_offset

                        # 检查offset是否变化，如果相同则可能导致循环
                        if old_offset == offset_point_id:
                            logger.warning(f"分页offset没有变化({offset_point_id})，强制结束分页")
                            break
                    else:
                        # 如果没有提供next_page_offset，则使用当前批次的最后一个点的ID作为偏移
                        if current_batch_size > 0:
                            # 记录当前的offset用于日志
                            old_offset = offset_point_id

                            # 检查点的格式，可能是对象或字典
                            last_point = points[-1]
                            if isinstance(last_point, dict):
                                offset_point_id = last_point.get('id')
                            else:
                                # 尝试作为对象访问
                                offset_point_id = getattr(last_point, 'id', None)

                            # 检查offset是否变化
                            if old_offset == offset_point_id:
                                logger.warning(f"分页offset没有变化({offset_point_id})，强制结束分页")
                                break

                        # 如果无法获取有效的offset，结束循环
                        if not offset_point_id:
                            logger.warning("无法获取有效的偏移点ID，结束扫描")
                            break

                    # 检查结果的点是否有效（文件是否存在）
                    points_to_delete = []

                    for point in points:
                        try:
                            # 检查点的格式，可能是对象或字典
                            if isinstance(point, dict):
                                # 字典格式
                                point_id = point.get('id')
                                payload = point.get('payload', {})
                            else:
                                # 对象格式
                                point_id = getattr(point, 'id', None)
                                payload = getattr(point, 'payload', {})

                            # 跳过没有ID的点
                            if not point_id:
                                continue

                            # 处理payload可能是对象的情况
                            if not isinstance(payload, dict) and hasattr(payload, '__dict__'):
                                payload = payload.__dict__

                            # 检查是否有metadata和file_path
                            metadata = payload.get('metadata', {}) if isinstance(payload, dict) else getattr(payload, 'metadata', {})

                            # metadata也可能是对象
                            if not isinstance(metadata, dict) and hasattr(metadata, '__dict__'):
                                metadata = metadata.__dict__

                            # 获取file_path
                            file_path = metadata.get('file_path') if isinstance(metadata, dict) else getattr(metadata, 'file_path', None)

                            if file_path:
                                # 获取完整文件路径并检查文件是否存在
                                full_path = self._get_full_path(file_path)
                                if not os.path.exists(full_path):
                                    # 文件不存在，添加到待删除列表
                                    points_to_delete.append(point_id)
                                    logger.debug(f"标记要删除的索引点: {point_id}, 对应的文件不存在: {full_path}")
                        except Exception as point_error:
                            # 获取点ID用于日志
                            point_id = None
                            if isinstance(point, dict):
                                point_id = point.get('id', 'unknown')
                            else:
                                point_id = getattr(point, 'id', 'unknown')
                            logger.warning(f"处理点 {point_id} 时出错: {point_error!s}")

                    # 批量删除无效文件的索引点
                    if points_to_delete:
                        try:
                            delete_success = await self.filebase.index_manager.vector_store.delete_points(
                                collection_name=collection_name,
                                ids=points_to_delete
                            )
                            if delete_success:
                                total_deleted += len(points_to_delete)
                                logger.info(f"成功删除 {len(points_to_delete)} 个无效文件的索引点")
                            else:
                                logger.warning(f"删除 {len(points_to_delete)} 个无效文件的索引点失败")
                        except Exception as delete_error:
                            logger.error(f"删除无效索引点时出错: {delete_error!s}")

                    # 日志输出当前进度
                    logger.info(f"已处理 {total_processed} 个索引点，删除 {total_deleted} 个无效点，迭代: {current_iteration}/{max_iterations}")

                except Exception as batch_error:
                    logger.error(f"处理索引点批次时出错: {batch_error!s}", exc_info=True)
                    # 继续下一个批次

            logger.info(f"完成索引点扫描，总计处理: {total_processed} 个点，删除: {total_deleted} 个无效点")
            return []  # 不需要返回点列表，因为已经在循环中处理了

        except Exception as e:
            logger.error(f"获取并清理索引点失败: {e!s}", exc_info=True)
            return []

    def _get_full_path(self, file_path: str) -> str:
        """
        根据文件路径获取完整路径
        
        Args:
            file_path: 文件路径
            
        Returns:
            str: 完整文件路径
        """
        # 处理文件路径 (可能包含或不包含 .workspace 前缀)
        if file_path and not file_path.startswith("/"):
            # 相对路径，需要转换为绝对路径
            # 如果路径中包含 .workspace，我们只保留 .workspace 之后的部分
            if '.workspace' in file_path:
                rel_path = file_path[file_path.find('.workspace'):]
            else:
                rel_path = file_path

            # 构建完整路径用于检查文件是否存在
            return os.path.join(str(self.workspace_dir.parent), rel_path)
        else:
            # 绝对路径
            return file_path
