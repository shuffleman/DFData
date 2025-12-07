/**
 * 修复收集品和消耗品的价格
 */
const fs = require('fs');
const path = require('path');

// 根据品级设置价格范围
const priceRanges = {
  1: { min: 500, max: 2000 },       // 白色
  2: { min: 2000, max: 8000 },      // 绿色
  3: { min: 8000, max: 25000 },     // 蓝色
  4: { min: 25000, max: 80000 },    // 紫色
  5: { min: 80000, max: 200000 },   // 橙色
  6: { min: 200000, max: 500000 }   // 金色
};

/**
 * 根据品级生成随机价格
 */
function generatePrice(grade) {
  const range = priceRanges[grade] || priceRanges[1];
  // 在范围内生成随机价格，向下取整到百位
  const price = Math.floor(Math.random() * (range.max - range.min) + range.min);
  return Math.floor(price / 100) * 100; // 向下取整到百位
}

/**
 * 更新物品价格
 */
function updatePrices(jsonPath, itemType) {
  if (!fs.existsSync(jsonPath)) {
    console.log(`文件不存在: ${jsonPath}`);
    return 0;
  }

  const content = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(content);

  let updateCount = 0;

  if (data.jData && data.jData.data && data.jData.data.data && data.jData.data.data.list) {
    for (const item of data.jData.data.data.list) {
      const grade = item.grade || 1;
      const newPrice = generatePrice(grade);
      
      // 更新价格
      item.baseValue = newPrice;
      updateCount++;
    }

    // 保存更新后的数据
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  return updateCount;
}

// 主函数
function main() {
  console.log('开始修复物品价格...\n');

  const collectionPath = path.join(__dirname, '../public/json/props/collection.json');
  const consumePath = path.join(__dirname, '../public/json/props/consume.json');

  const collectionCount = updatePrices(collectionPath, 'collection');
  const consumeCount = updatePrices(consumePath, 'consume');

  console.log(`✓ 已更新 collection.json: ${collectionCount} 个物品`);
  console.log(`✓ 已更新 consume.json: ${consumeCount} 个物品`);
  console.log('\n价格已根据物品品级设置完成！');
}

main();
