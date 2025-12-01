@echo off
title DFData Manager - 一键打包工具

echo ============================================
echo   DFData Manager - Windows 打包工具
echo ============================================
echo.

cd /d "%~dp0"

:: 设置环境变量使用镜像
set ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js!
    echo 请先安装: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version
echo.

echo [2/4] 配置npm镜像源...
call npm config set registry https://registry.npmmirror.com
echo [OK] 镜像源已配置
echo.

echo [3/4] 安装依赖（这可能需要几分钟）...
if not exist "node_modules" (
    echo 正在安装依赖包...
    echo 如果失败，请查看 Windows打包说明.md
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [警告] npm install 失败!
        echo 尝试使用 cnpm...

        :: 尝试安装 cnpm
        call npm install -g cnpm --registry=https://registry.npmmirror.com
        call cnpm install

        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo [错误] 依赖安装失败!
            echo 请查看 Windows打包说明.md 了解解决方案
            pause
            exit /b 1
        )
    )
    echo [OK] 依赖安装完成
) else (
    echo [跳过] 依赖已安装
)
echo.

echo [4/4] 打包应用...
echo 正在生成 Windows 可执行文件...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] 打包失败!
    echo 请检查错误信息
    pause
    exit /b 1
)

echo.
echo ============================================
echo   打包成功!
echo ============================================
echo.
echo 输出文件位于 dist\ 目录:
echo   - DFData Manager Setup 1.0.0.exe  (安装程序)
echo   - win-unpacked\                    (免安装版)
echo.
echo 正在打开输出目录...

:: 检查 dist 目录是否存在
if exist "dist\" (
    start "" "dist\"
) else (
    echo [警告] dist 目录不存在
)

echo.
pause
