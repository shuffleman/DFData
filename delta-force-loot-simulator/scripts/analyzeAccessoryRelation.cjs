/**
 * 分析 data.json 中配件和武器的关系结构
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 分析配件-武器关系 ===\n");

// 1. 查看一个武器的槽位信息
const weaponID = "18060000011"; // AWM
const weaponSlots = data.rawData.weaponSlots[weaponID];

console.log(`1. ${weaponSlots.weaponName} 的槽位信息:`);
console.log(`   共 ${weaponSlots.slots.length} 个槽位\n`);

weaponSlots.slots.slice(0, 3).forEach((slot, i) => {
  console.log(`   槽位 ${i + 1}: ${slot.slotid}`);
  console.log(`     名称: ${slot.slotName}`);
  console.log(`     类型: ${slot.slotType}`);
  console.log(`     解锁: ${slot.unlock}\n`);
});

// 2. 查看一个槽位可以安装的配件
const slotKey = `${weaponID}_slot_muzzle`;
const slotAccessories = data.rawData.slotAccessories[slotKey];

console.log(`\n2. ${weaponSlots.weaponName} 的 ${slotAccessories.slotName} 槽位可安装配件:`);
console.log(`   共 ${slotAccessories.accessories.length} 个配件\n`);

slotAccessories.accessories.slice(0, 3).forEach((acc, i) => {
  console.log(`   配件 ${i + 1}:`);
  console.log(`     ID: ${acc.objectID}`);
  console.log(`     名称: ${acc.regular.objectName}`);
  console.log(`     类型: ${acc.acc.type}`);
  console.log(`     等级: ${acc.regular.grade}\n`);
});

// 3. 统计一个槽位的配件类型分布
const accTypeCount = {};
slotAccessories.accessories.forEach(acc => {
  const type = acc.acc.type;
  accTypeCount[type] = (accTypeCount[type] || 0) + 1;
});

console.log(`\n3. ${slotAccessories.slotName} 槽位的配件类型分布:`);
Object.entries(accTypeCount).forEach(([type, count]) => {
  console.log(`   ${type}: ${count} 个`);
});

// 4. 建议的新架构
console.log(`\n\n=== 建议的新架构 ===\n`);
console.log(`武器数据格式:`);
console.log(`{
  objectID: 18060000011,
  objectName: "AWM狙击步枪",
  gunDetail: {
    caliber: "ammo.338",
    capacity: 5,
    slots: [
      {
        slotID: "slot_muzzle",
        slotName: "枪口",
        acceptedAccessories: [13130000183, 13130000184, ...]  // 配件 objectID 列表
      },
      ...
    ]
  }
}`);

console.log(`\n或者更简单的方案 - 前端直接查询 data.json:`);
console.log(`- 前端加载完整的 data.json`);
console.log(`- 使用 data.rawData.slotAccessories 查询可安装配件`);
console.log(`- key 格式: weaponObjectID + "_" + slotID`);
