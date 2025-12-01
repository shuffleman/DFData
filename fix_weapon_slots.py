#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# 读取 slot_system.json
with open('normalized_data/slot_system.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 过滤 weaponSlots，只保留 unlock: true 的插槽
original_count = len(data['weaponSlots'])
data['weaponSlots'] = [slot for slot in data['weaponSlots'] if slot.get('unlock', True)]
filtered_count = len(data['weaponSlots'])

print(f'原始插槽数量: {original_count}')
print(f'过滤后插槽数量: {filtered_count}')
print(f'移除了 {original_count - filtered_count} 个需要解锁的插槽')

# 更新 metadata
data['metadata']['counts']['weaponSlots'] = filtered_count

# 保存修复后的文件
with open('normalized_data/slot_system.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\n修复完成！')
print(f'新的 weaponSlots 数量: {filtered_count}')
