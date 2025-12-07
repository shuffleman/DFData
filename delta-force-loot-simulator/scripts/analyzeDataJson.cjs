/**
 * 分析 data.json 的完整结构
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== Data.json 完整结构分析 ===\n");

// 1. 顶层结构
console.log("1. 顶层字段:");
Object.keys(data).forEach(key => {
  console.log(`  - ${key}`);
});

// 2. rawData 的字段
console.log("\n2. rawData 包含的字段:");
Object.keys(data.rawData).forEach(key => {
  const value = data.rawData[key];
  if (Array.isArray(value)) {
    console.log(`  - ${key}: 数组，${value.length} 项`);
  } else if (typeof value === 'object') {
    console.log(`  - ${key}: 对象，${Object.keys(value).length} 个键`);
  } else {
    console.log(`  - ${key}: ${typeof value}`);
  }
});

// 3. weaponSlots 结构
console.log("\n3. rawData.weaponSlots 结构:");
if (data.rawData.weaponSlots) {
  const weaponSlotKeys = Object.keys(data.rawData.weaponSlots);
  console.log(`  共 ${weaponSlotKeys.length} 个武器`);

  // 查看第一个武器的槽位
  const firstWeaponID = weaponSlotKeys[0];
  const firstWeaponSlots = data.rawData.weaponSlots[firstWeaponID];
  console.log(`\n  示例武器 (objectID: ${firstWeaponID}):`);
  console.log(`  槽位数据类型: ${typeof firstWeaponSlots}`);
  console.log(`  槽位数据 (是数组吗?): ${Array.isArray(firstWeaponSlots)}`);

  if (Array.isArray(firstWeaponSlots)) {
    console.log(`  槽位数: ${firstWeaponSlots.length}`);
    firstWeaponSlots.forEach((slot, i) => {
      console.log(`    ${i + 1}. slotID: ${slot.slotID}, slotName: ${slot.slotName}`);
    });
  } else if (typeof firstWeaponSlots === 'object') {
    console.log(`  槽位对象的键: ${Object.keys(firstWeaponSlots).join(', ')}`);
  }
}

// 4. slotAccessories 结构
console.log("\n4. rawData.slotAccessories 结构:");
if (data.rawData.slotAccessories) {
  const slotKeys = Object.keys(data.rawData.slotAccessories);
  console.log(`  共 ${slotKeys.length} 个槽位类型`);

  // 查看前3个槽位的配件
  slotKeys.slice(0, 3).forEach(slotID => {
    const accessories = data.rawData.slotAccessories[slotID];
    console.log(`\n  ${slotID}: ${accessories.length} 个兼容配件`);
    accessories.slice(0, 3).forEach(acc => {
      console.log(`    - objectID: ${acc.objectID}, name: ${acc.regular?.objectName || '未知'}`);
    });
  });
}

// 5. structuredData 结构
console.log("\n5. structuredData 包含的字段:");
if (data.structuredData) {
  Object.keys(data.structuredData).forEach(key => {
    const value = data.structuredData[key];
    if (Array.isArray(value)) {
      console.log(`  - ${key}: 数组，${value.length} 项`);
      if (value.length > 0) {
        console.log(`    示例:`, value[0]);
      }
    } else if (typeof value === 'object') {
      console.log(`  - ${key}: 对象，${Object.keys(value).length} 个键`);
    } else {
      console.log(`  - ${key}: ${typeof value}`);
    }
  });
}

// 6. accessorySlots 结构
console.log("\n6. rawData.accessorySlots 结构:");
if (data.rawData.accessorySlots) {
  const accKeys = Object.keys(data.rawData.accessorySlots);
  console.log(`  共 ${accKeys.length} 个配件`);
  const firstAccID = accKeys[0];
  const firstAccSlots = data.rawData.accessorySlots[firstAccID];
  console.log(`\n  示例配件 (objectID: ${firstAccID}):`);
  if (Array.isArray(firstAccSlots)) {
    console.log(`  提供的槽位数: ${firstAccSlots.length}`);
    firstAccSlots.forEach((slot, i) => {
      console.log(`    ${i + 1}. slotID: ${slot.slotID}, slotName: ${slot.slotName}`);
    });
  } else {
    console.log(`  数据格式:`, firstAccSlots);
  }
}
