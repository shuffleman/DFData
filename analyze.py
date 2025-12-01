# -*- coding: utf-8 -*-
import json
import statistics
from collections import Counter, defaultdict

# 加载数据
print("正在加载数据...")
with open(r'E:\Workspace\DFData\data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=' * 80)
print('【武器数据深度分析】')
print('=' * 80)

weapons = data['weapons']
print(f'\n总计武器数量: {len(weapons)} 把\n')

# 武器类型分布
weapon_types = Counter(w['type'] for w in weapons)
print('武器类型分布:')
for wtype, count in weapon_types.most_common():
    percentage = count/len(weapons)*100
    print(f'  {wtype}: {count} 把 ({percentage:.1f}%)')

# 口径分布
calibers = Counter(w['caliber'] for w in weapons)
print('\n弹药口径分布 (前10):')
for cal, count in calibers.most_common(10):
    print(f'  {cal}: {count} 把')

# 价格统计
prices = [w['regular']['avgPrice'] for w in weapons if w['regular']['avgPrice']]
if prices:
    print(f'\n价格统计:')
    print(f'  最低价: {min(prices):,}')
    print(f'  最高价: {max(prices):,}')
    print(f'  平均价: {statistics.mean(prices):,.0f}')
    print(f'  中位数: {statistics.median(prices):,.0f}')

# 射击模式统计
fire_modes = Counter(w['fireMode'] for w in weapons)
print(f'\n射击模式:')
for mode, count in fire_modes.items():
    print(f'  {mode}: {count} 把')

# 性能参数统计
print(f'\n=== 武器性能参数统计 ===')
params = {
    '肉体伤害': [w['meatHarm'] for w in weapons if w['meatHarm']],
    '破甲伤害': [w['armorHarm'] for w in weapons if w['armorHarm']],
    '后坐力': [w['recoil'] for w in weapons if w['recoil']],
    '控制性': [w['control'] for w in weapons if w['control']],
    '稳定性': [w['stable'] for w in weapons if w['stable']],
    '腰射精度': [w['hipShot'] for w in weapons if w['hipShot']],
    '射程': [w['shootDistance'] for w in weapons if w['shootDistance']],
    '射速': [w['fireSpeed'] for w in weapons if w['fireSpeed']],
    '弹匣容量': [w['capacity'] for w in weapons if w['capacity']],
    '枪口初速': [w['muzzleVelocity'] for w in weapons if w['muzzleVelocity']],
}

for param_name, values in params.items():
    if values:
        print(f'\n{param_name}:')
        print(f'  范围: {min(values)} ~ {max(values)}')
        print(f'  平均: {statistics.mean(values):.1f}')
        print(f'  中位数: {statistics.median(values):.1f}')

# 重量和尺寸
weights = [w['regular']['weight'] for w in weapons if w['regular']['weight']]
widths = [w['regular']['width'] for w in weapons if w['regular']['width']]
heights = [w['regular']['height'] for w in weapons if w['regular']['height']]

print(f'\n=== 物理属性 ===')
print(f'重量: {min(weights):.2f} ~ {max(weights):.2f} kg (平均: {statistics.mean(weights):.2f} kg)')
print(f'宽度: {min(widths)} ~ {max(widths)} 格 (平均: {statistics.mean(widths):.1f} 格)')
print(f'高度: {min(heights)} ~ {max(heights)} 格 (平均: {statistics.mean(heights):.1f} 格)')

# 品质等级分布
grades = Counter(w['regular']['grade'] for w in weapons)
print(f'\n品质等级分布:')
for grade in sorted(grades.keys()):
    count = grades[grade]
    print(f'  等级 {grade}: {count} 把 ({count/len(weapons)*100:.1f}%)')

print('\n' + '=' * 80)
print('【配件数据深度分析】')
print('=' * 80)

accessories = data['accessories']
print(f'\n总计配件数量: {len(accessories)} 件\n')

# 配件类型分布
acc_types = Counter(a['type'] for a in accessories)
print('配件类型分布:')
for atype, count in acc_types.most_common():
    percentage = count/len(accessories)*100
    print(f'  {atype}: {count} 件 ({percentage:.1f}%)')

# 配件价格统计
acc_prices = [a['regular']['avgPrice'] for a in accessories if a['regular']['avgPrice']]
if acc_prices:
    print(f'\n配件价格统计:')
    print(f'  最低价: {min(acc_prices):,}')
    print(f'  最高价: {max(acc_prices):,}')
    print(f'  平均价: {statistics.mean(acc_prices):,.0f}')
    print(f'  中位数: {statistics.median(acc_prices):,.0f}')

# 快速拆卸统计
quick_sep = sum(1 for a in accessories if a.get('quickSeparate'))
print(f'\n快速拆卸配件: {quick_sep} 件 ({quick_sep/len(accessories)*100:.1f}%)')

# 配件品质分布
acc_grades = Counter(a['regular']['grade'] for a in accessories)
print(f'\n配件品质等级分布:')
for grade in sorted(acc_grades.keys()):
    count = acc_grades[grade]
    print(f'  等级 {grade}: {count} 件 ({count/len(accessories)*100:.1f}%)')

print('\n' + '=' * 80)
print('【弹药数据分析】')
print('=' * 80)

ammunitions = data['ammunitions']
print(f'\n总计弹药种类: {len(ammunitions)} 种\n')

# 口径分类
ammo_calibers = Counter(a['caliber'] for a in ammunitions)
print('口径分类:')
for cal, count in ammo_calibers.most_common():
    print(f'  {cal}: {count} 种')

# 穿透等级分布
pen_levels = Counter(a['penetrationLevel'] for a in ammunitions)
print(f'\n穿透等级分布:')
for level in sorted(pen_levels.keys()):
    count = pen_levels[level]
    print(f'  等级 {level}: {count} 种')

# 破甲等级分布
armor_harm_levels = Counter(a['armorHarmLevel'] for a in ammunitions)
print(f'\n破甲等级分布:')
for level, count in armor_harm_levels.most_common():
    print(f'  {level}: {count} 种')

# 伤害系数统计
harm_ratios = [a['harmRatio'] for a in ammunitions if a['harmRatio']]
if harm_ratios:
    print(f'\n伤害系数统计:')
    print(f'  范围: {min(harm_ratios)} ~ {max(harm_ratios)}')
    print(f'  平均: {statistics.mean(harm_ratios):.1f}')

print('\n' + '=' * 80)
print('【防护装备数据分析】')
print('=' * 80)

# 头盔
helmets = data['helmets']
print(f'\n头盔数量: {len(helmets)} 种')
helmet_levels = Counter(h['protectLevel'] for h in helmets)
print('防护等级分布:')
for level in sorted(helmet_levels.keys()):
    count = helmet_levels[level]
    print(f'  等级 {level}: {count} 种')

# 护甲
armors = data['armors']
print(f'\n护甲数量: {len(armors)} 种')
armor_levels = Counter(a['protectLevel'] for a in armors)
print('防护等级分布:')
for level in sorted(armor_levels.keys()):
    count = armor_levels[level]
    print(f'  等级 {level}: {count} 种')

# 背包和胸挂
backpacks = data['backpacks']
chests = data['chests']
print(f'\n背包数量: {len(backpacks)} 种')
print(f'胸挂数量: {len(chests)} 种')

print('\n' + '=' * 80)
print('【插槽系统分析】')
print('=' * 80)

slot_types = data['slotTypes']
weapon_slots = data['weaponSlots']
slot_accessories = data['slotAccessories']
dynamic_slots = data['accessoryDynamicSlots']

print(f'\n插槽类型总数: {len(slot_types)} 种')
print(f'武器插槽配置: {len(weapon_slots)} 条')
print(f'插槽-配件匹配关系: {len(slot_accessories)} 条')
print(f'动态插槽配置: {len(dynamic_slots)} 条')

# 动态插槽动作分析
dynamic_actions = Counter(ds['action'] for ds in dynamic_slots)
print(f'\n动态插槽操作类型:')
for action, count in dynamic_actions.items():
    print(f'  {action}: {count} 条')

# 分析每个武器的平均插槽数
weapon_slot_counts = defaultdict(int)
for ws in weapon_slots:
    weapon_slot_counts[ws['weaponId']] += 1

if weapon_slot_counts:
    avg_slots = statistics.mean(weapon_slot_counts.values())
    max_slots = max(weapon_slot_counts.values())
    min_slots = min(weapon_slot_counts.values())
    print(f'\n武器插槽配置:')
    print(f'  平均每把武器有 {avg_slots:.1f} 个插槽')
    print(f'  最多插槽: {max_slots} 个')
    print(f'  最少插槽: {min_slots} 个')

# 分析配件兼容性
acc_compatibility = defaultdict(int)
for sa in slot_accessories:
    acc_compatibility[sa['accessoryId']] += 1

if acc_compatibility:
    avg_compat = statistics.mean(acc_compatibility.values())
    max_compat = max(acc_compatibility.values())
    print(f'\n配件兼容性:')
    print(f'  平均每个配件可安装到 {avg_compat:.1f} 个插槽')
    print(f'  最高兼容性: {max_compat} 个插槽')

print('\n' + '=' * 80)
print('【数据质量检查】')
print('=' * 80)

# 检查缺失值
print('\n武器数据缺失值检查:')
null_counts = defaultdict(int)
for w in weapons:
    for key, value in w.items():
        if key != 'regular' and value is None:
            null_counts[key] += 1

if null_counts:
    for key, count in sorted(null_counts.items(), key=lambda x: x[1], reverse=True):
        print(f'  {key}: {count} 个缺失 ({count/len(weapons)*100:.1f}%)')
else:
    print('  未发现缺失值')

print('\n配件数据缺失值检查:')
acc_null_counts = defaultdict(int)
for a in accessories:
    for key, value in a.items():
        if key != 'regular' and value is None:
            acc_null_counts[key] += 1

if acc_null_counts:
    for key, count in sorted(acc_null_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f'  {key}: {count} 个缺失 ({count/len(accessories)*100:.1f}%)')

# 市场禁售物品统计
banned_weapons = sum(1 for w in weapons if w['regular'].get('bannedOnMarket'))
banned_accessories = sum(1 for a in accessories if a['regular'].get('bannedOnMarket'))

print(f'\n市场禁售物品:')
print(f'  武器: {banned_weapons} 把')
print(f'  配件: {banned_accessories} 件')

print('\n' + '=' * 80)
print('分析完成！')
print('=' * 80)
