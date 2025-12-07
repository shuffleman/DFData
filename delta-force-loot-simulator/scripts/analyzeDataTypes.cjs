/**
 * 分析 data.json 包含的所有数据类型
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== Data.json 数据类型分析 ===\n");

// 1. rawData 中的数据
console.log("1. rawData 包含的数据:");
console.log(`   - weapons: ${data.rawData.weapons.length} 个武器`);
console.log(`   - accessories: ${data.rawData.accessories.length} 个配件`);
console.log(`   - ammunitions: ${data.rawData.ammunitions.length} 个弹药`);
console.log(`   - helmets: ${data.rawData.helmets.length} 个头盔`);
console.log(`   - armors: ${data.rawData.armors.length} 个护甲`);
console.log(`   - chests: ${data.rawData.chests.length} 个胸挂`);
console.log(`   - backpacks: ${data.rawData.backpacks.length} 个背包`);

// 2. 武器类型分布
console.log("\n2. 武器类型分布:");
const weaponTypes = {};
data.rawData.weapons.forEach(weapon => {
  weaponTypes[weapon.type] = (weaponTypes[weapon.type] || 0) + 1;
});
Object.entries(weaponTypes).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} 个`);
});

// 3. 配件类型分布
console.log("\n3. 配件类型分布:");
const accTypes = {};
data.rawData.accessories.forEach(acc => {
  accTypes[acc.type] = (accTypes[acc.type] || 0) + 1;
});
Object.entries(accTypes).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} 个`);
});

// 4. 检查是否有收集品数据
console.log("\n4. 检查其他数据:");
console.log(`   - rawData 的所有字段: ${Object.keys(data.rawData).join(', ')}`);

// 5. 查看武器的字段结构
console.log("\n5. 武器数据示例字段:");
if (data.rawData.weapons.length > 0) {
  const firstWeapon = data.rawData.weapons[0];
  Object.keys(firstWeapon).forEach(key => {
    console.log(`   - ${key}: ${typeof firstWeapon[key]}`);
  });
}

// 6. 查看配件的字段结构
console.log("\n6. 配件数据示例字段:");
if (data.rawData.accessories.length > 0) {
  const firstAcc = data.rawData.accessories[0];
  Object.keys(firstAcc).forEach(key => {
    console.log(`   - ${key}: ${typeof firstAcc[key]}`);
  });
}
