# -*- coding: utf-8 -*-
import json
from collections import defaultdict, Counter

# 加载数据
print("正在加载数据...")
with open(r'E:\Workspace\DFData\data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=' * 80)
print('【数据关联关系深度分析】')
print('=' * 80)

# 1. 武器-配件兼容性分析
print('\n=== 武器-配件兼容性矩阵 ===\n')

weapons = {w['id']: w for w in data['weapons']}
accessories = {a['id']: a for a in data['accessories']}
slot_accessories = data['slotAccessories']
weapon_slots = data['weaponSlots']

# 构建武器ID到武器插槽的映射
weapon_to_slots = defaultdict(list)
for ws in weapon_slots:
    weapon_to_slots[ws['weaponId']].append(ws)

# 构建插槽ID到可用配件的映射
slot_to_accessories = defaultdict(list)
for sa in slot_accessories:
    slot_to_accessories[sa['slotId']].append(sa)

# 为每个武器统计可用配件数
weapon_accessory_counts = {}
weapon_details = {}

for weapon_id, slots in weapon_to_slots.items():
    total_accessories = set()
    slot_counts = {}

    for slot in slots:
        slot_id = slot['slotId']
        compatible_accs = slot_to_accessories.get(slot_id, [])

        slot_type = slot.get('slotType', 'unknown')
        if slot_type not in slot_counts:
            slot_counts[slot_type] = 0
        slot_counts[slot_type] += 1

        for acc in compatible_accs:
            total_accessories.add(acc['accessoryId'])

    weapon_accessory_counts[weapon_id] = len(total_accessories)
    weapon_details[weapon_id] = {
        'slots': len(slots),
        'accessories': len(total_accessories),
        'slot_types': slot_counts
    }

# 打印武器改装能力排行
print('武器改装能力排行 (Top 10):')
sorted_weapons = sorted(weapon_accessory_counts.items(), key=lambda x: x[1], reverse=True)[:10]

for i, (weapon_id, acc_count) in enumerate(sorted_weapons, 1):
    weapon = weapons.get(weapon_id)
    if weapon:
        weapon_name = weapon['regular']['objectName']
        slots = weapon_details[weapon_id]['slots']
        print(f'{i:2}. {weapon_name:20} - {acc_count:3} 个兼容配件, {slots:2} 个插槽')

# 2. 配件类型与插槽类型的关系
print('\n=== 配件类型分布详情 ===\n')

accessory_type_usage = defaultdict(int)
for sa in slot_accessories:
    acc_id = sa['accessoryId']
    if acc_id in accessories:
        acc_type = accessories[acc_id]['type']
        accessory_type_usage[acc_type] += 1

print('配件类型使用频率:')
for acc_type, count in sorted(accessory_type_usage.items(), key=lambda x: x[1], reverse=True):
    print(f'  {acc_type:15} - {count:4} 次匹配')

# 3. 动态插槽系统分析
print('\n=== 动态插槽系统分析 ===\n')

dynamic_slots = data['accessoryDynamicSlots']

# 分析哪些配件会添加或移除插槽
add_slot_accessories = defaultdict(list)
remove_slot_accessories = defaultdict(list)

for ds in dynamic_slots:
    acc_id = ds['accessoryId']
    acc_name = ds.get('accessoryName', 'Unknown')
    slot_id = ds.get('slotId', 'Unknown')

    if ds['action'] == 'add':
        add_slot_accessories[acc_id].append(slot_id)
    elif ds['action'] == 'remove':
        remove_slot_accessories[acc_id].append(slot_id)

print(f'会添加插槽的配件: {len(add_slot_accessories)} 种')
print(f'会移除插槽的配件: {len(remove_slot_accessories)} 种')

# 找出最复杂的配件（添加或移除多个插槽）
complex_accessories = []
for acc_id in set(list(add_slot_accessories.keys()) + list(remove_slot_accessories.keys())):
    adds = len(add_slot_accessories.get(acc_id, []))
    removes = len(remove_slot_accessories.get(acc_id, []))
    total_changes = adds + removes

    if total_changes > 1:
        acc = accessories.get(acc_id)
        if acc:
            complex_accessories.append({
                'id': acc_id,
                'name': acc['regular']['objectName'],
                'type': acc['type'],
                'adds': adds,
                'removes': removes
            })

complex_accessories.sort(key=lambda x: x['adds'] + x['removes'], reverse=True)

print('\n最复杂的动态插槽配件 (Top 10):')
for i, acc in enumerate(complex_accessories[:10], 1):
    print(f"{i:2}. {acc['name']:30} ({acc['type']:10}) - 添加{acc['adds']}个, 移除{acc['removes']}个插槽")

# 4. 插槽类型分析
print('\n=== 插槽类型统计 ===\n')

slot_types = data['slotTypes']
print(f'插槽类型总数: {len(slot_types)} 种\n')

# 统计每种插槽类型的使用频率
slot_type_usage = Counter(ws['slotId'] for ws in weapon_slots)

print('最常见的插槽类型 (Top 15):')
for i, (slot_id, count) in enumerate(slot_type_usage.most_common(15), 1):
    slot_info = next((st for st in slot_types if st['slotId'] == slot_id), None)
    if slot_info:
        slot_name = slot_info.get('slotName', 'Unknown')
        print(f'{i:2}. {slot_name:30} - 使用 {count:3} 次')

# 5. 武器分类与配件的关系
print('\n=== 武器类型与配件使用分析 ===\n')

weapon_type_accessories = defaultdict(lambda: defaultdict(int))

for weapon_id, details in weapon_details.items():
    weapon = weapons.get(weapon_id)
    if weapon:
        weapon_type = weapon['type']
        weapon_type_accessories[weapon_type]['total_weapons'] += 1
        weapon_type_accessories[weapon_type]['total_accessories'] += details['accessories']
        weapon_type_accessories[weapon_type]['total_slots'] += details['slots']

print('各武器类型的平均改装能力:')
for weapon_type in sorted(weapon_type_accessories.keys()):
    stats = weapon_type_accessories[weapon_type]
    weapon_count = stats['total_weapons']
    avg_accessories = stats['total_accessories'] / weapon_count
    avg_slots = stats['total_slots'] / weapon_count

    print(f'{weapon_type:10} - 平均 {avg_slots:4.1f} 个插槽, {avg_accessories:5.1f} 个兼容配件')

# 6. 口径与弹药分析
print('\n=== 口径-弹药对应关系 ===\n')

ammunitions = data['ammunitions']
caliber_ammo_count = Counter(ammo['caliber'] for ammo in ammunitions)

print('每种口径的弹药种类数:')
for caliber, count in caliber_ammo_count.most_common():
    weapon_count = sum(1 for w in weapons.values() if w['caliber'] == caliber)
    print(f'{caliber:15} - {count:2} 种弹药, {weapon_count:2} 把武器')

# 7. 物品稀有度与价格相关性
print('\n=== 品质等级与价格相关性 ===\n')

grade_prices = defaultdict(list)
for weapon in weapons.values():
    grade = weapon['regular']['grade']
    price = weapon['regular']['avgPrice']
    if price:
        grade_prices[grade].append(price)

for acc in accessories.values():
    grade = acc['regular']['grade']
    price = acc['regular']['avgPrice']
    if price:
        grade_prices[grade].append(price)

print('各品质等级的平均价格:')
for grade in sorted(grade_prices.keys()):
    prices = grade_prices[grade]
    avg_price = sum(prices) / len(prices)
    min_price = min(prices)
    max_price = max(prices)
    print(f'等级 {grade}: 平均 {avg_price:8,.0f} (范围: {min_price:8,} ~ {max_price:8,})')

print('\n' + '=' * 80)
print('关联关系分析完成!')
print('=' * 80)
