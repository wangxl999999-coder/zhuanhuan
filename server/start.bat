@echo off
echo ========================================
echo   文件格式转换服务 - 启动脚本
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [1/2] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
) else (
    echo [1/2] 依赖已安装，跳过...
)

echo.
echo [2/2] 启动文件转换服务...
echo 服务地址: http://localhost:3000
echo 按 Ctrl+C 停止服务
echo.

call npm start
pause
