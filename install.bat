@echo off
:: 设置终端正常显示中文简体
chcp 65001 >nul

echo ======================================
echo 正在检查 Node.js 和 Yarn 是否已安装...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 未安装,请先安装 Node.js!
    pause
    exit /b 1
)

where yarn >nul 2>nul
if %errorlevel% neq 0 (
    echo Yarn 未安装,请先安装 Yarn!
    pause
    exit /b 1
)

echo Node.js 和 Yarn 已正确安装!

echo ======================================
echo 正在检查网页端目录...
if not exist "web" (
    echo 未找到网页端目录!
    pause
    exit /b 1
)

echo ======================================
echo 正在尝试安装客户端 node_modules...
cd web
echo 当前目录: %CD%
call yarn install
if %errorlevel% neq 0 (
    echo 安装客户端依赖失败!
    cd ..
    pause
    exit /b 1
)
cd ..

echo ======================================
echo 安装完成!
pause