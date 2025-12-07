const fs = require('fs');
const path = require('path');

const dataJsonPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));

console.log('=== 检查背包和胸挂数据 ===\n');

// 检查背包
if (data.rawData.backpacks) {
    console.log('背包数据量:', data.rawData.backpacks.length);
    const firstBag = data.rawData.backpacks[0];
    console.log('\n第一个背包完整数据:');
    console.log(JSON.stringify(firstBag, null, 2));
}

console.log('\n' + '='.repeat(50) + '\n');

// 检查胸挂
if (data.rawData.chests) {
    console.log('胸挂数据量:', data.rawData.chests.length);
    const firstChest = data.rawData.chests[0];
    console.log('\n第一个胸挂完整数据:');
    console.log(JSON.stringify(firstChest, null, 2));
}
