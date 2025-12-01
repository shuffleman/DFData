#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path

def load_json(filepath):
    """加载JSON文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    """保存JSON文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    # 读取源文件
    print("正在读取源文件...")
    accessories = load_json('配件.json')
    weapons = load_json('武器.json')
    equipment = load_json('装备.json')

    # 构建价格映射表 {objectID: avgPrice}
    price_map = {}

    # 从配件.json提取价格
    if isinstance(accessories, list):
        for item in accessories:
            if 'objectID' in item and 'avgPrice' in item:
                price_map[str(item['objectID'])] = item['avgPrice']

    # 从武器.json提取价格
    if isinstance(weapons, list):
        for item in weapons:
            if 'objectID' in item and 'avgPrice' in item:
                price_map[str(item['objectID'])] = item['avgPrice']

    # 从装备.json提取价格
    if isinstance(equipment, list):
        for item in equipment:
            if 'objectID' in item and 'avgPrice' in item:
                price_map[str(item['objectID'])] = item['avgPrice']

    print(f"从源文件中提取了 {len(price_map)} 个物品的价格数据")

    # 读取现有的items_catalog.json
    catalog_path = 'normalized_data/items_catalog.json'
    print(f"\n正在读取 {catalog_path}...")
    catalog_data = load_json(catalog_path)

    items = catalog_data.get('items', {})

    # 统计
    total_items = len(items)
    missing_price_count = 0
    updated_count = 0

    # 补充缺失的价格
    print("\n正在补充价格数据...")
    for object_id, item in items.items():
        object_id_str = str(object_id)

        # 如果当前价格为空或为0，尝试从源文件补充
        current_price = item.get('avgPrice')
        if current_price is None or current_price == 0:
            missing_price_count += 1

            # 从价格映射表中查找
            if object_id_str in price_map:
                new_price = price_map[object_id_str]
                item['avgPrice'] = new_price
                updated_count += 1
                print(f"  更新 {item.get('objectName', object_id)}: {new_price}")

    # 保存更新后的数据
    print(f"\n正在保存更新后的数据到 {catalog_path}...")
    save_json(catalog_path, catalog_data)

    # 输出统计信息
    print("\n" + "="*60)
    print("价格补充完成！")
    print("="*60)
    print(f"总物品数: {total_items}")
    print(f"缺失价格的物品数: {missing_price_count}")
    print(f"成功补充的物品数: {updated_count}")
    print(f"仍然缺失价格的物品数: {missing_price_count - updated_count}")
    print("="*60)

    # 如果还有缺失价格的物品，列出前10个
    if missing_price_count - updated_count > 0:
        print("\n仍然缺失价格的物品（前10个）：")
        count = 0
        for object_id, item in items.items():
            current_price = item.get('avgPrice')
            if (current_price is None or current_price == 0) and count < 10:
                print(f"  - {item.get('objectName', '未知')} (ID: {object_id})")
                count += 1

if __name__ == '__main__':
    main()
