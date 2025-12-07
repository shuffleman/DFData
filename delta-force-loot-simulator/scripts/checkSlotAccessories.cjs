/**
 * 检查 slotAccessories 的详细结构
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== slotAccessories 详细结构 ===\n");

const slotAccKeys = Object.keys(data.rawData.slotAccessories);
console.log(`共 ${slotAccKeys.length} 个槽位-配件组合\n`);

// 查看前3个
console.log("前3个槽位-配件组合:");
slotAccKeys.slice(0, 3).forEach((key, i) => {
  const accessories = data.rawData.slotAccessories[key];
  console.log(`\n${i + 1}. ${key}:`);
  console.log(`   数据类型: ${Array.isArray(accessories) ? '数组' : typeof accessories}`);
  if (Array.isArray(accessories)) {
    console.log(`   配件数量: ${accessories.length}`);
    if (accessories.length > 0) {
      console.log(`   第一个配件:`, JSON.stringify(accessories[0], null, 2).substring(0, 500));
    }
  } else {
    console.log(`   数据:`, JSON.stringify(accessories, null, 2).substring(0, 300));
  }
});
