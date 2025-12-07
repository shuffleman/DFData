/**
 * 检查并下载缺失的props图片
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const propsDir = path.join(__dirname, '../public/json/props');
const imagesDir = path.join(__dirname, '../public/images');
const files = ['collection.json', 'consume.json', 'key.json'];

// 确保images目录存在
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 下载图片的函数
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
                fileStream.on('error', reject);
            } else {
                reject(new Error('HTTP ' + response.statusCode));
            }
        }).on('error', reject);
    });
}

async function checkAndDownload() {
    const missingImages = [];
    
    // 收集所有需要检查的图片
    for (const filename of files) {
        const filepath = path.join(propsDir, filename);
        
        if (!fs.existsSync(filepath)) {
            console.log('⚠ ' + filename + ' 不存在，跳过');
            continue;
        }
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        const list = data.jData.data.data.list;
        
        for (const item of list) {
            const imageFilename = item.objectID + '.png';
            const imagePath = path.join(imagesDir, imageFilename);

            if (!fs.existsSync(imagePath)) {
                // 从原始数据获取远程URL
                const remoteUrl = 'https://playerhub.df.qq.com/playerhub/60004/object/' + item.objectID + '.png';
                missingImages.push({
                    objectID: item.objectID,
                    objectName: item.objectName,
                    url: remoteUrl,
                    path: imagePath,
                    type: filename.replace('.json', '')
                });
            }
        }
    }

    console.log('发现 ' + missingImages.length + ' 个缺失的图片文件');

    if (missingImages.length === 0) {
        console.log('所有图片都已存在！');
        return;
    }
    
    console.log('开始下载图片...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < missingImages.length; i++) {
        const img = missingImages[i];
        process.stdout.write('下载 [' + (i+1) + '/' + missingImages.length + '] ' + img.objectName + '...');

        try {
            await downloadImage(img.url, img.path);
            successCount++;
            console.log(' ✓');
        } catch (error) {
            failCount++;
            console.log(' ✗ (' + error.message + ')');
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n下载完成！成功: ' + successCount + ', 失败: ' + failCount);
}

checkAndDownload().catch(error => {
    console.error('发生错误:', error);
    process.exit(1);
});
