#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
运行任何Python脚本，并将所有输出重定向到日志文件
使用方法：python run_with_log.py <脚本名称> [参数...]
例如：python run_with_log.py main.py --port 8000
"""

import os
import subprocess
import sys
import time
from datetime import datetime


def main():
    """主函数"""
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("使用方法：python run_with_log.py <脚本名称> [参数...]")
        print("例如：python run_with_log.py main.py --port 8000")
        return

    # 获取脚本名称和参数
    script_name = sys.argv[1]
    script_args = sys.argv[2:]

    # 确保debug目录存在
    debug_dir = os.path.join(os.getcwd(), "debug")
    os.makedirs(debug_dir, exist_ok=True)

    # 创建日志文件名，使用脚本名和时间戳
    script_base_name = os.path.basename(script_name).split(".")[0]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(debug_dir, f"{script_base_name}_{timestamp}.log")

    print(f"运行脚本: {script_name} {' '.join(script_args)}")
    print(f"所有输出将被重定向到: {log_file}")

    # 构建命令
    cmd = [sys.executable, script_name] + script_args

    # 打开日志文件
    with open(log_file, "w", encoding="utf-8") as f:
        # 写入头部信息
        f.write(f"===== 运行脚本: {script_name} {' '.join(script_args)} =====\n")
        f.write(f"===== 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====\n\n")
        f.flush()

        # 启动进程，将所有输出重定向到日志文件
        try:
            process = subprocess.Popen(cmd, stdout=f, stderr=subprocess.STDOUT, universal_newlines=True)

            print(f"脚本已启动，进程ID: {process.pid}")
            print("使用 Ctrl+C 停止脚本")

            # 添加一个提示，表示日志正在写入
            log_indicator = "|/-\\"
            idx = 0

            # 等待进程结束，同时显示动态指示器
            while process.poll() is None:
                sys.stdout.write(f"\r正在运行... {log_indicator[idx]} 日志: {log_file}")
                sys.stdout.flush()
                idx = (idx + 1) % len(log_indicator)
                time.sleep(0.1)

            # 进程结束
            exit_code = process.returncode
            print(f"\n脚本已结束，退出码: {exit_code}")

            # 写入尾部信息到日志
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n===== 结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====\n")
                f.write(f"===== 退出码: {exit_code} =====\n")

        except KeyboardInterrupt:
            print("\n接收到中断信号，正在停止脚本...")
            process.terminate()
            try:
                process.wait(timeout=5)
                print("脚本已停止")
            except subprocess.TimeoutExpired:
                print("脚本未能在5秒内停止，强制终止")
                process.kill()

            # 写入中断信息到日志
            with open(log_file, "a", encoding="utf-8") as f:
                f.write("\n===== 用户中断脚本 =====\n")
                f.write(f"===== 中断时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====\n")

        except Exception as e:
            print(f"运行脚本时出错: {e!s}")

            # 写入错误信息到日志
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n===== 运行出错: {e!s} =====\n")
                f.write(f"===== 错误时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====\n")

    print(f"日志文件: {log_file}")


if __name__ == "__main__":
    main()
