# -*- coding: utf-8 -*-
"""
数据优化和分类管理脚本
将大型 JSON 文件拆分为多个分类管理的文件
"""
import json
import os
from datetime import datetime

# 创建输出目录
OUTPUT_DIR = r'E:\Workspace\DFData\optimized_data'
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("正在加载原始数据...")
with open(r'E:\Workspace\DFData\data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("数据加载完成，开始优化和分类...")

# ============================================================================
# 1. 武器数据 (Weapons)
# ============================================================================
print("\n处理武器数据...")
weapons_data = {
    "metadata": {
        "category": "weapons",
        "description": "所有武器及其属性数据",
        "count": len(data['weapons']),
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "categories": data['weaponCategories'],
    "items": data['weapons']
}

with open(os.path.join(OUTPUT_DIR, 'weapons.json'), 'w', encoding='utf-8') as f:
    json.dump(weapons_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存 {len(data['weapons'])} 把武器")

# ============================================================================
# 2. 配件数据 (Accessories)
# ============================================================================
print("\n处理配件数据...")
accessories_data = {
    "metadata": {
        "category": "accessories",
        "description": "所有枪械配件及其属性数据",
        "count": len(data['accessories']),
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "categories": data['accessoryCategories'],
    "items": data['accessories']
}

with open(os.path.join(OUTPUT_DIR, 'accessories.json'), 'w', encoding='utf-8') as f:
    json.dump(accessories_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存 {len(data['accessories'])} 个配件")

# ============================================================================
# 3. 弹药数据 (Ammunitions)
# ============================================================================
print("\n处理弹药数据...")
ammunitions_data = {
    "metadata": {
        "category": "ammunitions",
        "description": "所有弹药类型及属性数据",
        "count": len(data['ammunitions']),
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "items": data['ammunitions']
}

with open(os.path.join(OUTPUT_DIR, 'ammunitions.json'), 'w', encoding='utf-8') as f:
    json.dump(ammunitions_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存 {len(data['ammunitions'])} 种弹药")

# ============================================================================
# 4. 防护装备数据 (Protection Gear)
# ============================================================================
print("\n处理防护装备数据...")
protection_data = {
    "metadata": {
        "category": "protection",
        "description": "防护装备（头盔、护甲、胸挂、背包）",
        "counts": {
            "helmets": len(data['helmets']),
            "armors": len(data['armors']),
            "chests": len(data['chests']),
            "backpacks": len(data['backpacks'])
        },
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "helmets": data['helmets'],
    "armors": data['armors'],
    "chests": data['chests'],
    "backpacks": data['backpacks']
}

with open(os.path.join(OUTPUT_DIR, 'protection_gear.json'), 'w', encoding='utf-8') as f:
    json.dump(protection_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存防护装备:")
print(f"    - {len(data['helmets'])} 个头盔")
print(f"    - {len(data['armors'])} 件护甲")
print(f"    - {len(data['chests'])} 个胸挂")
print(f"    - {len(data['backpacks'])} 个背包")

# ============================================================================
# 5. 插槽配置系统 (Slot System)
# ============================================================================
print("\n处理插槽配置系统...")
slot_system_data = {
    "metadata": {
        "category": "slot_system",
        "description": "武器插槽配置和兼容性系统",
        "counts": {
            "slotTypes": len(data['slotTypes']),
            "weaponSlots": len(data['weaponSlots']),
            "slotAccessories": len(data['slotAccessories']),
            "dynamicSlots": len(data['accessoryDynamicSlots'])
        },
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "slotTypes": data['slotTypes'],
    "weaponSlots": data['weaponSlots'],
    "slotAccessories": data['slotAccessories'],
    "accessoryDynamicSlots": data['accessoryDynamicSlots']
}

with open(os.path.join(OUTPUT_DIR, 'slot_system.json'), 'w', encoding='utf-8') as f:
    json.dump(slot_system_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存插槽系统:")
print(f"    - {len(data['slotTypes'])} 种插槽类型")
print(f"    - {len(data['weaponSlots'])} 个武器插槽")
print(f"    - {len(data['slotAccessories'])} 条兼容性配置")
print(f"    - {len(data['accessoryDynamicSlots'])} 个动态插槽")

# ============================================================================
# 6. 索引文件 (Index) - 快速查询
# ============================================================================
print("\n生成索引文件...")

# 武器索引
weapon_index = {}
for weapon in data['weapons']:
    weapon_index[weapon['id']] = {
        'id': weapon['id'],
        'objectID': weapon['objectID'],
        'name': weapon['regular']['objectName'],
        'type': weapon['type'],
        'caliber': weapon['caliber'],
        'price': weapon['regular']['avgPrice']
    }

# 配件索引
accessory_index = {}
for accessory in data['accessories']:
    accessory_index[accessory['id']] = {
        'id': accessory['id'],
        'objectID': accessory['objectID'],
        'name': accessory['regular']['objectName'],
        'type': accessory['type'],
        'price': accessory['regular']['avgPrice']
    }

index_data = {
    "metadata": {
        "category": "index",
        "description": "快速查询索引",
        "exportTime": datetime.now().isoformat(),
        "version": data['metadata']['version']
    },
    "weapons": weapon_index,
    "accessories": accessory_index
}

with open(os.path.join(OUTPUT_DIR, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump(index_data, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已生成索引文件")

# ============================================================================
# 7. 元数据文件 (Metadata)
# ============================================================================
print("\n保存元数据...")
metadata_enhanced = {
    "original_metadata": data['metadata'],
    "optimization_info": {
        "optimizedAt": datetime.now().isoformat(),
        "structure": {
            "weapons.json": "武器数据及分类",
            "accessories.json": "配件数据及分类",
            "ammunitions.json": "弹药数据",
            "protection_gear.json": "防护装备（头盔、护甲、胸挂、背包）",
            "slot_system.json": "插槽配置和兼容性系统",
            "index.json": "快速查询索引"
        },
        "benefits": [
            "文件大小更小，加载更快",
            "按需加载特定类别数据",
            "更清晰的数据组织结构",
            "便于维护和更新",
            "支持独立的版本控制"
        ]
    },
    "statistics": {
        "totalItems": sum([
            len(data['weapons']),
            len(data['accessories']),
            len(data['ammunitions']),
            len(data['helmets']),
            len(data['armors']),
            len(data['chests']),
            len(data['backpacks'])
        ]),
        "categories": {
            "weapons": len(data['weapons']),
            "accessories": len(data['accessories']),
            "ammunitions": len(data['ammunitions']),
            "helmets": len(data['helmets']),
            "armors": len(data['armors']),
            "chests": len(data['chests']),
            "backpacks": len(data['backpacks'])
        }
    }
}

with open(os.path.join(OUTPUT_DIR, 'metadata.json'), 'w', encoding='utf-8') as f:
    json.dump(metadata_enhanced, f, ensure_ascii=False, indent=2)
print(f"  [OK] 已保存元数据")

# ============================================================================
# 8. 生成 README
# ============================================================================
print("\n生成文档...")
readme_content = """# 优化后的游戏装备数据库

## 📁 文件结构

### 核心数据文件

| 文件名 | 说明 | 数据量 |
|--------|------|--------|
| `weapons.json` | 武器数据及分类 | {weapon_count} 把武器 |
| `accessories.json` | 配件数据及分类 | {accessory_count} 个配件 |
| `ammunitions.json` | 弹药数据 | {ammo_count} 种弹药 |
| `protection_gear.json` | 防护装备 | {helmet_count} 头盔 + {armor_count} 护甲 + {chest_count} 胸挂 + {backpack_count} 背包 |
| `slot_system.json` | 插槽配置系统 | {slot_count} 插槽类型, {weapon_slot_count} 武器插槽 |
| `index.json` | 快速查询索引 | 武器和配件索引 |
| `metadata.json` | 元数据和统计信息 | 数据库版本和统计 |

## 🎯 优化说明

### 相比原始数据的改进

1. **模块化设计**
   - 将 2.3MB 的单一文件拆分为多个专门文件
   - 每个文件负责特定领域的数据
   - 支持按需加载，提升性能

2. **更好的数据组织**
   - 每个文件都包含独立的 metadata
   - 相关数据归类在一起（如防护装备）
   - 清晰的层次结构

3. **快速索引**
   - 提供独立的索引文件用于快速查询
   - 减少完整数据加载的需求

4. **易于维护**
   - 独立文件便于版本控制
   - 更新某类数据不影响其他数据
   - 便于团队协作

## 📊 数据统计

- **总物品数**: {total_items}
- **数据版本**: {version}
- **导出时间**: {export_time}

## 🔧 使用方式

### Python 示例

```python
import json

# 只加载武器数据
with open('weapons.json', 'r', encoding='utf-8') as f:
    weapons = json.load(f)
    print(f"加载了 {{weapons['metadata']['count']}} 把武器")

# 使用索引快速查询
with open('index.json', 'r', encoding='utf-8') as f:
    index = json.load(f)
    weapon = index['weapons']['10756']  # 通过 ID 快速查询
    print(weapon['name'])
```

### JavaScript 示例

```javascript
// Node.js
const weapons = require('./weapons.json');
console.log(`加载了 ${{weapons.metadata.count}} 把武器`);

// 使用索引
const index = require('./index.json');
const weapon = index.weapons['10756'];
console.log(weapon.name);
```

## 📝 数据结构说明

### weapons.json
```json
{{
  "metadata": {{ ... }},
  "categories": [ ... ],  // 武器分类
  "items": [ ... ]        // 武器列表
}}
```

### accessories.json
```json
{{
  "metadata": {{ ... }},
  "categories": [ ... ],  // 配件分类
  "items": [ ... ]        // 配件列表
}}
```

### slot_system.json
```json
{{
  "metadata": {{ ... }},
  "slotTypes": [ ... ],              // 插槽类型定义
  "weaponSlots": [ ... ],            // 武器插槽配置
  "slotAccessories": [ ... ],        // 插槽-配件兼容性
  "accessoryDynamicSlots": [ ... ]   // 动态插槽系统
}}
```

---
优化时间: {export_time}
""".format(
    weapon_count=len(data['weapons']),
    accessory_count=len(data['accessories']),
    ammo_count=len(data['ammunitions']),
    helmet_count=len(data['helmets']),
    armor_count=len(data['armors']),
    chest_count=len(data['chests']),
    backpack_count=len(data['backpacks']),
    slot_count=len(data['slotTypes']),
    weapon_slot_count=len(data['weaponSlots']),
    total_items=metadata_enhanced['statistics']['totalItems'],
    version=data['metadata']['version'],
    export_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
)

with open(os.path.join(OUTPUT_DIR, 'README.md'), 'w', encoding='utf-8') as f:
    f.write(readme_content)
print(f"  [OK] 已生成 README.md")

print("\n" + "=" * 80)
print("数据优化完成！")
print("=" * 80)
print(f"\n输出目录: {OUTPUT_DIR}")
print("\n生成的文件:")
for filename in os.listdir(OUTPUT_DIR):
    filepath = os.path.join(OUTPUT_DIR, filename)
    size = os.path.getsize(filepath) / 1024  # KB
    print(f"  - {filename:25} ({size:8.2f} KB)")
print("\n")
