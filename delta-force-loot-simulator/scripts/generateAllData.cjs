/**
 * 从 data.json 和价格文件重新生成所有物品数据
 */
const fs = require("fs");
const path = require("path");

// 加载数据文件
const dataJsonPath = path.join(__dirname, "../data.json");
const priceJsonPath = path.join(__dirname, "../price.json");
const weaponPriceJsonPath = path.join(__dirname, "../武器.json");
const equipmentPriceJsonPath = path.join(__dirname, "../装备.json");
const accessoryPriceJsonPath = path.join(__dirname, "../配件.json");

const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 从 data.json 重新生成所有物品数据 ===\n");

// 1. 建立价格映射
console.log("1. 建立价格映射...");
const priceMap = new Map();

// 从 price.json 加载价格（收集品和消耗品）
if (fs.existsSync(priceJsonPath)) {
  const priceData = JSON.parse(fs.readFileSync(priceJsonPath, "utf-8"));
  priceData.forEach(item => {
    if (item.objectID && item.avgPrice !== undefined) {
      priceMap.set(item.objectID, item.avgPrice);
    }
  });
  console.log(`   - price.json: ${priceData.length} 个物品价格`);
}

// 从 武器.json 加载价格
if (fs.existsSync(weaponPriceJsonPath)) {
  const weaponPriceData = JSON.parse(fs.readFileSync(weaponPriceJsonPath, "utf-8"));
  weaponPriceData.forEach(item => {
    if (item.objectID && item.avgPrice !== undefined) {
      priceMap.set(item.objectID, item.avgPrice);
    }
  });
  console.log(`   - 武器.json: ${weaponPriceData.length} 个物品价格`);
}

// 从 装备.json 加载价格
if (fs.existsSync(equipmentPriceJsonPath)) {
  const equipmentPriceData = JSON.parse(fs.readFileSync(equipmentPriceJsonPath, "utf-8"));
  equipmentPriceData.forEach(item => {
    if (item.objectID && item.avgPrice !== undefined) {
      priceMap.set(item.objectID, item.avgPrice);
    }
  });
  console.log(`   - 装备.json: ${equipmentPriceData.length} 个物品价格`);
}

// 从 配件.json 加载价格
if (fs.existsSync(accessoryPriceJsonPath)) {
  const accessoryPriceData = JSON.parse(fs.readFileSync(accessoryPriceJsonPath, "utf-8"));
  accessoryPriceData.forEach(item => {
    if (item.objectID && item.avgPrice !== undefined) {
      priceMap.set(item.objectID, item.avgPrice);
    }
  });
  console.log(`   - 配件.json: ${accessoryPriceData.length} 个物品价格`);
}

console.log(`   总计: ${priceMap.size} 个物品有价格数据\n`);

// 辅助函数：从 data.json 转换为前端格式
function convertToFrontendFormat(item, itemType) {
  const regular = item.regular || {};

  const result = {
    objectID: item.objectID,
    objectName: regular.objectName || "未知物品",
    primaryClass: getPrimaryClass(itemType),
    secondClass: getSecondClass(itemType, item.type),
    grade: regular.grade || 0,
    length: regular.width || 1,  // data.json 中 width 对应前端的 length
    width: regular.height || 1,  // data.json 中 height 对应前端的 width
    pic: `/images/${item.objectID}.png`,
    baseValue: priceMap.get(item.objectID) || regular.avgPrice || regular.basePrice || 1,
    searchTime: 1.2
  };

  // 武器特有字段
  if (itemType === 'weapon') {
    result.gunDetail = {
      caliber: item.caliber,
      capacity: item.capacity,
      fireMode: item.fireMode || "未知",
      accessory: data.rawData.weaponSlots[item.objectID.toString()]?.slots.map(slot => ({
        slotID: slot.slotid,
        slotName: slot.slotName,
        slotType: slot.slotType
      })) || []
    };
  }

  // 配件特有字段
  if (itemType === 'accessory') {
    result.stats = {
      recoil: item.recoil,
      control: item.control,
      stable: item.stable,
      hipShot: item.hipShot
    };
  }

  // 装备容器字段
  if (itemType === 'backpack' || itemType === 'chest') {
    // 从 grid 字段提取布局信息
    result.subgridLayout = convertGridToSubgridLayout(item.grid || []);
  }

  return result;
}

// 将 data.json 的 grid 格式转换为 subgridLayout 格式
// grid 格式: [{ grid: { X: width, Y: height }, column: col }, ...]
// subgridLayout 格式: [[width, height, xOffset, yOffset], ...]
function convertGridToSubgridLayout(gridArray) {
  if (!Array.isArray(gridArray) || gridArray.length === 0) {
    return [];
  }

  // 按 column 分组并计算偏移
  const layout = [];
  let currentX = 0;
  let currentY = 0;
  let lastColumn = 0;

  gridArray.forEach((gridItem, index) => {
    const width = gridItem.grid?.X || 1;
    const height = gridItem.grid?.Y || 1;
    const column = gridItem.column || 1;

    // 如果是新的列，重置 Y 偏移并增加 X 偏移
    if (column !== lastColumn) {
      if (index > 0) {
        // 找到上一列的最大宽度
        const prevColumnItems = layout.filter((item, i) => {
          const prevItem = gridArray[i];
          return prevItem && prevItem.column === lastColumn;
        });
        if (prevColumnItems.length > 0) {
          currentX += Math.max(...prevColumnItems.map(item => item[0]));
        }
      }
      currentY = 0;
      lastColumn = column;
    }

    // 添加到布局：[width, height, xOffset, yOffset]
    layout.push([width, height, currentX, currentY]);

    // 更新 Y 偏移
    currentY += height;
  });

  return layout;
}

function getPrimaryClass(itemType) {
  const mapping = {
    'weapon': 'gun',
    'accessory': 'acc',
    'helmet': 'protect',
    'armor': 'protect',
    'backpack': 'container',
    'chest': 'container',
    'ammunition': 'ammo'
  };
  return mapping[itemType] || 'collection';
}

function getSecondClass(itemType, dataType) {
  if (itemType === 'weapon') {
    const mapping = {
      'Rifle': 'gunRifle',
      'SMG': 'gunRifle',
      'LMG': 'gunRifle',
      'MP': 'gunRifle',
      'Sniper': 'gunRifle',
      'Shotgun': 'gunRifle',
      'Special': 'gunRifle',
      'Pistol': 'gunPistol'
    };
    return mapping[dataType] || 'gunRifle';
  }

  if (itemType === 'accessory') {
    const mapping = {
      'Barrel': 'accBarrel',
      'Muzzle': 'accMuzzle',
      'Scope': 'accScope',
      'Stock': 'accStock',
      'ForeGrip': 'accForeGrip',
      'BackGrip': 'accBackGrip',
      'HandGuard': 'accHandGuard',
      'Magazine': 'accMagazine',
      'Functional': 'accFunctional'
    };
    return mapping[dataType] || 'accFunctional';
  }

  const mapping = {
    'helmet': 'helmet',
    'armor': 'armor',
    'backpack': 'bag',
    'chest': 'chest',
    'ammunition': 'ammo'
  };
  return mapping[itemType] || 'collection';
}

// 导出函数供其他脚本使用
module.exports = {
  data,
  priceMap,
  convertToFrontendFormat,
  getPrimaryClass,
  getSecondClass
};

console.log("价格映射创建完成！\n");
