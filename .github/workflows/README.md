# GitHub Actions 自动构建与发布指南

本目录包含 DFData Manager 项目的 CI/CD 自动化配置。

## Workflow 说明

### build-release.yml

自动构建和发布 Electron 应用的 GitHub Actions workflow。

#### 触发条件

Workflow 会在以下情况下自动触发：

1. **版本标签推送** - 推送形如 `v1.0.0` 的标签时
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **主分支推送** - 推送到 `main` 或 `master` 分支时
   ```bash
   git push origin main
   ```

3. **Pull Request** - 创建或更新针对 `main`/`master` 的 PR 时

4. **手动触发** - 在 GitHub Actions 页面手动运行

#### 构建流程

```
┌─────────────────────────────────────────┐
│  触发条件满足（tag/push/PR/手动）        │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐  ┌────▼─────┐  ┌────▼────┐
│Windows │  │  macOS   │  │  Linux  │
└───┬────┘  └────┬─────┘  └────┬────┘
    │            │             │
    │  1. Checkout 代码        │
    │  2. 安装 Node.js 18      │
    │  3. 安装依赖 (npm ci)    │
    │  4. 编译游戏 (webpack)   │
    │  5. 打包应用 (electron-builder)
    │  6. 上传 artifacts      │
    │            │             │
    └────────────┼─────────────┘
                 │
         ┌───────▼────────┐
         │  版本发布？     │
         └───────┬────────┘
                 │ (仅标签)
         ┌───────▼────────┐
         │ 创建 GitHub    │
         │ Release        │
         │ 附加所有平台包 │
         └────────────────┘
```

#### 构建产物

**Windows:**
- `DFData Manager Setup.exe` - NSIS 安装程序
- `DFData Manager.zip` - 便携版压缩包

**macOS:**
- `DFData Manager.dmg` - DMG 安装镜像
- `DFData Manager-mac.zip` - 压缩包

**Linux:**
- `DFData Manager.AppImage` - AppImage 格式
- `dfdata-manager_amd64.deb` - Debian/Ubuntu 包
- `dfdata-manager.rpm` - RedHat/Fedora 包

## 使用指南

### 发布新版本

#### 方法 1：使用版本标签（推荐）

```bash
# 1. 确保所有更改已提交
git add .
git commit -m "feat: 准备发布 v1.0.0"

# 2. 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 3. Workflow 会自动：
#    - 在所有平台构建应用
#    - 创建 GitHub Release
#    - 上传所有平台的安装包
```

#### 方法 2：手动触发

1. 访问 GitHub 仓库的 **Actions** 页面
2. 选择 **Build and Release** workflow
3. 点击 **Run workflow** 按钮
4. 选择分支并点击 **Run workflow**

### 测试构建

如果只想测试构建而不发布：

```bash
# 推送到主分支会触发构建但不会创建 Release
git push origin main

# 构建产物会在 Actions 的 Artifacts 中保存 7 天
```

### 下载构建产物

#### 从 Artifacts（测试构建）

1. 访问 **Actions** 页面
2. 点击对应的 workflow 运行记录
3. 在页面底部的 **Artifacts** 区域下载：
   - `windows-build`
   - `macos-build`
   - `linux-build`

#### 从 Releases（正式发布）

1. 访问仓库的 **Releases** 页面
2. 找到对应版本的 Release
3. 下载 **Assets** 中的安装包

## 配置说明

### Node.js 版本

默认使用 Node.js 18.x，可在 workflow 文件中修改：

```yaml
strategy:
  matrix:
    node-version: [18.x]  # 修改此处
```

### 构建平台

如果不需要某个平台，可以从 matrix 中移除：

```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest, ubuntu-latest]
    # 例如，只构建 Windows：
    # os: [windows-latest]
```

### 图标配置

确保 `electron-app/assets/` 目录下有对应的图标文件：

- Windows: `icon.ico`
- macOS: `icon.icns`
- Linux: `icon.png`

详见 `electron-app/assets/README.md`

## 故障排除

### 构建失败

#### 依赖安装失败

```
Error: npm ci failed
```

**解决方案：**
- 确保 `package-lock.json` 已提交
- 检查 package.json 中的依赖版本

#### 编译错误

```
Error: webpack compilation failed
```

**解决方案：**
- 本地运行 `npm run build:game` 测试
- 检查 TypeScript 类型错误
- 查看 webpack.config.js 配置

#### 打包失败

```
Error: electron-builder failed
```

**解决方案：**
- 检查 package.json 的 `build` 配置
- 确认图标文件存在（或临时移除 icon 配置）
- 查看 electron-builder 日志

### 权限问题

如果 Release 创建失败：

```
Error: Resource not accessible by integration
```

**解决方案：**
1. 检查仓库的 **Settings** → **Actions** → **General**
2. 确保 **Workflow permissions** 设置为 **Read and write permissions**
3. 启用 **Allow GitHub Actions to create and approve pull requests**

### macOS 签名问题

如果需要在 macOS 上签名应用，需要配置 secrets：

```yaml
env:
  CSC_LINK: ${{ secrets.MAC_CERT }}
  CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
```

## 最佳实践

### 版本号管理

使用语义化版本号（Semantic Versioning）：

- `v1.0.0` - 主版本（重大更改）
- `v1.1.0` - 次版本（新功能）
- `v1.1.1` - 补丁版本（Bug 修复）

### 标签命名

```bash
# ✅ 正确
v1.0.0
v2.1.3

# ❌ 错误
1.0.0 (缺少 v 前缀)
v1.0 (版本号不完整)
```

### 发布前检查清单

- [ ] 所有更改已提交并推送
- [ ] 本地构建测试通过 (`npm run build:game && npm run build`)
- [ ] 更新了版本号（`package.json` 中的 `version` 字段）
- [ ] 更新了 CHANGELOG 或 Release Notes
- [ ] 图标文件已准备（或移除 icon 配置）

### 自动化版本号更新

在创建标签前自动更新 package.json：

```bash
# 使用 npm version 命令
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# 自动创建 commit 和 tag
git push && git push --tags
```

## 性能优化

### 缓存依赖

workflow 已配置 npm 缓存：

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: electron-app/package-lock.json
```

这会大幅加快构建速度（首次构建约 5-10 分钟，后续约 2-5 分钟）。

### 并行构建

三个平台的构建是并行执行的，最大化 CI 资源利用率。

## 进阶配置

### 添加代码检查

在构建前添加 lint 和 test 步骤：

```yaml
- name: Lint code
  run: npm run lint

- name: Run tests
  run: npm test
```

### 自动部署到其他平台

可以扩展 workflow 实现：
- 上传到 S3/CDN
- 发布到 Microsoft Store
- 发布到 Mac App Store

### 通知集成

添加构建状态通知：
- Slack
- Discord
- Email

## 参考资源

- [GitHub Actions 文档](https://docs.github.com/actions)
- [Electron Builder 文档](https://www.electron.build/)
- [语义化版本号](https://semver.org/lang/zh-CN/)

## 许可证

本 workflow 配置与项目主许可证相同（MIT）。
