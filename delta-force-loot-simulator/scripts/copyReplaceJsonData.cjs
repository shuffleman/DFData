/**
 * 使用复制的方式替换数据（避免权限问题）
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "../public");
const oldJsonDir = path.join(publicDir, "json");
const newJsonDir = path.join(publicDir, "json_new");

console.log("=== 直接复制替换数据 ===\n");

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 递归删除旧文件（保留目录结构）
function clearDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      clearDir(fullPath);
      // 不删除目录本身
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

// 1. 检查新数据是否存在
if (!fs.existsSync(newJsonDir)) {
  console.error("❌ 错误: 新数据目录不存在: json_new/");
  process.exit(1);
}

// 2. 清空旧数据目录中的文件
console.log("1. 清空旧数据文件...");
if (fs.existsSync(oldJsonDir)) {
  clearDir(oldJsonDir);
  console.log("   ✓ 已清空 public/json/\n");
}

// 3. 复制新数据到旧目录
console.log("2. 复制新数据...");
copyDir(newJsonDir, oldJsonDir);
console.log("   ✓ 已复制新数据到 public/json/\n");

// 4. 删除 json_new 目录
console.log("3. 清理临时目录...");
fs.rmSync(newJsonDir, { recursive: true, force: true });
console.log("   ✓ 已删除 public/json_new/\n");

console.log("========================================");
console.log("数据替换完成！");
console.log("========================================");
