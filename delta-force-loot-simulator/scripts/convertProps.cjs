/**
 * 转换 props 数据（收集品、消耗品、钥匙）的图片URL为本地路径
 */

const fs = require('fs');
const path = require('path');

const propsDir = path.join(__dirname, '../public/json/props');
const files = ['collection.json', 'consume.json', 'key.json'];

files.forEach(filename => {
    const filepath = path.join(propsDir, filename);

    if (!fs.existsSync(filepath)) {
        console.log(`⚠ ${filename} 不存在，跳过`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    if (!data.jData || !data.jData.data || !data.jData.data.data || !data.jData.data.data.list) {
        console.log(`⚠ ${filename} 格式不正确，跳过`);
        return;
    }

    const list = data.jData.data.data.list;
    let convertedCount = 0;

    list.forEach(item => {
        // 转换图片URL为本地路径
        if (item.pic && item.pic.startsWith('http')) {
            item.pic = `/images/${item.objectID}.png`;
            convertedCount++;
        }

        // 移除 prePic（预览图，不需要）
        if (item.prePic) {
            delete item.prePic;
        }

        // 添加 searchTime 字段
        if (!item.searchTime) {
            item.searchTime = 1.2;
        }

        // 添加 baseValue 字段（如果没有）
        if (!item.baseValue) {
            item.baseValue = 0;
        }
    });

    // 保存转换后的数据
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ ${filename} 转换完成 (${convertedCount}/${list.length} 个物品的图片路径已更新)`);
});

console.log('\n所有 props 数据转换完成！');
