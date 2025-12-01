#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from time import sleep

def load_json(filepath):
    """加载JSON文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def download_image(item):
    """下载单个图片"""
    try:
        object_id = item['objectID']
        category = item['category']
        url = item['url']
        img_type = item['type']

        # 创建目录
        save_dir = Path(f'normalized_data/images/{category}')
        save_dir.mkdir(parents=True, exist_ok=True)

        # 文件名
        if img_type == 'preview':
            filename = f'{object_id}_preview.png'
        else:
            filename = f'{object_id}.png'

        save_path = save_dir / filename

        # 如果文件已存在，跳过
        if save_path.exists():
            return {
                'success': True,
                'skipped': True,
                'objectID': object_id,
                'name': item['objectName'],
                'path': str(save_path)
            }

        # 下载图片
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # 保存图片
        with open(save_path, 'wb') as f:
            f.write(response.content)

        return {
            'success': True,
            'skipped': False,
            'objectID': object_id,
            'name': item['objectName'],
            'path': str(save_path)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'objectID': item.get('objectID', 'unknown'),
            'name': item.get('objectName', 'unknown'),
            'url': item.get('url', '')
        }

def main():
    print("正在读取图片URL列表...")
    image_urls = load_json('props_image_urls.json')

    print(f"总共需要下载 {len(image_urls)} 个图片")
    print("开始下载...\n")

    # 统计
    success_count = 0
    skipped_count = 0
    failed_count = 0
    failed_items = []

    # 使用线程池并发下载
    max_workers = 10
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_image, item): item for item in image_urls}

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()

            if result['success']:
                if result.get('skipped'):
                    skipped_count += 1
                    print(f"[{i}/{len(image_urls)}] Skipped: {result['name']}")
                else:
                    success_count += 1
                    print(f"[{i}/{len(image_urls)}] Downloaded: {result['name']}")
            else:
                failed_count += 1
                failed_items.append(result)
                print(f"[{i}/{len(image_urls)}] Failed: {result['name']} - {result['error']}")

            # 避免请求过快
            if i % 20 == 0:
                sleep(0.5)

    print("\n" + "="*60)
    print("图片下载完成！")
    print("="*60)
    print(f"成功下载: {success_count}")
    print(f"已存在跳过: {skipped_count}")
    print(f"下载失败: {failed_count}")
    print("="*60)

    # 如果有失败的，保存到文件
    if failed_items:
        print("\n失败的图片列表:")
        for item in failed_items[:10]:  # 只显示前10个
            print(f"  - {item['name']} (ID: {item['objectID']}): {item['error']}")

        with open('failed_downloads.json', 'w', encoding='utf-8') as f:
            json.dump(failed_items, f, ensure_ascii=False, indent=2)
        print(f"\n完整失败列表已保存到 failed_downloads.json")

if __name__ == '__main__':
    main()
