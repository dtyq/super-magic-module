#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
可视化工具类
用于配置各种可视化库的无窗口模式、图表样式等
"""

import importlib.util
import os
import warnings
from typing import Dict


class VisualizationConfig:
    """
    可视化库配置工具类
    用于配置matplotlib、plotly等库的显示模式，特别是在CLI/无窗口环境下
    """

    @staticmethod
    def is_package_available(package_name: str) -> bool:
        """
        检查指定的包是否可用

        Args:
            package_name: 要检查的包名

        Returns:
            bool: 如果包已安装并可用则返回True，否则返回False
        """
        return importlib.util.find_spec(package_name) is not None

    @staticmethod
    def is_main_thread() -> bool:
        """
        检查当前线程是否是主线程

        Returns:
            bool: 如果当前线程是主线程则返回True，否则返回False
        """
        try:
            import threading

            return threading.current_thread() is threading.main_thread()
        except ImportError:
            # 如果threading模块不可用，假设是主线程
            return True

    @classmethod
    def configure_headless_mode(cls, verbose: bool = False) -> Dict[str, bool]:
        """
        配置所有可视化库为无头模式，防止在CLI环境中创建窗口

        Args:
            verbose: 是否打印配置信息

        Returns:
            Dict[str, bool]: 各个库的配置状态，True表示已配置
        """
        results = {}

        # 设置通用环境变量
        os.environ["DISPLAY"] = ""  # 禁用X11显示

        # 检查并配置matplotlib
        if cls.is_package_available("matplotlib"):
            try:
                import platform

                import matplotlib

                # 检测操作系统
                system = platform.system()

                # 检查是否在主线程上运行
                is_main_thread = cls.is_main_thread()
                if not is_main_thread:
                    if verbose:
                        print("警告: 在非主线程上配置Matplotlib，将强制使用Agg后端")
                    # 在非主线程上，强制使用Agg后端
                    matplotlib.use("Agg", force=True)
                    # 设置环境变量以进一步确保使用Agg后端
                    os.environ["MPLBACKEND"] = "Agg"
                elif system == "Darwin":  # macOS
                    # 在macOS上使用Agg后端，避免在非主线程上创建GUI窗口
                    matplotlib.use("Agg", force=True)
                    # 设置环境变量禁止MacOSX后端尝试打开窗口
                    os.environ["MPLBACKEND"] = "Agg"
                else:
                    # 其他系统上使用非交互式后端
                    matplotlib.use("Agg")

                results["matplotlib"] = True

                # 配置中文字体支持
                cls.configure_matplotlib_chinese_fonts()
            except Exception as e:
                results["matplotlib"] = False
                if verbose:
                    print(f"配置Matplotlib失败: {e}")

        # 检查并配置PyQt
        if cls.is_package_available("PyQt5"):
            try:
                from PyQt5 import QtCore

                QtCore.QCoreApplication.setAttribute(QtCore.Qt.AA_NoWindowsNativeMIME)
                QtCore.QCoreApplication.setAttribute(QtCore.Qt.AA_PluginApplication)
                os.environ["QT_QPA_PLATFORM"] = "offscreen"
                results["PyQt5"] = True
                if verbose:
                    print("已配置PyQt5为无窗口模式")
            except Exception as e:
                results["PyQt5"] = False
                if verbose:
                    print(f"配置PyQt5失败: {e}")

        # 检查并配置PySide
        if cls.is_package_available("PySide2"):
            try:
                os.environ["QT_QPA_PLATFORM"] = "offscreen"
                results["PySide2"] = True
                if verbose:
                    print("已配置PySide2为无窗口模式")
            except Exception as e:
                results["PySide2"] = False
                if verbose:
                    print(f"配置PySide2失败: {e}")

        # 检查并配置Plotly
        if cls.is_package_available("plotly"):
            try:
                import plotly.io as pio

                pio.renderers.default = "svg"  # 使用非交互式渲染器
                results["plotly"] = True
                if verbose:
                    print("已配置Plotly为SVG渲染模式")
            except Exception as e:
                results["plotly"] = False
                if verbose:
                    print(f"配置Plotly失败: {e}")

        # 检查并配置Pygame
        if cls.is_package_available("pygame"):
            try:
                os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1"
                os.environ["SDL_VIDEODRIVER"] = "dummy"
                results["pygame"] = True
                if verbose:
                    print("已配置Pygame为虚拟显示模式")
            except Exception as e:
                results["pygame"] = False
                if verbose:
                    print(f"配置Pygame失败: {e}")

        # 检查并配置Seaborn
        if cls.is_package_available("seaborn"):
            try:
                import seaborn as sns

                sns.set(rc={"figure.figsize": (10, 6)})
                results["seaborn"] = True
                if verbose:
                    print("已配置Seaborn为无窗口模式")
            except Exception as e:
                results["seaborn"] = False
                if verbose:
                    print(f"配置Seaborn失败: {e}")

        # 检查并配置Pillow/PIL
        if cls.is_package_available("PIL"):
            try:
                from PIL import Image

                Image.MAX_IMAGE_PIXELS = None  # 避免大图片警告窗口
                results["PIL"] = True
            except Exception as e:
                results["PIL"] = False
                if verbose:
                    print(f"配置PIL失败: {e}")

        # 禁用相关警告
        warnings.filterwarnings("ignore", category=UserWarning, module="matplotlib")

        return results

    @classmethod
    def set_matplotlib_style(cls, style: str = "seaborn-v0_8-whitegrid", dpi: int = 100) -> bool:
        """
        设置matplotlib图表样式

        Args:
            style: matplotlib样式名称
            dpi: 图像分辨率

        Returns:
            bool: 设置是否成功
        """
        if not cls.is_package_available("matplotlib"):
            return False

        try:
            import matplotlib.pyplot as plt

            plt.style.use(style)
            plt.rcParams["figure.dpi"] = dpi
            return True
        except Exception:
            return False

    @classmethod
    def set_plotly_theme(cls, template: str = "plotly_white") -> bool:
        """
        设置plotly图表主题

        Args:
            template: plotly主题名称

        Returns:
            bool: 设置是否成功
        """
        if not cls.is_package_available("plotly"):
            return False

        try:
            import plotly.io as pio

            pio.templates.default = template
            return True
        except Exception:
            return False

    @classmethod
    def configure_matplotlib_chinese_fonts(cls, font_family: str = None) -> bool:
        """
        配置matplotlib中文字体支持

        Args:
            font_family: 指定要使用的中文字体名称，如果为None则自动使用系统可用的中文字体

        Returns:
            bool: 配置是否成功
        """
        if not cls.is_package_available("matplotlib"):
            return False

        try:
            import os
            import platform

            import matplotlib.font_manager as fm
            import matplotlib.pyplot as plt

            # 获取系统类型
            system = platform.system()

            # 如果指定了字体，直接使用
            if font_family:
                plt.rcParams["font.sans-serif"] = [font_family, "DejaVu Sans", "Arial", "sans-serif"]
                plt.rcParams["axes.unicode_minus"] = False  # 修复负号显示问题
                return True

            # 根据系统自动选择合适的中文字体
            if system == "Windows":
                # Windows系统默认中文字体
                plt.rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei", "SimSun", "sans-serif"]
            elif system == "Darwin":  # macOS
                # macOS系统默认中文字体
                plt.rcParams["font.sans-serif"] = [
                    "PingFang SC",
                    "STHeiti",
                    "Heiti TC",
                    "Arial Unicode MS",
                    "sans-serif",
                ]
            elif system == "Linux":
                # Linux系统可能的中文字体
                plt.rcParams["font.sans-serif"] = [
                    "WenQuanYi Zen Hei",
                    "WenQuanYi Micro Hei",
                    "Noto Sans CJK SC",
                    "Source Han Sans CN",
                    "sans-serif",
                ]

            # 修复负号显示问题
            plt.rcParams["axes.unicode_minus"] = False

            # 查找系统中是否有中文字体，如果没有，尝试下载并安装一个开源中文字体
            has_chinese_font = False
            for font in fm.findSystemFonts():
                try:
                    if any(
                        name in os.path.basename(font).lower()
                        for name in ["simhei", "yahei", "heiti", "pingfang", "wenquanyi", "noto", "source"]
                    ):
                        has_chinese_font = True
                        break
                except:
                    continue

            # 如果没有找到中文字体，尝试下载并安装开源中文字体
            if not has_chinese_font:
                try:
                    # 尝试安装字体管理器依赖
                    import tempfile

                    # 创建临时目录下载字体
                    temp_dir = tempfile.mkdtemp()
                    font_url = "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf"
                    font_path = os.path.join(temp_dir, "NotoSansSC-Regular.otf")

                    # 下载开源中文字体
                    import requests

                    response = requests.get(font_url)
                    with open(font_path, "wb") as f:
                        f.write(response.content)

                    # 添加字体到 matplotlib 的字体缓存
                    font_path_obj = fm.FontProperties(fname=font_path)
                    plt.rcParams["font.sans-serif"] = ["Noto Sans SC"] + plt.rcParams["font.sans-serif"]

                    # 清理 matplotlib 字体缓存
                    fm._rebuild()

                    return True
                except Exception as e:
                    print(f"尝试下载并安装中文字体失败: {e}")
                    return False

            return True

        except Exception as e:
            print(f"配置 matplotlib 中文字体失败: {e}")
            return False


# 示例使用方式
if __name__ == "__main__":
    # 配置无窗口模式
    config_status = VisualizationConfig.configure_headless_mode(verbose=True)
    print(f"配置状态: {config_status}")

    # 设置matplotlib样式
    VisualizationConfig.set_matplotlib_style(style="seaborn-v0_8-whitegrid", dpi=120)

    # 测试matplotlib绘图（无窗口模式）
    if VisualizationConfig.is_package_available("matplotlib"):
        import matplotlib.pyplot as plt
        import numpy as np

        # 创建简单图表
        x = np.linspace(0, 10, 100)
        y = np.sin(x)

        plt.figure(figsize=(8, 5))
        plt.plot(x, y)
        plt.title("Test Plot in Headless Mode")
        plt.xlabel("X")
        plt.ylabel("sin(X)")
        plt.grid(True)

        # 保存图表，不显示窗口
        plt.savefig("test_headless_plot.png")
        print("图表已保存为 test_headless_plot.png")
