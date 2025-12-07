/**
 * 生成 values.json - 从 price.json 和其他价格文件合并价格数据
 */
const fs = require("fs");
const path = require("path");

const priceJsonPath = path.join(__dirname, "../price.json");
const weaponJsonPath = path.join(__dirname, "../武器.json");
const equipJsonPath = path.join(__dirname, "../装备.json");
const accJsonPath = path.join(__dirname, "../配件.json");
const outputPath = path.join(__dirname, "../public/json/values.json");

console.log("=== 生成 values.json ===\n");

// 读取所有价格数据
const priceData = JSON.parse(fs.readFileSync(priceJsonPath, "utf-8"));
const weaponData = JSON.parse(fs.readFileSync(weaponJsonPath, "utf-8"));
const equipData = JSON.parse(fs.readFileSync(equipJsonPath, "utf-8"));
const accData = JSON.parse(fs.readFileSync(accJsonPath, "utf-8"));

// 建立价格映射
const priceMap = {};

// 1. price.json (直接是数组格式)
if (Array.isArray(priceData)) {
    priceData.forEach(item => {
        if (item.objectID && item.avgPrice) {
            priceMap[item.objectID] = item.avgPrice;
        }
    });
    console.log(`price.json: ${priceData.length} 个物品价格`);
}

// 2. 武器.json
if (weaponData.jData?.data?.data?.list) {
    weaponData.jData.data.data.list.forEach(item => {
        if (item.objectID && item.baseValue) {
            priceMap[item.objectID] = item.baseValue;
        }
    });
    console.log(`武器.json: 添加武器价格`);
}

// 3. 装备.json
if (equipData.jData?.data?.data?.list) {
    equipData.jData.data.data.list.forEach(item => {
        if (item.objectID && item.baseValue) {
            priceMap[item.objectID] = item.baseValue;
        }
    });
    console.log(`装备.json: 添加装备价格`);
}

// 4. 配件.json
if (accData.jData?.data?.data?.list) {
    accData.jData.data.data.list.forEach(item => {
        if (item.objectID && item.baseValue) {
            priceMap[item.objectID] = item.baseValue;
        }
    });
    console.log(`配件.json: 添加配件价格`);
}

// 转换为 values.json 格式
const valuesList = Object.entries(priceMap).map(([objectID, baseValue]) => ({
    objectID: Number(objectID),
    baseValue: Number(baseValue)
}));

const valuesJson = {
    list: valuesList
};

// 写入文件
fs.writeFileSync(outputPath, JSON.stringify(valuesJson, null, 2), "utf-8");

console.log(`\n✓ 已生成 values.json: ${valuesList.length} 个物品`);
console.log(`  输出路径: ${outputPath}`);
