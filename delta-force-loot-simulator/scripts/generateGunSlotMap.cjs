/**
 * 从 data.json 生成正确的 gunSlotMap.json
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const gunSlotMapPath = path.join(__dirname, "../public/json/gunSlotMap.json");

const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 从 data.json 生成 gunSlotMap.json ===\n");

// 使用 structuredData.slotTypes 来生成 gunSlotMap
const slotMap = {};

if (data.structuredData && data.structuredData.slotTypes) {
  const slotTypes = data.structuredData.slotTypes;
  console.log(`找到 ${slotTypes.length} 个槽位类型\n`);

  slotTypes.forEach(slot => {
    const slotID = slot.slotID || slot.slotid || slot.slotId;
    if (slotID) {
      slotMap[slotID] = {
        nameCN: slot.nameCN || slot.slotName || "",
        accType: slot.accType || ""
      };
    }
  });

  console.log(`生成了 ${Object.keys(slotMap).length} 个槽位映射\n`);

  // 显示前10个映射
  console.log("前10个槽位映射:");
  Object.entries(slotMap).slice(0, 10).forEach(([slotID, info]) => {
    console.log(`  ${slotID}:`);
    console.log(`    nameCN: ${info.nameCN}`);
    console.log(`    accType: ${info.accType}`);
  });

  // 保存到文件
  fs.writeFileSync(gunSlotMapPath, JSON.stringify(slotMap, null, 2), "utf-8");
  console.log(`\n✓ gunSlotMap.json 已生成，共 ${Object.keys(slotMap).length} 个槽位类型`);
} else {
  console.error("❌ 在 data.json 中未找到 structuredData.slotTypes");
}
