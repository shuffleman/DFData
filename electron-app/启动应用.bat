@echo off
echo ================================================
echo    DFData Manager - 游戏装备数据管理工具
echo ================================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js!
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js 已安装
node --version
echo.

echo [2/3] 安装依赖包...
if not exist "node_modules" (
    echo 正在安装 npm 包，请稍候...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] npm install 失败!
        pause
        exit /b 1
    )
    echo [OK] 依赖包安装完成
) else (
    echo [跳过] 依赖包已存在
)
echo.

echo [3/3] 启动应用...
echo.
echo ================================================
echo    应用正在启动...
echo    如需停止，请按 Ctrl+C
echo ================================================
echo.

call npm start

pause
