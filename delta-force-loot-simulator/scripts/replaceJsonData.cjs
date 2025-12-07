/**
 * 备份旧数据并替换为新数据
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "../public");
const oldJsonDir = path.join(publicDir, "json");
const newJsonDir = path.join(publicDir, "json_new");
const backupDir = path.join(publicDir, "json_backup");

console.log("=== 备份并替换数据 ===\n");

// 1. 检查新数据是否存在
if (!fs.existsSync(newJsonDir)) {
  console.error("❌ 错误: 新数据目录不存在: json_new/");
  process.exit(1);
}

// 2. 备份旧数据
console.log("1. 备份旧数据...");
if (fs.existsSync(oldJsonDir)) {
  if (fs.existsSync(backupDir)) {
    console.log("   删除旧的备份...");
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  fs.renameSync(oldJsonDir, backupDir);
  console.log("   ✓ 已备份到 public/json_backup/\n");
} else {
  console.log("   ⚠ 旧数据目录不存在，跳过备份\n");
}

// 3. 将新数据重命名为 json
console.log("2. 替换为新数据...");
fs.renameSync(newJsonDir, oldJsonDir);
console.log("   ✓ 已将 json_new/ 重命名为 json/\n");

console.log("========================================");
console.log("数据替换完成！");
console.log("========================================");
console.log("\n如需恢复旧数据，请手动将 public/json_backup/ 重命名回 public/json/");
