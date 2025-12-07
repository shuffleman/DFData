/**
 * 从 data.json 生成配件插槽映射关系
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 从 data.json 生成配件插槽映射 ===\n");

// 1. 获取第一个武器的详细信息作为示例
const firstWeaponID = Object.keys(data.rawData.weaponSlots)[0];
const firstWeaponData = data.rawData.weaponSlots[firstWeaponID];
console.log(`1. 武器示例 (objectID: ${firstWeaponID}):`);
console.log(`   weaponName: ${firstWeaponData.weaponName}`);
console.log(`   slots:`, JSON.stringify(firstWeaponData.slots, null, 2));

// 2. 获取第一个配件的详细信息
const firstAcc = data.rawData.accessories[0];
console.log(`\n2. 配件示例 (objectID: ${firstAcc.objectID}):`);
console.log(`   objectName: ${firstAcc.regular.objectName}`);
console.log(`   完整数据:`, JSON.stringify(firstAcc, null, 2).substring(0, 500) + "...");

// 3. 检查 structuredData
console.log(`\n3. structuredData 字段:`);
if (data.structuredData) {
  Object.keys(data.structuredData).forEach(key => {
    const value = data.structuredData[key];
    if (Array.isArray(value)) {
      console.log(`   - ${key}: ${value.length} 项`);
    } else if (typeof value === 'object') {
      console.log(`   - ${key}: 对象`);
    }
  });
}

// 4. 查看 accessorySlots 的一个配件的插槽信息
const firstAccID = Object.keys(data.rawData.accessorySlots)[0];
const firstAccSlots = data.rawData.accessorySlots[firstAccID];
console.log(`\n4. 配件提供的插槽示例 (objectID: ${firstAccID}):`);
console.log(`   数据:`, JSON.stringify(firstAccSlots, null, 2).substring(0, 300));
