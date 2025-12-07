#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
三角洲舔包模拟器 - 启动器
Delta Force Loot Simulator Launcher
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time

PORT = 8888
DIST_DIR = "dist"


def get_dist_path():
    """获取 dist 目录的绝对路径"""
    if getattr(sys, 'frozen', False):
        # 如果是打包后的 exe
        base_path = sys._MEIPASS
    else:
        # 如果是源代码运行
        base_path = os.path.dirname(os.path.abspath(__file__))

    return os.path.join(base_path, DIST_DIR)


def open_browser():
    """延迟打开浏览器"""
    time.sleep(1)  # 等待服务器启动
    url = f"http://localhost:{PORT}"
    print(f"\n正在打开浏览器访问: {url}")
    webbrowser.open(url)


def main():
    dist_path = get_dist_path()

    # 检查 dist 目录是否存在
    if not os.path.exists(dist_path):
        print(f"错误: 找不到 dist 目录: {dist_path}")
        print("请确保已运行 npm run build 构建项目")
        input("按回车键退出...")
        sys.exit(1)

    # 切换到 dist 目录
    os.chdir(dist_path)

    # 创建 HTTP 服务器
    Handler = http.server.SimpleHTTPRequestHandler

    print("=" * 60)
    print("三角洲舔包模拟器 - Delta Force Loot Simulator")
    print("=" * 60)
    print(f"服务器启动中...")
    print(f"端口: {PORT}")
    print(f"目录: {dist_path}")
    print("-" * 60)

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # 在新线程中打开浏览器
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()

            print(f"[OK] 服务器已启动: http://localhost:{PORT}")
            print("-" * 60)
            print("提示:")
            print("  - 浏览器将自动打开")
            print("  - 如果未自动打开,请手动访问上述地址")
            print("  - 按 Ctrl+C 可以停止服务器")
            print("=" * 60)
            print("")

            # 启动服务器
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n服务器已停止")
    except OSError as e:
        if e.errno == 10048:  # Windows: 端口已被占用
            print(f"\n错误: 端口 {PORT} 已被占用")
            print("请关闭占用该端口的程序,或修改 launcher.py 中的 PORT 变量")
        else:
            print(f"\n错误: {e}")
        input("按回车键退出...")
        sys.exit(1)


if __name__ == "__main__":
    main()
