/**
 * 从 data.json 的配件数据反推槽位类型映射
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const gunSlotMapPath = path.join(__dirname, "../public/json/gunSlotMap.json");

const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 从配件数据生成 gunSlotMap.json ===\n");

// 获取所有槽位类型
const slotTypes = data.structuredData.slotTypes;
console.log(`找到 ${slotTypes.length} 个槽位类型`);

// 建立槽位 ID 到槽位名称的映射
const slotMap = {};
slotTypes.forEach(slot => {
  slotMap[slot.slotId] = {
    nameCN: slot.slotName,
    accType: "" // 稍后填充
  };
});

// 从配件数据中提取类型
console.log(`\n分析 ${data.rawData.accessories.length} 个配件...`);

// 建立配件类型的映射
const accTypeMap = {
  "Barrel": "accBarrel",
  "BackGrip": "accBackGrip",
  "Stock": "accStock",
  "HandGuard": "accHandGuard",
  "Magazine": "accMagazine",
  "Muzzle": "accMuzzle",
  "ForeGrip": "accForeGrip",
  "Scope": "accScope",
  "Functional": "accFunctional"
};

// 检查配件数据的 type 字段
const accessoryTypeCount = {};
data.rawData.accessories.forEach(acc => {
  const type = acc.type;
  if (type) {
    accessoryTypeCount[type] = (accessoryTypeCount[type] || 0) + 1;
  }
});

console.log("\n配件类型统计:");
Object.entries(accessoryTypeCount).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} 个配件 -> ${accTypeMap[type] || '未映射'}`);
});

// 现在根据 slotAccessories 数据反推槽位到配件类型的映射
console.log(`\n从 ${Object.keys(data.rawData.slotAccessories).length} 个槽位-配件组合中提取映射关系...`);

const slotToAccType = {};

Object.entries(data.rawData.slotAccessories).forEach(([key, slotData]) => {
  const slotID = slotData.slotId;

  if (slotData.accessories && slotData.accessories.length > 0) {
    // 获取第一个配件的类型作为这个槽位的配件类型
    const firstAcc = slotData.accessories[0];
    if (firstAcc && firstAcc.acc && firstAcc.acc.type) {
      const accType = accTypeMap[firstAcc.acc.type];
      if (accType && !slotToAccType[slotID]) {
        slotToAccType[slotID] = accType;
      }
    }
  }
});

console.log(`\n提取到 ${Object.keys(slotToAccType).length} 个槽位的配件类型映射`);

// 更新 slotMap
Object.keys(slotMap).forEach(slotID => {
  if (slotToAccType[slotID]) {
    slotMap[slotID].accType = slotToAccType[slotID];
  }
});

// 显示前15个映射
console.log("\n前15个槽位映射:");
Object.entries(slotMap).slice(0, 15).forEach(([slotID, info]) => {
  console.log(`  ${slotID}: ${info.nameCN} -> ${info.accType || '(未映射)'}`);
});

// 保存到文件
fs.writeFileSync(gunSlotMapPath, JSON.stringify(slotMap, null, 2), "utf-8");
console.log(`\n✓ gunSlotMap.json 已生成，共 ${Object.keys(slotMap).length} 个槽位类型`);
console.log(`  其中 ${Object.values(slotMap).filter(v => v.accType).length} 个有配件类型映射`);
