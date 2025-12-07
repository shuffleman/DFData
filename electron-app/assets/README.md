# 应用图标资源

本目录用于存放应用程序图标文件，用于不同平台的打包。

## 需要的图标文件

### Windows
- **icon.ico** - Windows 应用图标
  - 推荐尺寸：256x256 像素（支持多尺寸 ICO 文件）
  - 格式：.ico

### macOS
- **icon.icns** - macOS 应用图标
  - 推荐尺寸：512x512 或 1024x1024 像素
  - 格式：.icns
  - 可使用在线工具或命令行工具将 PNG 转换为 ICNS

### Linux
- **icon.png** - Linux 应用图标
  - 推荐尺寸：512x512 像素
  - 格式：.png

## 如何生成图标

### 方法 1：使用在线工具
1. 准备一个 1024x1024 的 PNG 图标
2. 使用以下工具转换：
   - https://www.icoconverter.com/ (PNG → ICO)
   - https://cloudconvert.com/png-to-icns (PNG → ICNS)

### 方法 2：使用命令行工具

#### 生成 ICO (Windows)
```bash
# 使用 ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

#### 生成 ICNS (macOS)
```bash
# 在 macOS 上
mkdir icon.iconset
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```

## 当前状态

⚠️ **缺失图标文件**

请添加以下文件以完成构建：
- [ ] icon.ico
- [ ] icon.icns
- [ ] icon.png

如果没有这些文件，Electron Builder 会使用默认图标，但强烈建议提供自定义图标以提升应用专业度。

## 临时解决方案

如果暂时没有准备图标，可以：
1. 从 `package.json` 的 `build` 配置中移除 `icon` 字段
2. 或者使用占位符图标（512x512 的纯色 PNG）

## 参考资源

- [Electron Builder Icons](https://www.electron.build/icons)
- [macOS Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Windows Icon Guidelines](https://docs.microsoft.com/windows/apps/design/style/iconography)
