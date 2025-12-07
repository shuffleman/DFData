const fs = require('fs');
const path = require('path');

const dataJsonPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));

console.log('=== data.json 结构 ===');
console.log('顶层键:', Object.keys(data));

if (data.rawData) {
    console.log('\nrawData 键:', Object.keys(data.rawData));
}

// 查找容器数据
const allKeys = data.rawData ? Object.keys(data.rawData) : [];
const containerKeys = allKeys.filter(k => k.toLowerCase().includes('container') || k.toLowerCase().includes('protect') || k.toLowerCase().includes('bag'));
console.log('\n可能包含容器的键:', containerKeys);

// 检查 protect 数据
if (data.rawData.protect) {
    console.log('\nprotect 数据量:', data.rawData.protect.length);
    const bags = data.rawData.protect.filter(item => item.secondClass === 'bag');
    console.log('背包数量:', bags.length);
    if (bags.length > 0) {
        console.log('\n第一个背包示例:');
        console.log(JSON.stringify(bags[0], null, 2));
    }
}
