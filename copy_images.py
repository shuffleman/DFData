# -*- coding: utf-8 -*-
"""
将图片复制到数据目录
"""
import os
import shutil

source = r'E:\Workspace\DFData\images'
target = r'E:\Workspace\DFData\normalized_data\images'

print("正在复制图片到数据目录...")
print(f"源目录: {source}")
print(f"目标目录: {target}")

if os.path.exists(target):
    print("目标目录已存在，将被覆盖")
    shutil.rmtree(target)

shutil.copytree(source, target)

# 统计文件数
total_files = 0
for root, dirs, files in os.walk(target):
    total_files += len([f for f in files if f.endswith(('.png', '.jpg', '.jpeg'))])

print(f"\n复制完成！共复制 {total_files} 个图片文件")
print(f"\n目录结构:")
for item in os.listdir(target):
    item_path = os.path.join(target, item)
    if os.path.isdir(item_path):
        count = len([f for f in os.listdir(item_path) if f.endswith(('.png', '.jpg', '.jpeg'))])
        print(f"  {item}/  - {count} 张图片")
    else:
        print(f"  {item}")
