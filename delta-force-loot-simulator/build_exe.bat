@echo off
chcp 65001 >nul
echo ========================================
echo 三角洲舔包模拟器 - 打包工具
echo Delta Force Loot Simulator - Build Tool
echo ========================================
echo.

:: 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.7+
    pause
    exit /b 1
)

:: 检查 dist 目录是否存在
if not exist "dist\" (
    echo [错误] dist 目录不存在
    echo 请先运行: npm run build
    pause
    exit /b 1
)

echo [1/4] 检查 PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo PyInstaller 未安装，正在安装...
    pip install pyinstaller
    if errorlevel 1 (
        echo [错误] PyInstaller 安装失败
        pause
        exit /b 1
    )
)
echo ✓ PyInstaller 已安装

echo.
echo [2/4] 检查 Pillow（用于图标转换）...
pip show Pillow >nul 2>&1
if errorlevel 1 (
    echo Pillow 未安装，正在安装...
    pip install Pillow
    if errorlevel 1 (
        echo [错误] Pillow 安装失败
        pause
        exit /b 1
    )
)
echo ✓ Pillow 已安装

echo.
echo [3/4] 开始打包...
echo 这可能需要几分钟时间...
echo.

pyinstaller --clean --onefile ^
    --add-data "dist;dist" ^
    --icon public/deltaforce.png ^
    --name "三角洲舔包模拟器" ^
    launcher.py

if errorlevel 1 (
    echo.
    echo [错误] 打包失败
    pause
    exit /b 1
)

echo.
echo [4/4] 清理临时文件...
if exist "build\" rmdir /s /q "build"
if exist "三角洲舔包模拟器.spec" del "三角洲舔包模拟器.spec"

echo.
echo ========================================
echo ✓ 打包完成！
echo ========================================
echo.
echo 输出位置: dist\三角洲舔包模拟器.exe
echo.
echo 提示:
echo - 可以将 exe 文件分发给其他用户
echo - 双击 exe 即可启动游戏（无需安装 Python）
echo - 首次运行可能需要允许防火墙访问
echo.
pause
