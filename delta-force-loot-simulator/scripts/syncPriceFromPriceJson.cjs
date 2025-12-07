/**
 * 从 price.json 同步价格到各个物品JSON文件
 */
const fs = require("fs");
const path = require("path");

// 读取 price.json
const priceJsonPath = path.join(__dirname, "../price.json");
const priceData = JSON.parse(fs.readFileSync(priceJsonPath, "utf-8"));

console.log(`从 price.json 读取了 ${priceData.length} 个物品的价格数据
`);

// 创建 objectID -> avgPrice 的映射
const priceMap = new Map();
priceData.forEach(item => {
  if (item.objectID && item.avgPrice !== undefined) {
    priceMap.set(item.objectID, item.avgPrice);
  }
});

console.log(`建立了 ${priceMap.size} 个物品的价格映射
`);

/**
 * 更新单个JSON文件中的价格
 */
function updateJsonFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ 文件不存在: ${fileName}`);
    return { updated: 0, notFound: 0, total: 0 };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  let updated = 0;
  let notFound = 0;
  let total = 0;

  if (data.jData && data.jData.data && data.jData.data.data && data.jData.data.data.list) {
    const list = data.jData.data.data.list;
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
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  return { updated, notFound, total };
}

/**
 * 更新 values.json
 */
function updateValuesJson() {
  const valuesPath = path.join(__dirname, "../public/json/values.json");
  
  // 从 priceMap 创建新的 values 数组
  const valuesList = [];
  
  priceData.forEach(item => {
    if (item.objectID && item.avgPrice !== undefined && item.objectName) {
      valuesList.push({
        objectID: item.objectID,
        objectName: item.objectName,
        baseValue: item.avgPrice
      });
    }
  });

  // 保存到 values.json
  const valuesData = { list: valuesList };
  fs.writeFileSync(valuesPath, JSON.stringify(valuesData, null, 2), "utf-8");
  
  console.log(`✓ 已更新 values.json: ${valuesList.length} 个物品\\n`);
}

// 主函数
function main() {
  console.log("开始同步价格...\\n");

  // 需要更新的文件列表
  const files = [
    { path: "public/json/gun/gunRifle.json", name: "步枪" },
    { path: "public/json/gun/gunPistol.json", name: "手枪" },
    { path: "public/json/gun/ammo.json", name: "弹药" },
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
    { path: "public/json/protect/chestRigs.json", name: "胸挂" },
    { path: "public/json/protect/helmet.json", name: "头盔" },
    { path: "public/json/props/collection.json", name: "收藏品" },
    { path: "public/json/props/consume.json", name: "消耗品" }
  ];

  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalItems = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, "..", file.path);
    const result = updateJsonFile(filePath, file.name);
    
    if (result.total > 0) {
      const notFoundMsg = result.notFound > 0 ? `(${result.notFound} 个未找到价格)` : "";
      console.log(`✓ ${file.name}: 更新了 ${result.updated}/${result.total} 个物品 ${notFoundMsg}`);
      totalUpdated += result.updated;
      totalNotFound += result.notFound;
      totalItems += result.total;
    }
  }

  console.log(`\\n总计: 更新了 ${totalUpdated}/${totalItems} 个物品`);
  if (totalNotFound > 0) {
    console.log(`未找到价格的物品数: ${totalNotFound}`);
  }

  // 更新 values.json
  updateValuesJson();

  console.log("价格同步完成！");
}

main();
