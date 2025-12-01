# Windows 打包说明

## ⚠️ 网络问题

由于 Electron 二进制文件较大（~100MB），下载可能会遇到网络问题。

## 🔧 解决方案

### 方案一：使用镜像源（推荐）

1. **设置 Electron 镜像**
```bash
# 使用淘宝镜像
set ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

# 安装依赖
npm install
```

2. **或者编辑 .npmrc 文件**
在项目根目录创建 `.npmrc` 文件：
```
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 方案二：手动下载 Electron

1. **下载 Electron**
   - 访问: https://github.com/electron/electron/releases
   - 下载对应版本（v28.0.0）的 Windows 版本
   - 或使用国内镜像: https://cdn.npmmirror.com/binaries/electron/

2. **放置到缓存目录**
```bash
# 缓存路径（替换版本号）
%LOCALAPPDATA%\electron\Cache\electron-v28.0.0-win32-x64.zip
```

3. **重新安装**
```bash
npm install
```

### 方案三：使用 cnpm

```bash
# 安装 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用 cnpm 安装
cnpm install
```

### 方案四：手动打包（无需 electron-builder）

创建一个简单的打包脚本 `package-manual.bat`:

```batch
@echo off
echo 手动打包 Electron 应用

:: 1. 复制应用文件
mkdir dist-manual
xcopy /E /I /Y *.* dist-manual\
xcopy /E /I /Y src dist-manual\src\

:: 2. 下载 Electron
:: 手动下载 electron.exe 并放入 dist-manual\

:: 3. 创建启动脚本
echo node main.js > dist-manual\run.bat

echo.
echo 打包完成！
echo 请手动下载 Electron 到 dist-manual\ 目录
pause
```

## 📦 标准打包流程（依赖安装成功后）

### 1. 安装依赖
```bash
npm install
```

### 2. 打包应用
```bash
npm run build
```

### 3. 查看输出
打包后的文件在 `dist` 目录：
```
dist/
├── DFData Manager Setup 1.0.0.exe  - 安装程序
└── win-unpacked/                    - 免安装版本
    └── DFData Manager.exe
```

## 🚀 快速打包命令（一键）

创建 `打包.bat`:
```batch
@echo off
title DFData Manager - 打包工具

echo ============================================
echo   DFData Manager 打包工具
echo ============================================
echo.

:: 设置镜像源
echo [1/3] 配置镜像源...
call npm config set registry https://registry.npmmirror.com
call npm config set electron_mirror https://cdn.npmmirror.com/binaries/electron/
echo [OK] 镜像源配置完成
echo.

:: 安装依赖
echo [2/3] 安装依赖...
if not exist "node_modules" (
    echo 正在安装 npm 包...
    call cnpm install || call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败!
        echo 请检查网络连接或使用方案二手动下载
        pause
        exit /b 1
    )
) else (
    echo [跳过] 依赖包已存在
)
echo.

:: 打包应用
echo [3/3] 打包应用...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 打包失败!
    pause
    exit /b 1
)
echo.

echo ============================================
echo   打包完成!
echo   输出目录: dist/
echo ============================================
echo.

:: 打开输出目录
start dist

pause
```

## 🎯 最简单的方案：Portable 版本

不需要打包，直接运行：

1. 确保已安装 Node.js
2. 运行 `启动应用.bat`
3. 应用会在开发模式下启动

**优点**:
- 无需打包
- 修改代码立即生效
- 调试方便

**缺点**:
- 需要 Node.js环境
- 不够专业

## 📋 打包配置说明

如需自定义打包，编辑 `package.json` 的 `build` 部分：

```json
{
  "build": {
    "appId": "com.dfdata.manager",
    "productName": "DFData Manager",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

可选的 target:
- `nsis` - 安装程序
- `portable` - 免安装版
- `zip` - 压缩包

## 🔍 常见问题

### Q: Electron 下载失败？
**A**: 使用镜像源或手动下载（见方案一、二）

### Q: 打包后文件很大？
**A**: Electron 应用通常 150-200MB，这是正常的，包含了 Node.js 和 Chromium

### Q: 如何减小体积？
**A**:
- 使用 `electron-builder` 的压缩选项
- 移除不需要的 node_modules
- 使用 `asar` 打包

### Q: 能打包成绿色版吗？
**A**: 可以，使用 `portable` target

### Q: 如何添加应用图标？
**A**:
1. 准备 256x256 的 PNG 图片
2. 转换为 ICO 格式
3. 放在 `assets/icon.ico`

## 💡 建议

**开发阶段**:
- 使用 `npm start` 直接运行
- 修改代码实时生效

**交付用户**:
- 打包成 portable 版本
- 或者提供安装程序

**内部测试**:
- 使用免安装版本
- 快速分发测试

---

**需要帮助？** 查看 `README.md` 或 `使用指南.md`
