#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# 读取 slot_system.json
with open('normalized_data/slot_system.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 查找 .357左轮的插槽
weapon_18070000003 = [s for s in data['weaponSlots'] if s['weaponId'] == 18070000003]

print(f'.357左轮的基础插槽数量: {len(weapon_18070000003)}')
print('\n插槽列表:')
for slot in sorted(weapon_18070000003, key=lambda x: x['slotOrder']):
    print(f'  - {slot["slotName"]} ({slot["slotId"]}), unlock={slot.get("unlock", True)}, order={slot["slotOrder"]}')
