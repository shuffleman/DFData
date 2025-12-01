# -*- coding: utf-8 -*-
"""
生成下载状态报告
"""
import os
import json

IMAGES_DIR = r'E:\Workspace\DFData\images'
CATALOG_FILE = r'E:\Workspace\DFData\normalized_data\items_catalog.json'

# 获取预期数量
with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

expected_counts = {
    'weapons': 0,
    'accessories': 0,
    'ammunitions': 0,
    'helmets': 0,
    'armors': 0,
    'chests': 0,
    'backpacks': 0
}

for item in catalog['items'].values():
    cat = item['category']
    if cat == 'weapon':
        expected_counts['weapons'] += 1
    elif cat == 'accessory':
        expected_counts['accessories'] += 1
    elif cat == 'ammunition':
        expected_counts['ammunitions'] += 1
    elif cat == 'helmet':
        expected_counts['helmets'] += 1
    elif cat == 'armor':
        expected_counts['armors'] += 1
    elif cat == 'chest':
        expected_counts['chests'] += 1
    elif cat == 'backpack':
        expected_counts['backpacks'] += 1

# 统计已下载
actual_counts = {}
total_downloaded = 0

if os.path.exists(IMAGES_DIR):
    for folder in os.listdir(IMAGES_DIR):
        folder_path = os.path.join(IMAGES_DIR, folder)
        if os.path.isdir(folder_path):
            count = len([f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))])
            actual_counts[folder] = count
            total_downloaded += count

total_expected = sum(expected_counts.values())

print("=" * 60)
print("图片下载状态报告")
print("=" * 60)
print(f"\n总进度: {total_downloaded}/{total_expected} ({total_downloaded/total_expected*100:.1f}%)\n")
print(f"{'类别':<15} {'已下载':<10} {'总数':<10} {'进度'}")
print("-" * 60)

for folder, expected in expected_counts.items():
    actual = actual_counts.get(folder, 0)
    progress = actual / expected * 100 if expected > 0 else 0
    status = '[完成]' if actual >= expected else '[进行中]' if actual > 0 else '[等待]'
    print(f"{folder:<15} {actual:<10} {expected:<10} {progress:5.1f}% {status}")

print("-" * 60)
print(f"{'合计':<15} {total_downloaded:<10} {total_expected:<10} {total_downloaded/total_expected*100:5.1f}%")
print()
