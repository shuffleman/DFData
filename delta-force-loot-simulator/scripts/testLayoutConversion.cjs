const { convertToFrontendFormat } = require('./generateAllData.cjs');
const fs = require('fs');
const path = require('path');

const dataJsonPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));

console.log('=== 测试布局转换 ===\n');

// 测试一个背包
const testBag = data.rawData.backpacks[0];
console.log('原始背包数据的 grid:');
console.log(JSON.stringify(testBag.grid, null, 2));

const converted = convertToFrontendFormat(testBag, 'backpack');
console.log('\n转换后的 subgridLayout:');
console.log(JSON.stringify(converted.subgridLayout, null, 2));

// 测试一个胸挂
const testChest = data.rawData.chests[0];
console.log('\n\n原始胸挂数据的 grid:');
console.log(JSON.stringify(testChest.grid, null, 2));

const convertedChest = convertToFrontendFormat(testChest, 'chest');
console.log('\n转换后的 subgridLayout:');
console.log(JSON.stringify(convertedChest.subgridLayout, null, 2));
