/**
 * 批量下载所有物品图片
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 图片CDN基础URL
const IMAGE_BASE_URL = 'https://playerhub.df.qq.com/playerhub/60004/object/';
// 本地图片存储目录
const IMAGE_DIR = path.join(__dirname, '../public/images');

// 确保图片目录存在
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

/**
 * 从JSON文件中提取所有objectID
 */
function extractObjectIDs(jsonPath) {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(content);

  const objectIDs = [];

  // 处理标准格式: jData.data.data.list
  if (data.jData && data.jData.data && data.jData.data.data && data.jData.data.data.list) {
    for (const item of data.jData.data.data.list) {
      if (item.objectID) {
        objectIDs.push(item.objectID);
      }
    }
  }

  return objectIDs;
}

/**
 * 扫描所有JSON文件并收集objectID
 */
function collectAllObjectIDs() {
  const allObjectIDs = new Set();

  // 需要扫描的目录
  const directories = [
    path.join(__dirname, '../public/json/gun'),
    path.join(__dirname, '../public/json/acc'),
    path.join(__dirname, '../public/json/protect'),
    path.join(__dirname, '../public/json/props'),
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(dir, file);
      const objectIDs = extractObjectIDs(filePath);

      console.log(`从 ${file} 中提取了 ${objectIDs.length} 个物品ID`);

      for (const id of objectIDs) {
        allObjectIDs.add(id);
      }
    }
  }

  return Array.from(allObjectIDs);
}

/**
 * 下载单个图片
 */
function downloadImage(objectID) {
  return new Promise((resolve, reject) => {
    const imageUrl = `${IMAGE_BASE_URL}${objectID}.png`;
    const imagePath = path.join(IMAGE_DIR, `${objectID}.png`);

    // 如果文件已存在，跳过下载
    if (fs.existsSync(imagePath)) {
      resolve({ objectID, status: 'exists' });
      return;
    }

    const protocol = imageUrl.startsWith('https') ? https : http;

    const file = fs.createWriteStream(imagePath);

    const request = protocol.get(imageUrl, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve({ objectID, status: 'downloaded' });
        });
      } else {
        fs.unlink(imagePath, () => {}); // 删除不完整的文件
        reject(new Error(`下载失败: ${imageUrl}, 状态码: ${response.statusCode}`));
      }
    });

    request.on('error', (err) => {
      fs.unlink(imagePath, () => {}); // 删除不完整的文件
      reject(err);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlink(imagePath, () => {}); // 删除不完整的文件
      reject(err);
    });
  });
}

/**
 * 批量下载图片（带并发控制）
 */
async function downloadAllImages(objectIDs, concurrency = 10) {
  const total = objectIDs.length;
  let completed = 0;
  let downloaded = 0;
  let exists = 0;
  let failed = 0;

  console.log(`\n开始下载 ${total} 个物品图片...`);
  console.log(`并发数: ${concurrency}\n`);

  // 分批下载
  for (let i = 0; i < objectIDs.length; i += concurrency) {
    const batch = objectIDs.slice(i, i + concurrency);
    const promises = batch.map(objectID =>
      downloadImage(objectID)
        .then(result => {
          completed++;
          if (result.status === 'downloaded') {
            downloaded++;
          } else if (result.status === 'exists') {
            exists++;
          }

          // 显示进度
          const progress = ((completed / total) * 100).toFixed(1);
          process.stdout.write(`\r进度: ${progress}% (${completed}/${total}) - 新下载: ${downloaded}, 已存在: ${exists}, 失败: ${failed}`);

          return result;
        })
        .catch(err => {
          completed++;
          failed++;

          // 显示进度
          const progress = ((completed / total) * 100).toFixed(1);
          process.stdout.write(`\r进度: ${progress}% (${completed}/${total}) - 新下载: ${downloaded}, 已存在: ${exists}, 失败: ${failed}`);

          return { objectID: null, status: 'failed', error: err.message };
        })
    );

    await Promise.all(promises);
  }

  console.log('\n\n下载完成！');
  console.log(`总计: ${total} 个物品`);
  console.log(`新下载: ${downloaded} 个`);
  console.log(`已存在: ${exists} 个`);
  console.log(`失败: ${failed} 个`);
}

// 主函数
async function main() {
  console.log('正在扫描所有JSON文件...');
  const objectIDs = collectAllObjectIDs();

  console.log(`\n共找到 ${objectIDs.length} 个唯一物品ID`);

  await downloadAllImages(objectIDs);
}

// 执行
main().catch(err => {
  console.error('发生错误:', err);
  process.exit(1);
});
