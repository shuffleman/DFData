/**
 * 从 data.json 同步武器和装备价格到各个物品JSON文件
 */
const fs = require("fs");
const path = require("path");

// 读取 data.json
const dataJsonPath = path.join(__dirname, "../data.json");
const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));

console.log("从 data.json 读取价格数据...\n");

// 创建 objectID -> avgPrice 的映射
const priceMap = new Map();

// 处理不同类型的数据
const categories = [
  { name: "weapons", key: "weapons", label: "武器" },
  { name: "accessories", key: "accessories", label: "配件" },
  { name: "helmets", key: "helmets", label: "头盔" },
  { name: "armors", key: "armors", label: "护甲" },
  { name: "backpacks", key: "backpacks", label: "背包" },
  { name: "chests", key: "chests", label: "胸挂" }
];

let totalItems = 0;
for (const category of categories) {
  const items = data.rawData[category.key] || [];
  let count = 0;

  items.forEach(item => {
    if (item.objectID && item.regular && item.regular.avgPrice !== undefined) {
      priceMap.set(item.objectID, item.regular.avgPrice);
      count++;
    }
  });

  console.log(`${category.label}: ${count} 个物品`);
  totalItems += count;
}

console.log(`\n建立了 ${priceMap.size} 个物品的价格映射\n`);

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
          item.baseValue = price;
          updated++;
        } else {
          notFound++;
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
  console.log("开始同步价格...\n");

  // 需要更新的文件列表
  const files = [
    { path: "public/json/gun/gunRifle.json", name: "步枪" },
    { path: "public/json/gun/gunPistol.json", name: "手枪" },
    { path: "public/json/gun/gunShotgun.json", name: "霰弹枪" },
    { path: "public/json/gun/gunLMG.json", name: "轻机枪" },
    { path: "public/json/gun/gunSMG.json", name: "冲锋枪" },
    { path: "public/json/gun/gunSniper.json", name: "狙击枪" },
    { path: "public/json/gun/gunMP.json", name: "手枪冲锋枪" },
    { path: "public/json/gun/gunSpecial.json", name: "特殊武器" },
    { path: "public/json/acc/accBackGrip.json", name: "后握把" },
    { path: "public/json/acc/accBarrel.json", name: "枪管" },
    { path: "public/json/acc/accForeGrip.json", name: "前握把" },
    { path: "public/json/acc/accFunctional.json", name: "功能配件" },
    { path: "public/json/acc/accHandGuard.json", name: "护木" },
    { path: "public/json/acc/accMagazine.json", name: "弹匣" },
    { path: "public/json/acc/accMuzzle.json", name: "枪口" },
    { path: "public/json/acc/accScope.json", name: "瞄具" },
    { path: "public/json/acc/accStock.json", name: "枪托" },
    { path: "public/json/protect/armor.json", name: "护甲" },
    { path: "public/json/protect/backpack.json", name: "背包" },
    { path: "public/json/protect/helmet.json", name: "头盔" },
    { path: "public/json/protect/chestRigs.json", name: "胸挂" }
  ];

  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalItemsCount = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, "..", file.path);
    const result = updateJsonFile(filePath, file.name);

    if (result.total > 0) {
      const notFoundMsg = result.notFound > 0 ? `(${result.notFound} 个未找到价格)` : "";
      console.log(`✓ ${file.name}: 更新了 ${result.updated}/${result.total} 个物品 ${notFoundMsg}`);
      totalUpdated += result.updated;
      totalNotFound += result.notFound;
      totalItemsCount += result.total;
    }
  }

  console.log(`\n总计: 更新了 ${totalUpdated}/${totalItemsCount} 个物品`);
  if (totalNotFound > 0) {
    console.log(`未找到价格的物品数: ${totalNotFound}`);
  }

  console.log("\n价格同步完成！");
}

main();
