#!/bin/bash

echo "========================================"
echo "  文件格式转换服务 - 启动脚本"
echo "========================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
    echo "[1/2] 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "依赖安装失败，请检查网络连接"
        exit 1
    fi
else
    echo "[1/2] 依赖已安装，跳过..."
fi

echo ""
echo "[2/2] 启动文件转换服务..."
echo "服务地址: http://localhost:3000"
echo "按 Ctrl+C 停止服务"
echo ""

npm start
