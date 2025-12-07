/**
 * 检查配件的完整结构
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 配件完整结构检查 ===\n");

// 从 slotAccessories 中获取第一个槽位的第一个配件
const firstSlotKey = Object.keys(data.rawData.slotAccessories)[0];
const firstSlotData = data.rawData.slotAccessories[firstSlotKey];

console.log(`槽位: ${firstSlotKey}`);
console.log(`槽位ID: ${firstSlotData.slotId}`);
console.log(`槽位名称: ${firstSlotData.slotName}`);
console.log(`配件数量: ${firstSlotData.accessories.length}\n`);

if (firstSlotData.accessories.length > 0) {
  const firstAcc = firstSlotData.accessories[0];
  console.log("第一个配件的所有字段:");
  Object.keys(firstAcc).forEach(key => {
    console.log(`  - ${key}: ${typeof firstAcc[key]}`);
  });

  console.log("\n第一个配件的完整数据:");
  console.log(JSON.stringify(firstAcc, null, 2));
}
