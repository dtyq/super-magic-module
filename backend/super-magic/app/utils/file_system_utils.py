import shutil
import subprocess
import asyncio
from pathlib import Path
import logging
import aiofiles
import aiofiles.os # 导入 aiofiles 和 aiofiles.os

logger = logging.getLogger(__name__)

# 缓存 trash 命令检查结果
_has_trash_command = shutil.which("trash") is not None
if _has_trash_command:
    logger.debug("检测到系统已安装 trash 命令，将优先使用 trash 删除")
else:
    logger.debug("未检测到 trash 命令，将使用标准库删除")

async def safe_delete(path: Path):
    """
    安全地异步删除文件或目录。

    优先尝试使用 trash 命令（如果可用）。
    如果 trash 不可用或失败，则使用 aiofiles 进行删除。
    对于递归删除目录，回退到 asyncio.to_thread(shutil.rmtree)。

    Args:
        path: 要删除的文件或目录的 Path 对象。

    Raises:
        OSError: 如果删除过程中发生 OS 相关的错误。
        RuntimeError: 如果 trash 命令执行失败但未成功回退。
        Exception: 其他未预料的错误。
    """
    # 使用 aiofiles.os.path.exists 检查路径是否存在
    if not await aiofiles.os.path.exists(path):
        logger.warning(f"尝试删除不存在的路径: {path}")
        return # 路径不存在，无需操作

    trash_failed = False
    try:
        if _has_trash_command:
            # 尝试异步使用 trash 命令
            process = await asyncio.create_subprocess_exec(
                "trash", str(path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                logger.info(f"路径已通过 trash 移动到回收站: {path}")
                return
            else:
                error_message = stderr.decode().strip() if stderr else "未知错误"
                logger.warning(f"使用 trash 命令删除 {path} 失败 (返回码: {process.returncode}): {error_message}. 回退到 aiofiles/标准库删除。")
                trash_failed = True

        # 如果没有 trash 命令 或 trash 命令失败，则使用 aiofiles 或标准库删除
        if trash_failed or not _has_trash_command:
            # 使用 aiofiles.os.path.isfile 判断是否为文件
            if await aiofiles.os.path.isfile(path):
                # 使用 aiofiles.os.remove 删除文件
                await aiofiles.os.remove(path)
                logger.info(f"文件已通过 aiofiles 删除: {path}")
            # 使用 aiofiles.os.path.isdir 判断是否为目录
            elif await aiofiles.os.path.isdir(path):
                # 对于目录，aiofiles 没有 rmtree，我们仍然使用 shutil.rmtree + asyncio.to_thread
                try:
                    # 尝试使用 aiofiles 删除空目录 (如果需要区分空/非空)
                    # await aiofiles.os.rmdir(path)
                    # logger.info(f"空目录已通过 aiofiles 删除: {path}")
                    # 但通常直接用 rmtree 更简单，它也能处理空目录
                    await asyncio.to_thread(shutil.rmtree, path)
                    logger.info(f"目录已通过 shutil.rmtree (异步线程) 删除: {path}")
                except OSError as rmtree_error:
                    # 如果 rmtree 失败 (例如权限问题)
                    logger.error(f"使用 shutil.rmtree 删除目录 {path} 失败: {rmtree_error}")
                    raise # 重新抛出异常
            else:
                # 处理符号链接或其他类型的文件系统对象
                try:
                    # 尝试使用 aiofiles.os.remove (通常对符号链接有效)
                    await aiofiles.os.remove(path)
                    logger.info(f"路径（可能是符号链接）已通过 aiofiles 删除: {path}")
                except OSError as e:
                    logger.error(f"无法确定路径类型或使用 aiofiles 删除失败: {path}, 错误: {e}")
                    raise # 重新抛出异常

    except OSError as e:
        # 捕获 aiofiles 或 shutil.rmtree 可能抛出的 OS 错误
        logger.exception(f"异步删除路径 {path} 时发生 OS 错误: {e}")
        raise
    except Exception as e:
        # 捕获 asyncio.create_subprocess_exec 或其他意外错误
        logger.exception(f"异步删除路径 {path} 时发生意外错误: {e}")
        raise


async def clear_directory_contents(directory_path: Path) -> bool:
    """
    异步清理指定目录中的所有内容（文件和子目录），但保留目录本身。

    会并发删除目录下的项目以提高效率。

    Args:
        directory_path: 要清空内容的目录路径。

    Returns:
        bool: 操作是否成功完成（所有项目都被尝试删除，即使个别删除失败也可能返回 True，
              但会记录错误日志）。如果目录不存在或发生意外错误，返回 False。
    """
    try:
        # 异步检查目录是否存在 (使用同步的 exists 包装在 to_thread 中，保持与原逻辑一致)
        # 或者直接使用 aiofiles.os.path.exists(directory_path)
        # if not await asyncio.to_thread(directory_path.exists):
        if not await aiofiles.os.path.exists(directory_path):
            logger.info(f"{directory_path} 目录不存在，无需清理")
            return True # 视为成功，因为目标状态（目录为空或不存在）已满足

        if not await aiofiles.os.path.isdir(directory_path):
             logger.error(f"提供的路径不是目录: {directory_path}")
             return False

        logger.info(f"开始异步清理目录内容: {directory_path}")
        items_deleted = 0
        items_failed = 0
        # 使用 asyncio.gather 并发执行删除
        tasks = []
        item_paths = [] # 用于错误日志记录

        # 注意：iterdir 是同步的，但在进入异步任务创建前执行是可接受的
        # 对于非常大的目录，可以考虑异步迭代器，如 aiofiles.os.scandir
        for item in directory_path.iterdir():
            tasks.append(asyncio.create_task(safe_delete(item)))
            item_paths.append(item) # 在创建任务时记录路径

        # 等待所有删除任务完成
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 统计结果
        for i, result in enumerate(results):
            item_path = item_paths[i] # 从之前保存的列表中获取路径
            if isinstance(result, Exception):
                # safe_delete 内部已经记录了异常，这里可以只计数或记录简要信息
                logger.warning(f"清理 {item_path} 时遇到问题 (详见先前日志)")
                items_failed += 1
            else:
                items_deleted += 1

        if items_failed == 0:
            logger.info(f"成功异步清理 {directory_path} 目录中的 {items_deleted} 个项目")
        else:
            logger.warning(f"异步清理 {directory_path} 目录完成，成功 {items_deleted} 个，失败 {items_failed} 个")

        # 即使部分失败，也认为清理操作已尝试完成
        return True

    except Exception as e:
        logger.error(f"异步清理 {directory_path} 目录内容时发生意外错误: {e}", exc_info=True)
        return False
