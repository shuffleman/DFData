# -*- coding: utf-8 -*-
"""
监控图片下载进度
"""
import os
import time
import json

IMAGES_DIR = r'E:\Workspace\DFData\images'
CATALOG_FILE = r'E:\Workspace\DFData\normalized_data\items_catalog.json'

# 获取总数
with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
    catalog = json.load(f)
    total = len(catalog['items'])

print(f"总图片数: {total}\n")
print("监控下载进度（按 Ctrl+C 停止）...\n")

try:
    last_count = 0
    while True:
        # 统计已下载的图片
        count = 0
        category_counts = {}

        if os.path.exists(IMAGES_DIR):
            for category_folder in os.listdir(IMAGES_DIR):
                folder_path = os.path.join(IMAGES_DIR, category_folder)
                if os.path.isdir(folder_path):
                    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f)) and f.endswith(('.png', '.jpg', '.jpeg'))]
                    category_counts[category_folder] = len(files)
                    count += len(files)

        # 显示进度
        progress = count / total * 100 if total > 0 else 0
        print(f"\r已下载: {count}/{total} ({progress:.1f}%) ", end='')

        # 如果数量有变化，显示详细信息
        if count != last_count:
            print(f"\n按类别:")
            for category, cat_count in sorted(category_counts.items()):
                print(f"  {category:15} - {cat_count:3} 张")
            print()
            last_count = count

        # 如果完成，退出
        if count >= total:
            print("\n\n下载完成！")
            break

        time.sleep(5)  # 每5秒检查一次

except KeyboardInterrupt:
    print(f"\n\n已停止监控。当前进度: {count}/{total}")
