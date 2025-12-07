/**
 * 将 data.json 转换为项目所需的本地 JSON 格式
 * 运行: node scripts/convertData.js
 */

const fs = require('fs');
const path = require('path');

// 读取 data.json
const dataPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('开始转换数据...\n');

// 输出目录
const outputDir = path.join(__dirname, '../public/json');

// 确保目录存在
const dirs = [
  'gun',
  'acc',
  'protect',
  'container',  // 添加container目录
  'props'
].map(dir => path.join(outputDir, dir));

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 转换单个物品数据
 */
function convertItem(item, primaryClass, secondClass, weaponSlotsData) {
  const regular = item.regular || {};

  // 从URL提取文件扩展名，使用本地路径
  const ext = '.png';
  const localPicPath = `/images/${item.objectID}${ext}`;

  // 获取武器配件插槽信息
  let accessorySlots = [];
  if (weaponSlotsData && weaponSlotsData[item.objectID]) {
    const weaponSlotInfo = weaponSlotsData[item.objectID];
    // 只保留解锁的插槽
    accessorySlots = weaponSlotInfo.slots
      .filter(slot => slot.unlock)
      .map(slot => ({
        slotID: slot.slotid,  // 注意：这里必须是 slotID（大写D）
        slotName: slot.slotName,
        slotType: slot.slotType
      }));
  }

  return {
    objectID: item.objectID,
    objectName: regular.objectName,
    primaryClass: primaryClass,
    secondClass: secondClass,
    grade: regular.grade || 0,
    length: regular.width || 1,  // data.json 中 width 是长度
    width: regular.height || 1,  // data.json 中 height 是宽度
    pic: localPicPath,  // 使用本地图片路径
    baseValue: regular.avgPrice || regular.basePrice || 0,
    searchTime: 1.2,
    // 武器特有字段
    ...(item.type && {
      gunDetail: {
        caliber: item.caliber,
        capacity: item.capacity,
        fireMode: item.fireMode,
        accessory: accessorySlots
      }
    }),
    // 配件特有字段
    ...(item.type === 'Stock' || item.type === 'Scope' || item.type === 'Muzzle' ? {
      stats: {
        recoil: item.recoil,
        control: item.control,
        stable: item.stable,
        hipShot: item.hipShot
      }
    } : {})
  };
}

/**
 * 转换 grid 数组为 subgridLayout 格式
 * grid 格式: [{ grid: { X: width, Y: height }, column: col_num, subColumn?: sub_col }]
 * subgridLayout 格式: [[width, height, x_offset, y_offset], ...]
 *
 * 布局规则（重要！）：
 * 1. 第一行：所有无subColumn的格子，按column从小到大水平排列
 * 2. 第二行开始：所有有subColumn的格子
 *    - 按 column 分组（column决定列位置）
 *    - 同 column、同 subColumn 的格子在同一列垂直堆叠
 *    - 不同 column 的格子水平排列
 */
function convertGridToLayout(grids) {
  if (!grids || grids.length === 0) {
    return [[4, 4, 0, 0]]; // 默认布局
  }

  // 分离无subColumn和有subColumn的格子
  const noSubColumn = grids.filter(item => item.subColumn === undefined);
  const withSubColumn = grids.filter(item => item.subColumn !== undefined);

  const layouts = [];
  const columnXPositions = new Map();  // 记录每个column的X起始位置
  const columnYPositions = new Map();  // 记录每个column当前的Y位置

  // 第一步：处理无subColumn的格子（按column分组，同column垂直堆叠）
  if (noSubColumn.length > 0) {
    // 按column分组
    const columnGroups = new Map();
    for (const item of noSubColumn) {
      if (!columnGroups.has(item.column)) {
        columnGroups.set(item.column, []);
      }
      columnGroups.get(item.column).push(item);
    }

    // 计算每个column的X位置
    const sortedColumns = Array.from(columnGroups.keys()).sort((a, b) => a - b);
    let currentX = 0;

    for (const col of sortedColumns) {
      columnXPositions.set(col, currentX);
      const items = columnGroups.get(col);
      let currentY = 0;
      let maxWidth = 0;

      // 同column的格子垂直堆叠
      for (const item of items) {
        layouts.push([item.grid.X, item.grid.Y, currentX, currentY]);
        currentY += item.grid.Y;
        maxWidth = Math.max(maxWidth, item.grid.X);
      }

      columnYPositions.set(col, currentY);  // 记录这个column的下一个Y位置
      currentX += maxWidth;  // 下一个column的X位置
    }
  }

  // 第二步：处理有subColumn的格子
  if (withSubColumn.length > 0) {
    // 按 column 分组
    const columnGroups = new Map();
    for (const item of withSubColumn) {
      if (!columnGroups.has(item.column)) {
        columnGroups.set(item.column, new Map());  // column -> (subColumn -> items[])
      }
      const subColumnMap = columnGroups.get(item.column);
      if (!subColumnMap.has(item.subColumn)) {
        subColumnMap.set(item.subColumn, []);
      }
      subColumnMap.get(item.subColumn).push(item);
    }

    // 对每个column处理
    for (const [col, subColumnMap] of columnGroups) {
      const colX = columnXPositions.get(col) || 0;  // 这个column的X起始位置
      let currentY = columnYPositions.get(col) || 0;  // 从这个column的当前Y位置继续

      // 按subColumn排序
      const sortedSubColumns = Array.from(subColumnMap.keys()).sort((a, b) => a - b);

      for (const subCol of sortedSubColumns) {
        const items = subColumnMap.get(subCol);
        let currentX = colX;  // 从column的X位置开始
        let maxHeight = 0;

        // 同column、同subColumn的格子水平排列
        for (const item of items) {
          layouts.push([item.grid.X, item.grid.Y, currentX, currentY]);
          currentX += item.grid.X;  // 水平排列，X递增
          maxHeight = Math.max(maxHeight, item.grid.Y);
        }

        currentY += maxHeight;  // 不同subColumn垂直堆叠
      }
    }
  }

  return layouts;
}

/**
 * 保存为 jData 包装格式（匹配项目现有格式）
 */
function saveAsJData(filename, items) {
  const output = {
    jData: {
      data: {
        data: {
          list: items
        }
      }
    }
  };

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ 已生成 ${filename} (${items.length} 条)`);
}

// 1. 转换武器数据
const weaponTypeMap = {
  'Rifle': 'gunRifle',
  'SMG': 'gunRifle',  // SMG 也归类为步枪
  'Shotgun': 'gunRifle',
  'LMG': 'gunRifle',
  'Sniper': 'gunRifle',
  'Pistol': 'gunPistol'
};

const weaponsByType = {
  gunRifle: [],
  gunPistol: []
};

// 获取武器插槽数据
const weaponSlotsData = data.rawData.weaponSlots || {};

data.rawData.weapons.forEach(weapon => {
  const weaponType = weaponTypeMap[weapon.type] || 'gunRifle';
  weaponsByType[weaponType].push(
    convertItem(weapon, 'gun', weaponType, weaponSlotsData)
  );
});

saveAsJData('gun/gunRifle.json', weaponsByType.gunRifle);
saveAsJData('gun/gunPistol.json', weaponsByType.gunPistol);

// 2. 转换弹药
const ammos = data.rawData.ammunitions.map(ammo => {
  const regular = ammo.regular || {};
  const localPicPath = `/images/${ammo.objectID}.png`;
  return {
    objectID: ammo.objectID,
    objectName: regular.objectName,
    primaryClass: 'ammo',
    secondClass: ammo.caliber || 'ammo',
    grade: regular.grade || 0,
    length: regular.width || 1,
    width: regular.height || 1,
    pic: localPicPath,
    baseValue: regular.avgPrice || regular.basePrice || 0,
    maxStack: 60,
    searchTime: 1.2
  };
});
saveAsJData('gun/ammo.json', ammos);

// 3. 转换配件
const accessoryTypeMap = {
  'BackGrip': 'accBackGrip',
  'Barrel': 'accBarrel',
  'ForeGrip': 'accForeGrip',
  'Functional': 'accFunctional',
  'Handguard': 'accHandGuard',
  'Magazine': 'accMagazine',
  'Muzzle': 'accMuzzle',
  'Scope': 'accScope',
  'Stock': 'accStock'
};

const accessoriesByType = {};
Object.values(accessoryTypeMap).forEach(type => {
  accessoriesByType[type] = [];
});

data.rawData.accessories.forEach(acc => {
  const accType = accessoryTypeMap[acc.type];
  if (accType) {
    accessoriesByType[accType].push(
      convertItem(acc, 'acc', accType, null)
    );
  }
});

Object.entries(accessoriesByType).forEach(([type, items]) => {
  const filename = `acc/${type}.json`;
  saveAsJData(filename, items);
});

// 4. 转换护甲
const armors = data.rawData.armors.map(armor => {
  const regular = armor.regular || {};
  const localPicPath = `/images/${armor.objectID}.png`;
  return {
    objectID: armor.objectID,
    objectName: regular.objectName,
    primaryClass: 'protect',
    secondClass: 'armor',
    grade: regular.grade || 0,
    length: regular.width || 2,
    width: regular.height || 2,
    pic: localPicPath,
    baseValue: regular.avgPrice || regular.basePrice || 0,
    searchTime: 1.2
  };
});
saveAsJData('protect/armor.json', armors);

// 5. 转换头盔
const helmets = data.rawData.helmets.map(helmet => {
  const regular = helmet.regular || {};
  const localPicPath = `/images/${helmet.objectID}.png`;
  return {
    objectID: helmet.objectID,
    objectName: regular.objectName,
    primaryClass: 'protect',
    secondClass: 'helmet',
    grade: regular.grade || 0,
    length: regular.width || 2,
    width: regular.height || 2,
    pic: localPicPath,
    baseValue: regular.avgPrice || regular.basePrice || 0,
    searchTime: 1.2
  };
});
saveAsJData('protect/helmet.json', helmets);

// 6. 转换背包
const backpacks = data.rawData.backpacks.map(backpack => {
  const regular = backpack.regular || {};
  const localPicPath = `/images/${backpack.objectID}.png`;
  return {
    objectID: backpack.objectID,
    objectName: regular.objectName,
    primaryClass: 'container',
    secondClass: 'bag',
    grade: regular.grade || 0,
    length: regular.width || 2,
    width: regular.height || 3,
    pic: localPicPath,
    baseValue: regular.avgPrice || regular.basePrice || 0,
    searchTime: 1.2,
    // 从 grid 数据转换布局
    subgridLayout: convertGridToLayout(backpack.grid)
  };
});
saveAsJData('container/backpack.json', backpacks);

// 7. 转换胸挂
const chests = data.rawData.chests.map(chest => {
  const regular = chest.regular || {};
  const localPicPath = `/images/${chest.objectID}.png`;
  const layout = convertGridToLayout(chest.grid);

  // 调试DRC
  if (regular.objectName === 'DRC先进侦察胸挂') {
    console.log('\n=== DRC先进侦察胸挂 调试 ===');
    console.log('原始grid数据:', JSON.stringify(chest.grid, null, 2));
    console.log('转换后layout:', JSON.stringify(layout, null, 2));
  }

  return {
    objectID: chest.objectID,
    objectName: regular.objectName,
    primaryClass: 'container',
    secondClass: 'chest',
    grade: regular.grade || 0,
    length: regular.width || 2,
    width: regular.height || 2,
    pic: localPicPath,
    baseValue: regular.avgPrice || regular.basePrice || 0,
    searchTime: 1.2,
    // 从 grid 数据转换布局
    subgridLayout: layout
  };
});
saveAsJData('container/chestRigs.json', chests);

// 8. 生成价格数据文件 values.json
const values = {
  list: []
};

// 收集所有物品的价格
[...data.rawData.weapons,
 ...data.rawData.accessories,
 ...data.rawData.ammunitions,
 ...data.rawData.helmets,
 ...data.rawData.armors,
 ...data.rawData.chests,
 ...data.rawData.backpacks
].forEach(item => {
  const regular = item.regular || {};
  values.list.push({
    objectID: item.objectID,
    objectName: regular.objectName,
    baseValue: regular.avgPrice || regular.basePrice || 0
  });
});

const valuesPath = path.join(outputDir, 'values.json');
fs.writeFileSync(valuesPath, JSON.stringify(values, null, 2), 'utf-8');
console.log(`✓ 已生成 values.json (${values.list.length} 条)`);

// 9. 生成 gunSlotMap.json - slotID 到配件类型的映射
const gunSlotMap = {};

// 定义slotID到配件类型的映射规则
const slotIDToAccType = {
  'slot_muzzle': 'accMuzzle',
  'slot_barrel': 'accBarrel',
  'slot_scope': 'accScope',
  'slot_side_scope': 'accScope',
  'slot_special': 'accFunctional',
  'slot_magazine_base': 'accMagazine',
  'slot_magazine': 'accMagazine',
  'slot_stock': 'accStock',
  'slot_pistol_grip_1': 'accBackGrip',
  'slot_foregrip': 'accForeGrip',
  'slot_bipod': 'accFunctional',
  'slot_upper_rail': 'accFunctional',
  'slot_lower_rail': 'accFunctional',
  'slot_left_rail': 'accFunctional',
  'slot_right_rail': 'accFunctional',
  'slot_upper_patch': 'accFunctional',
  'slot_lower_patch': 'accFunctional',
  'slot_left_patch': 'accFunctional',
  'slot_right_patch': 'accFunctional',
  'slot_right_rail_2': 'accFunctional'
};

// 从weaponSlots中提取所有唯一的slot定义
const collectedSlots = new Map();

for (const weaponKey in data.rawData.weaponSlots) {
  const weaponSlotInfo = data.rawData.weaponSlots[weaponKey];
  if (weaponSlotInfo.slots) {
    for (const slot of weaponSlotInfo.slots) {
      const slotId = slot.slotid;
      if (!collectedSlots.has(slotId)) {
        collectedSlots.set(slotId, {
          nameCN: slot.slotName,
          accType: slotIDToAccType[slotId] || 'accFunctional'  // 默认为 accFunctional
        });
      }
    }
  }
}

// 转换为普通对象
for (const [slotId, slotInfo] of collectedSlots) {
  gunSlotMap[slotId] = slotInfo;
}

const gunSlotMapPath = path.join(outputDir, 'gunSlotMap.json');
fs.writeFileSync(gunSlotMapPath, JSON.stringify(gunSlotMap, null, 2), 'utf-8');
console.log(`✓ 已生成 gunSlotMap.json (${Object.keys(gunSlotMap).length} 条)`);

// 10. 创建空的收集品和消耗品文件（如果 data.json 中没有这些数据）
saveAsJData('props/collection.json', []);
saveAsJData('props/consume.json', []);
saveAsJData('props/key.json', []);

console.log('\n数据转换完成！');
console.log(`\n统计信息:`);
console.log(`  武器 (步枪): ${weaponsByType.gunRifle.length}`);
console.log(`  武器 (手枪): ${weaponsByType.gunPistol.length}`);
console.log(`  弹药: ${ammos.length}`);
console.log(`  配件: ${Object.values(accessoriesByType).reduce((sum, arr) => sum + arr.length, 0)}`);
console.log(`  护甲: ${armors.length}`);
console.log(`  头盔: ${helmets.length}`);
console.log(`  背包: ${backpacks.length}`);
console.log(`  胸挂: ${chests.length}`);
console.log(`\n所有文件已保存到 public/json/ 目录`);
