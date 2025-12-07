/**
 * 检查 structuredData.slotTypes 的结构
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== structuredData.slotTypes 详细结构 ===\n");

if (data.structuredData && data.structuredData.slotTypes) {
  const slotTypes = data.structuredData.slotTypes;
  console.log(`共 ${slotTypes.length} 个槽位类型\n`);

  // 显示前5个完整的槽位类型
  console.log("前5个完整的槽位类型:");
  slotTypes.slice(0, 5).forEach((slot, i) => {
    console.log(`\n${i + 1}. 完整数据:`);
    console.log(JSON.stringify(slot, null, 2));
  });

  // 检查字段名
  console.log("\n所有字段名:");
  const allFields = new Set();
  slotTypes.forEach(slot => {
    Object.keys(slot).forEach(key => allFields.add(key));
  });
  console.log(Array.from(allFields).join(", "));
}

// 同时检查 accessoryCategories
console.log("\n\n=== structuredData.accessoryCategories ===\n");
if (data.structuredData && data.structuredData.accessoryCategories) {
  const accCategories = data.structuredData.accessoryCategories;
  console.log(`共 ${accCategories.length} 个配件分类\n`);
  accCategories.forEach(cat => {
    console.log(`accType: ${cat.accType}, nameCN: ${cat.nameCN}, nameEN: ${cat.nameEN}`);
  });
}
