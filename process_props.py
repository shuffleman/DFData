#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
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
    print("正在读取 price.json...")
    props_data = load_json('price.json')

    if not isinstance(props_data, list):
        print("错误：price.json 不是数组格式")
        return

    print(f"总共 {len(props_data)} 个物品")

    # 按 secondClass 分类
    collections = []  # 收集品
    consumables = []  # 消耗品
    others = []       # 其他

    for item in props_data:
        second_class = item.get('secondClass', '')
        if second_class == 'collection':
            collections.append(item)
        elif second_class == 'consume':
            consumables.append(item)
        else:
            others.append(item)

    print(f"\n分类统计:")
    print(f"  收集品: {len(collections)}")
    print(f"  消耗品: {len(consumables)}")
    print(f"  其他: {len(others)}")

    # 创建 normalized_data 目录（如果不存在）
    normalized_dir = Path('normalized_data')
    normalized_dir.mkdir(exist_ok=True)

    # 处理收集品数据 - 转换为标准格式
    print("\n正在处理收集品数据...")
    collectibles_items = []
    collectibles_catalog = {}

    for item in collections:
        object_id = item['objectID']

        # 提取专业属性
        spec_item = {
            'objectID': object_id,
            'id': item.get('id'),
            'category': 'collectible',
            'length': item.get('length'),
            'width': item.get('width'),
            'weight': item.get('weight'),
            'type': item.get('propsDetail', {}).get('type', ''),
            'source': item.get('propsDetail', {}).get('propsSource', ''),
            'desc': item.get('desc', '')
        }
        collectibles_items.append(spec_item)

        # 添加到目录
        collectibles_catalog[str(object_id)] = {
            'id': item.get('id'),
            'objectID': object_id,
            'category': 'collectible',
            'objectName': item.get('objectName', ''),
            'avgPrice': item.get('avgPrice', 0),
            'grade': item.get('grade', 0),
            'picture': item.get('pic', '')
        }

    # 保存收集品数据
    collectibles_spec = {
        'metadata': {
            'version': '1.0',
            'description': '收集品专业属性数据',
            'counts': {
                'total': len(collectibles_items)
            }
        },
        'items': collectibles_items
    }
    save_json(normalized_dir / 'collectibles_spec.json', collectibles_spec)
    print(f"  已保存 {len(collectibles_items)} 个收集品到 collectibles_spec.json")

    # 处理消耗品数据 - 转换为标准格式
    print("\n正在处理消耗品数据...")
    consumables_items = []
    consumables_catalog = {}

    for item in consumables:
        object_id = item['objectID']

        # 提取专业属性
        spec_item = {
            'objectID': object_id,
            'id': item.get('id'),
            'category': 'consumable',
            'length': item.get('length'),
            'width': item.get('width'),
            'weight': item.get('weight'),
            'thirdClass': item.get('thirdClass', ''),
            'thirdClassCN': item.get('thirdClassCN', ''),
            'desc': item.get('desc', ''),
            'propsDetail': item.get('propsDetail', {})
        }
        consumables_items.append(spec_item)

        # 添加到目录
        consumables_catalog[str(object_id)] = {
            'id': item.get('id'),
            'objectID': object_id,
            'category': 'consumable',
            'objectName': item.get('objectName', ''),
            'avgPrice': item.get('avgPrice', 0),
            'grade': item.get('grade', 0),
            'picture': item.get('pic', '')
        }

    # 保存消耗品数据
    consumables_spec = {
        'metadata': {
            'version': '1.0',
            'description': '消耗品专业属性数据',
            'counts': {
                'total': len(consumables_items)
            }
        },
        'items': consumables_items
    }
    save_json(normalized_dir / 'consumables_spec.json', consumables_spec)
    print(f"  已保存 {len(consumables_items)} 个消耗品到 consumables_spec.json")

    # 更新 items_catalog.json
    print("\n正在更新物品目录...")
    catalog_path = normalized_dir / 'items_catalog.json'

    if catalog_path.exists():
        catalog_data = load_json(catalog_path)
        existing_items = catalog_data.get('items', {})
    else:
        existing_items = {}

    # 合并收集品和消耗品目录
    existing_items.update(collectibles_catalog)
    existing_items.update(consumables_catalog)

    catalog_data = {
        'metadata': {
            'version': '1.0',
            'description': '物品总目录'
        },
        'items': existing_items
    }

    save_json(catalog_path, catalog_data)
    print(f"  物品目录已更新，总计 {len(existing_items)} 个物品")

    # 生成图片下载列表
    print("\n正在生成图片下载列表...")
    image_urls = []

    for item in collections + consumables:
        object_id = item['objectID']
        pic_url = item.get('pic', '')
        pre_pic_url = item.get('prePic', '')

        if pic_url:
            image_urls.append({
                'objectID': object_id,
                'objectName': item.get('objectName', ''),
                'category': 'collectibles' if item in collections else 'consumables',
                'url': pic_url,
                'type': 'main'
            })

        if pre_pic_url:
            image_urls.append({
                'objectID': object_id,
                'objectName': item.get('objectName', ''),
                'category': 'collectibles' if item in collections else 'consumables',
                'url': pre_pic_url,
                'type': 'preview'
            })

    # 保存图片URL列表
    save_json('props_image_urls.json', image_urls)
    print(f"  已生成 {len(image_urls)} 个图片URL到 props_image_urls.json")

    print("\n" + "="*60)
    print("数据处理完成！")
    print("="*60)
    print(f"收集品数据: normalized_data/collectibles_spec.json ({len(collectibles_items)} 个)")
    print(f"消耗品数据: normalized_data/consumables_spec.json ({len(consumables_items)} 个)")
    print(f"物品目录: normalized_data/items_catalog.json ({len(existing_items)} 个)")
    print(f"图片URL列表: props_image_urls.json ({len(image_urls)} 个)")
    print("="*60)

if __name__ == '__main__':
    main()
