/**
 * 从根目录的 装备.json 和 配件.json 同步装备和配件价格
 */
const fs = require("fs");
const path = require("path");

// 读取 装备.json 和 配件.json
const equipmentJsonPath = path.join(__dirname, "../装备.json");
const accessoryJsonPath = path.join(__dirname, "../配件.json");

const equipmentData = JSON.parse(fs.readFileSync(equipmentJsonPath, "utf-8"));
const accessoryData = JSON.parse(fs.readFileSync(accessoryJsonPath, "utf-8"));

console.log(`从 装备.json 读取了 ${equipmentData.length} 个装备的价格数据`);
console.log(`从 配件.json 读取了 ${accessoryData.length} 个配件的价格数据\n`);

// 创建 objectID -> avgPrice 的映射
const priceMap = new Map();

// 处理装备数据
equipmentData.forEach(item => {
  if (item.objectID && item.avgPrice !== undefined) {
    priceMap.set(item.objectID, item.avgPrice);
  }
});

// 处理配件数据
accessoryData.forEach(item => {
  if (item.objectID && item.avgPrice !== undefined) {
    priceMap.set(item.objectID, item.avgPrice);
  }
});

console.log(`建立了 ${priceMap.size} 个物品的价格映射\n`);

/**
 * 更新单个JSON文件中的价格
 */
function updateJsonFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ 文件不存在: ${fileName}`);
    return { updated: 0, notFound: 0, total: 0, changed: 0 };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const fileData = JSON.parse(content);

  let updated = 0;
  let notFound = 0;
  let total = 0;
  let changed = 0;

  if (fileData.jData && fileData.jData.data && fileData.jData.data.data && fileData.jData.data.data.list) {
    const list = fileData.jData.data.data.list;
    total = list.length;

    for (const item of list) {
      if (item.objectID) {
        const price = priceMap.get(item.objectID);
        if (price !== undefined) {
          const oldPrice = item.baseValue;
          item.baseValue = price;
          updated++;

          // 如果价格有变化，计数并输出详细信息
          if (oldPrice !== price) {
            changed++;
            console.log(`    ${item.objectName}: ¥${oldPrice} -> ¥${price}`);
          }
        } else {
          notFound++;
          console.log(`    ⚠ 未找到价格: ${item.objectName} (ID: ${item.objectID})`);
        }
      }
    }

    // 保存更新后的文件
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
  }

  return { updated, notFound, total, changed };
}

// 主函数
function main() {
  console.log("开始同步装备和配件价格...\n");

  // 需要更新的文件列表
  const files = [
    // 配件文件
    { path: "public/json/acc/accScope.json", name: "瞄具" },
    { path: "public/json/acc/accBarrel.json", name: "枪管" },
    { path: "public/json/acc/accBackGrip.json", name: "后握把" },
    { path: "public/json/acc/accStock.json", name: "枪托" },
    { path: "public/json/acc/accHandGuard.json", name: "护木" },
    { path: "public/json/acc/accMagazine.json", name: "弹匣" },
    { path: "public/json/acc/accMuzzle.json", name: "枪口" },
    { path: "public/json/acc/accForeGrip.json", name: "前握把" },
    { path: "public/json/acc/accFunctional.json", name: "功能配件" },
    // 装备文件
    { path: "public/json/protect/helmet.json", name: "头盔" }
  ];

  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalItems = 0;
  let totalChanged = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, "..", file.path);
    console.log(`\n更新 ${file.name}...`);
    const result = updateJsonFile(filePath, file.name);

    if (result.total > 0) {
      const changedMsg = result.changed > 0 ? `(${result.changed} 个价格有变化)` : "(无变化)";
      const notFoundMsg = result.notFound > 0 ? ` [${result.notFound} 个未找到价格]` : "";
      console.log(`✓ ${file.name}: 更新了 ${result.updated}/${result.total} 个物品 ${changedMsg}${notFoundMsg}`);
      totalUpdated += result.updated;
      totalNotFound += result.notFound;
      totalItems += result.total;
      totalChanged += result.changed;
    }
  }

  console.log(`\n========================================`);
  console.log(`总计: 更新了 ${totalUpdated}/${totalItems} 个物品`);
  console.log(`价格有变化: ${totalChanged} 个`);
  if (totalNotFound > 0) {
    console.log(`未找到价格: ${totalNotFound} 个`);
  }
  console.log(`========================================`);

  console.log("\n装备和配件价格同步完成！");
}

main();
