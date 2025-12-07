/**
 * 从根目录的 武器.json 同步武器价格到各个武器JSON文件
 */
const fs = require("fs");
const path = require("path");

// 读取 武器.json
const weaponJsonPath = path.join(__dirname, "../武器.json");
const weaponData = JSON.parse(fs.readFileSync(weaponJsonPath, "utf-8"));

console.log(`从 武器.json 读取了 ${weaponData.length} 个武器的价格数据\n`);

// 创建 objectID -> avgPrice 的映射
const priceMap = new Map();
weaponData.forEach(weapon => {
  if (weapon.objectID && weapon.avgPrice !== undefined) {
    priceMap.set(weapon.objectID, weapon.avgPrice);
  }
});

console.log(`建立了 ${priceMap.size} 个武器的价格映射\n`);

/**
 * 更新单个JSON文件中的价格
 */
function updateJsonFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ 文件不存在: ${fileName}`);
    return { updated: 0, notFound: 0, total: 0 };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const fileData = JSON.parse(content);

  let updated = 0;
  let notFound = 0;
  let total = 0;

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

          // 如果价格有变化，输出详细信息
          if (oldPrice !== price) {
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

  return { updated, notFound, total };
}

// 主函数
function main() {
  console.log("开始同步武器价格...\n");

  // 需要更新的武器文件列表
  const files = [
    { path: "public/json/gun/gunRifle.json", name: "步枪" },
    { path: "public/json/gun/gunPistol.json", name: "手枪" }
  ];

  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalItems = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, "..", file.path);
    console.log(`\n更新 ${file.name}...`);
    const result = updateJsonFile(filePath, file.name);

    if (result.total > 0) {
      const notFoundMsg = result.notFound > 0 ? `(${result.notFound} 个未找到价格)` : "";
      console.log(`✓ ${file.name}: 更新了 ${result.updated}/${result.total} 个武器 ${notFoundMsg}`);
      totalUpdated += result.updated;
      totalNotFound += result.notFound;
      totalItems += result.total;
    }
  }

  console.log(`\n总计: 更新了 ${totalUpdated}/${totalItems} 个武器`);
  if (totalNotFound > 0) {
    console.log(`未找到价格的武器数: ${totalNotFound}`);
  }

  console.log("\n武器价格同步完成！");
}

main();
