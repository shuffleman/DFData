/**
 * 提取 data.json 的关键结构信息
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== Data.json 结构分析 ===\n");

console.log("1. 元数据统计:");
console.log(JSON.stringify(data.metadata.stats, null, 2));

console.log("\n2. slotTypes (前10个):");
if (data.slotTypes) {
  data.slotTypes.slice(0, 10).forEach((slot, i) => {
    console.log(`  ${i + 1}. ${slot.slotID} (${slot.nameCN})`);
    console.log(`     - accType: ${slot.accType}`);
  });
  console.log(`  ... 共 ${data.slotTypes.length} 个槽位类型`);
}

console.log("\n3. 武器示例 (第一个武器):");
if (data.rawData.weapons && data.rawData.weapons.length > 0) {
  const weapon = data.rawData.weapons[0];
  console.log(`  objectID: ${weapon.objectID}`);
  console.log(`  objectName: ${weapon.regular.objectName}`);
  console.log(`  caliber: ${weapon.caliber}`);
  console.log(`  槽位数量: ${weapon.slots ? weapon.slots.length : 0}`);
  if (weapon.slots && weapon.slots.length > 0) {
    console.log(`  槽位示例:`);
    weapon.slots.slice(0, 3).forEach(slot => {
      console.log(`    - ${slot.slotID} (${slot.slotName})`);
    });
  }
}

console.log("\n4. 配件示例 (第一个配件):");
if (data.rawData.accessories && data.rawData.accessories.length > 0) {
  const acc = data.rawData.accessories[0];
  console.log(`  objectID: ${acc.objectID}`);
  console.log(`  objectName: ${acc.regular.objectName}`);
  console.log(`  accType: ${acc.accType}`);
  console.log(`  适配槽位数量: ${acc.compatibleSlots ? acc.compatibleSlots.length : 0}`);
  if (acc.compatibleSlots && acc.compatibleSlots.length > 0) {
    console.log(`  适配槽位示例:`);
    acc.compatibleSlots.slice(0, 5).forEach(slotID => {
      console.log(`    - ${slotID}`);
    });
  }
}

console.log("\n5. accessoryCategories:");
if (data.accessoryCategories) {
  data.accessoryCategories.forEach(cat => {
    console.log(`  - ${cat.accType} (${cat.nameCN}): ${cat.count} 个配件`);
  });
}
