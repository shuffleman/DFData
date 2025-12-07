/**
 * 从 data.json 完全重新生成所有物品数据文件
 */
const fs = require("fs");
const path = require("path");

// 加载数据和价格映射
const { data, priceMap, convertToFrontendFormat } = require("./generateAllData.cjs");

const outputDir = path.join(__dirname, "../public/json_new");

console.log("=== 生成所有数据文件 ===\n");

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
["gun", "acc", "protect", "props", "container"].forEach(dir => {
  const dirPath = path.join(outputDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// 标准 JSON 包装函数
function wrapInJData(list) {
  return {
    jData: {
      data: {
        data: {
          list: list
        }
      }
    }
  };
}

// 1. 生成武器数据
console.log("1. 生成武器数据...");
const weaponsByType = {};

data.rawData.weapons.forEach(weapon => {
  const frontendItem = convertToFrontendFormat(weapon, 'weapon');

  // 按武器类型分组
  const weaponType = frontendItem.secondClass; // gunRifle 或 gunPistol
  if (!weaponsByType[weaponType]) {
    weaponsByType[weaponType] = [];
  }
  weaponsByType[weaponType].push(frontendItem);
});

// 保存武器文件
Object.entries(weaponsByType).forEach(([type, weapons]) => {
  const filename = `${type}.json`;
  const filepath = path.join(outputDir, "gun", filename);
  fs.writeFileSync(filepath, JSON.stringify(wrapInJData(weapons), null, 2), "utf-8");
  console.log(`   ✓ ${filename}: ${weapons.length} 个武器`);
});

// 2. 生成配件数据
console.log("\n2. 生成配件数据...");
const accByType = {};

data.rawData.accessories.forEach(acc => {
  const frontendItem = convertToFrontendFormat(acc, 'accessory');

  const accType = frontendItem.secondClass;
  if (!accByType[accType]) {
    accByType[accType] = [];
  }
  accByType[accType].push(frontendItem);
});

// 保存配件文件
Object.entries(accByType).forEach(([type, accessories]) => {
  const filename = `${type}.json`;
  const filepath = path.join(outputDir, "acc", filename);
  fs.writeFileSync(filepath, JSON.stringify(wrapInJData(accessories), null, 2), "utf-8");
  console.log(`   ✓ ${filename}: ${accessories.length} 个配件`);
});

// 3. 生成装备数据
console.log("\n3. 生成装备数据...");

// 头盔
const helmets = data.rawData.helmets.map(item => convertToFrontendFormat(item, 'helmet'));
fs.writeFileSync(
  path.join(outputDir, "protect", "helmet.json"),
  JSON.stringify(wrapInJData(helmets), null, 2),
  "utf-8"
);
console.log(`   ✓ helmet.json: ${helmets.length} 个头盔`);

// 护甲
const armors = data.rawData.armors.map(item => convertToFrontendFormat(item, 'armor'));
fs.writeFileSync(
  path.join(outputDir, "protect", "armor.json"),
  JSON.stringify(wrapInJData(armors), null, 2),
  "utf-8"
);
console.log(`   ✓ armor.json: ${armors.length} 个护甲`);

// 4. 生成容器数据
console.log("\n4. 生成容器数据...");

// 背包
const backpacks = data.rawData.backpacks.map(item => convertToFrontendFormat(item, 'backpack'));
fs.writeFileSync(
  path.join(outputDir, "container", "backpack.json"),
  JSON.stringify(wrapInJData(backpacks), null, 2),
  "utf-8"
);
console.log(`   ✓ backpack.json: ${backpacks.length} 个背包`);

// 胸挂
const chests = data.rawData.chests.map(item => convertToFrontendFormat(item, 'chest'));
fs.writeFileSync(
  path.join(outputDir, "container", "chestRigs.json"),
  JSON.stringify(wrapInJData(chests), null, 2),
  "utf-8"
);
console.log(`   ✓ chestRigs.json: ${chests.length} 个胸挂`);

// 5. 生成弹药数据
console.log("\n5. 生成弹药数据...");
const ammo = data.rawData.ammunitions.map(item => convertToFrontendFormat(item, 'ammunition'));
fs.writeFileSync(
  path.join(outputDir, "props", "ammo.json"),
  JSON.stringify(wrapInJData(ammo), null, 2),
  "utf-8"
);
console.log(`   ✓ ammo.json: ${ammo.length} 个弹药`);

// 6. 处理收集品和消耗品（从 price.json）
console.log("\n6. 处理收集品和消耗品...");
const priceJsonPath = path.join(__dirname, "../price.json");
if (fs.existsSync(priceJsonPath)) {
  const priceData = JSON.parse(fs.readFileSync(priceJsonPath, "utf-8"));

  const collection = [];
  const consume = [];

  priceData.forEach(item => {
    // 简单的转换，因为 price.json 中的数据格式可能不完整
    const frontendItem = {
      objectID: item.objectID,
      objectName: item.objectName,
      primaryClass: "collection",  // 默认为收集品
      secondClass: "collection",
      grade: item.grade || 0,
      length: item.length || 1,
      width: item.width || 1,
      pic: `/images/${item.objectID}.png`,
      baseValue: item.avgPrice || 1,
      searchTime: 1.2
    };

    // 根据某些规则判断是收集品还是消耗品
    // 这里需要更准确的判断逻辑
    if (item.objectName && (item.objectName.includes("药") || item.objectName.includes("绷带") || item.objectName.includes("注射器"))) {
      frontendItem.primaryClass = "consumable";
      frontendItem.secondClass = "consume";
      consume.push(frontendItem);
    } else {
      collection.push(frontendItem);
    }
  });

  if (collection.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, "props", "collection.json"),
      JSON.stringify(wrapInJData(collection), null, 2),
      "utf-8"
    );
    console.log(`   ✓ collection.json: ${collection.length} 个收集品`);
  }

  if (consume.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, "props", "consume.json"),
      JSON.stringify(wrapInJData(consume), null, 2),
      "utf-8"
    );
    console.log(`   ✓ consume.json: ${consume.length} 个消耗品`);
  }
}

console.log("\n========================================");
console.log("所有数据文件已生成到 public/json_new/");
console.log("========================================");
console.log("\n提示：请手动检查生成的数据，确认无误后替换原 public/json/ 目录");
