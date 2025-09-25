#!/bin/bash

# MongoDB学习资料开发服务器启动脚本

# 设置Node.js路径
export PATH="/Users/siyu/.nvm/versions/node/v22.17.1/bin:$PATH"

# 检查Node.js是否可用
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# 启动开发服务器
echo "🚀 Starting VitePress development server..."
echo "📚 MongoDB学习资料将在以下地址可用："
echo "   http://localhost:5173/notes/mongoDB/start"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run docs:dev
