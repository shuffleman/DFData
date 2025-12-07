/**
 * 从 data.json 同步武器的配件槽位信息到各个武器 JSON 文件
 */
const fs = require("fs");
const path = require("path");

const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("=== 从 data.json 同步武器配件槽位信息 ===\n");

// 武器文件列表
const weaponFiles = [
  { path: "public/json/gun/gunRifle.json", name: "步枪" },
  { path: "public/json/gun/gunPistol.json", name: "手枪" }
];

let totalUpdated = 0;
let totalWeapons = 0;

weaponFiles.forEach(file => {
  const filePath = path.join(__dirname, "..", file.path);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠ 文件不存在: ${file.name}`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const fileData = JSON.parse(content);

  let updated = 0;
  let weaponCount = 0;

  if (fileData.jData && fileData.jData.data && fileData.jData.data.data && fileData.jData.data.data.list) {
    const list = fileData.jData.data.data.list;
    weaponCount = list.length;
    totalWeapons += list.length;

    for (const weapon of list) {
      const objectID = weapon.objectID.toString();

      // 从 data.json 获取这个武器的槽位信息
      if (data.rawData.weaponSlots[objectID]) {
        const weaponSlots = data.rawData.weaponSlots[objectID];

        // 更新 gunDetail.accessory
        if (!weapon.gunDetail) {
          weapon.gunDetail = {};
        }

        // 转换槽位格式：从 data.json 的格式转换为我们需要的格式
        weapon.gunDetail.accessory = weaponSlots.slots.map(slot => ({
          slotID: slot.slotid, // 使用 slotid 字段 (小写)
          slotName: slot.slotName,
          slotType: slot.slotType
        }));

        updated++;
        console.log(`✓ ${weapon.objectName}: 更新了 ${weapon.gunDetail.accessory.length} 个配件槽位`);
      } else {
        console.log(`⚠ ${weapon.objectName}: 未在 data.json 中找到槽位信息`);
      }
    }

    // 保存更新后的文件
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
  }

  console.log(`\n✓ ${file.name}: 更新了 ${updated}/${weaponCount} 个武器\n`);
  totalUpdated += updated;
});

console.log(`========================================`);
console.log(`总计: 更新了 ${totalUpdated}/${totalWeapons} 个武器的配件槽位信息`);
console.log(`========================================\n`);
console.log("武器配件槽位信息同步完成！");
