# -*- coding: utf-8 -*-
"""
下载所有物品图片
从 items_catalog.json 中提取图片链接并下载
"""
import json
import os
import requests
from urllib.parse import urlparse
from pathlib import Path
import time
from collections import defaultdict

# 配置
CATALOG_FILE = r'E:\Workspace\DFData\normalized_data\items_catalog.json'
OUTPUT_DIR = r'E:\Workspace\DFData\images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 请求配置
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
TIMEOUT = 30
RETRY_TIMES = 3
DELAY = 0.5  # 每次下载间隔（秒）

print("正在加载物品目录...")
with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
    catalog_data = json.load(f)

items = catalog_data['items']
print(f"已加载 {len(items)} 个物品\n")

# 按类别组织图片链接
category_images = defaultdict(list)
all_images = []

for object_id, item in items.items():
    if item.get('picture'):
        image_info = {
            'objectID': object_id,
            'id': item['id'],
            'name': item['objectName'],
            'category': item['category'],
            'url': item['picture']
        }
        category_images[item['category']].append(image_info)
        all_images.append(image_info)

# 统计信息
print("=" * 80)
print("图片统计")
print("=" * 80)
total_images = len(all_images)
print(f"\n总图片数: {total_images}\n")
print("按类别分布:")
for category, images in sorted(category_images.items()):
    print(f"  {category:15} - {len(images):3} 张")

# 创建类别文件夹
category_folders = {
    'weapon': 'weapons',
    'accessory': 'accessories',
    'ammunition': 'ammunitions',
    'helmet': 'helmets',
    'armor': 'armors',
    'chest': 'chests',
    'backpack': 'backpacks'
}

for category, folder_name in category_folders.items():
    os.makedirs(os.path.join(OUTPUT_DIR, folder_name), exist_ok=True)

# 下载函数
def download_image(image_info, retry=0):
    """下载单个图片"""
    url = image_info['url']
    category = image_info['category']
    object_id = image_info['objectID']
    name = image_info['name']

    # 生成文件名（只使用 objectID）
    # 从 URL 获取扩展名
    parsed_url = urlparse(url)
    ext = os.path.splitext(parsed_url.path)[1] or '.png'

    # 文件名：objectID.ext
    filename = f"{object_id}{ext}"

    # 保存路径
    folder_name = category_folders.get(category, 'others')
    filepath = os.path.join(OUTPUT_DIR, folder_name, filename)

    # 如果文件已存在，跳过
    if os.path.exists(filepath):
        return 'exists', filepath

    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True)
        response.raise_for_status()

        # 保存文件
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return 'success', filepath

    except Exception as e:
        if retry < RETRY_TIMES:
            time.sleep(1)
            return download_image(image_info, retry + 1)
        else:
            return 'failed', str(e)

# 开始下载
print("\n" + "=" * 80)
print("开始下载图片")
print("=" * 80)

success_count = 0
failed_count = 0
exists_count = 0
failed_list = []

for i, image_info in enumerate(all_images, 1):
    name = image_info['name']
    category = image_info['category']

    print(f"\n[{i}/{total_images}] 正在下载: {name} ({category})")

    status, result = download_image(image_info)

    if status == 'success':
        success_count += 1
        print(f"  [OK] 下载成功: {os.path.basename(result)}")
    elif status == 'exists':
        exists_count += 1
        print(f"  [SKIP] 已存在: {os.path.basename(result)}")
    else:
        failed_count += 1
        failed_list.append({
            'name': name,
            'url': image_info['url'],
            'error': result
        })
        print(f"  [FAIL] 下载失败: {result}")

    # 延迟，避免请求过快
    if i < total_images and status == 'success':
        time.sleep(DELAY)

# 保存失败列表
if failed_list:
    failed_file = os.path.join(OUTPUT_DIR, 'failed_downloads.json')
    with open(failed_file, 'w', encoding='utf-8') as f:
        json.dump(failed_list, f, ensure_ascii=False, indent=2)
    print(f"\n失败列表已保存到: {failed_file}")

# 生成下载报告
print("\n" + "=" * 80)
print("下载完成")
print("=" * 80)
print(f"\n总计: {total_images} 张图片")
print(f"  新下载: {success_count} 张")
print(f"  已存在: {exists_count} 张")
print(f"  失败: {failed_count} 张")

if failed_count > 0:
    print(f"\n失败率: {failed_count/total_images*100:.1f}%")

# 统计各类别下载情况
print("\n按类别统计:")
for category, folder_name in sorted(category_folders.items()):
    folder_path = os.path.join(OUTPUT_DIR, folder_name)
    if os.path.exists(folder_path):
        count = len([f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))])
        expected = len(category_images.get(category, []))
        print(f"  {folder_name:15} - {count:3}/{expected:3} 张")

# 生成图片索引
print("\n生成图片索引...")
image_index = {
    "metadata": {
        "total": total_images,
        "downloaded": success_count + exists_count,
        "failed": failed_count,
        "categories": {}
    },
    "images": {}
}

for image_info in all_images:
    object_id = image_info['objectID']
    category = image_info['category']
    folder_name = category_folders.get(category, 'others')

    parsed_url = urlparse(image_info['url'])
    ext = os.path.splitext(parsed_url.path)[1] or '.png'
    filename = f"{object_id}{ext}"

    local_path = f"{folder_name}/{filename}"

    image_index['images'][object_id] = {
        'id': image_info['id'],
        'name': image_info['name'],
        'category': category,
        'url': image_info['url'],
        'localPath': local_path,
        'exists': os.path.exists(os.path.join(OUTPUT_DIR, local_path))
    }

# 统计各类别
for category, images in category_images.items():
    image_index['metadata']['categories'][category] = len(images)

# 保存索引
index_file = os.path.join(OUTPUT_DIR, 'image_index.json')
with open(index_file, 'w', encoding='utf-8') as f:
    json.dump(image_index, f, ensure_ascii=False, indent=2)

print(f"  [OK] 图片索引已保存: image_index.json")

# 生成 README
readme_content = f"""# 游戏物品图片库

## 📊 统计信息

- **总图片数**: {total_images} 张
- **下载成功**: {success_count + exists_count} 张
- **下载失败**: {failed_count} 张
- **下载时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}

## 📁 文件结构

```
images/
├── weapons/         - 武器图片 ({len(category_images.get('weapon', []))} 张)
├── accessories/     - 配件图片 ({len(category_images.get('accessory', []))} 张)
├── ammunitions/     - 弹药图片 ({len(category_images.get('ammunition', []))} 张)
├── helmets/         - 头盔图片 ({len(category_images.get('helmet', []))} 张)
├── armors/          - 护甲图片 ({len(category_images.get('armor', []))} 张)
├── chests/          - 胸挂图片 ({len(category_images.get('chest', []))} 张)
├── backpacks/       - 背包图片 ({len(category_images.get('backpack', []))} 张)
├── image_index.json - 图片索引文件
└── README.md        - 本文件
```

## 🔍 文件命名规则

所有图片文件按以下格式命名：
```
{{objectID}}.{{扩展名}}
```

例如：
- `18060000011.png` - AWM狙击步枪
- `13130000188.png` - 消音枪口制退器

**注意**: 文件名只包含 objectID，不包含物品名称。可通过 image_index.json 查询 objectID 对应的物品信息。

## 📖 使用 image_index.json

image_index.json 包含所有图片的映射信息：

```json
{{
  "metadata": {{
    "total": {total_images},
    "downloaded": {success_count + exists_count},
    "failed": {failed_count},
    "categories": {{ ... }}
  }},
  "images": {{
    "objectID": {{
      "id": 内部ID,
      "name": "物品名称",
      "category": "类别",
      "url": "原始图片URL",
      "localPath": "本地相对路径",
      "exists": true/false
    }}
  }}
}}
```

### Python 使用示例

```python
import json

# 加载图片索引
with open('image_index.json', 'r', encoding='utf-8') as f:
    index = json.load(f)

# 查找某个物品的图片
object_id = '18060000011'
image_info = index['images'][object_id]
print(f"物品: {{image_info['name']}}")
print(f"图片路径: {{image_info['localPath']}}")

# 获取所有武器图片
weapon_images = [
    img for img in index['images'].values()
    if img['category'] == 'weapon'
]
print(f"武器图片数: {{len(weapon_images)}}")
```

### JavaScript 使用示例

```javascript
const index = require('./image_index.json');

// 获取图片路径
const objectId = '18060000011';
const imagePath = index.images[objectId].localPath;
console.log(`图片路径: ${{imagePath}}`);

// 在 Web 中使用
const imageUrl = `./images/${{imagePath}}`;
document.getElementById('weapon-img').src = imageUrl;
```

## 🔄 重新下载

如果需要重新下载失败的图片，运行：
```bash
python download_images.py
```

脚本会自动跳过已存在的图片，只下载缺失的。

## 📝 注意事项

1. 图片来源于原始数据库中的 picture 字段
2. 所有图片均来自 `33413493.s21i.faiusr.com` 域名
3. 图片格式主要为 PNG
4. 文件名中的特殊字符已被移除，仅保留字母、数字和常见符号

---
生成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}
"""

readme_file = os.path.join(OUTPUT_DIR, 'README.md')
with open(readme_file, 'w', encoding='utf-8') as f:
    f.write(readme_content)

print(f"  [OK] README 已生成: README.md")

print("\n" + "=" * 80)
print(f"所有文件已保存到: {OUTPUT_DIR}")
print("=" * 80)
print("\n生成的文件:")
print(f"  - image_index.json  - 图片索引")
print(f"  - README.md         - 使用说明")
if failed_count > 0:
    print(f"  - failed_downloads.json - 失败列表")
print(f"\n共 {len(category_folders)} 个类别文件夹，{total_images} 张图片")
print("\n")
