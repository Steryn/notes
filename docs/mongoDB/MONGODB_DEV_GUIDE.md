# MongoDB学习资料开发指南

## 🚀 快速启动

### 方法1：使用启动脚本（推荐）

```bash
./start-dev.sh
```

### 方法2：手动启动

```bash
# 设置Node.js路径
export PATH="/Users/siyu/.nvm/versions/node/v22.17.1/bin:$PATH"

# 启动开发服务器
npm run docs:dev
```

## 📚 访问地址

- **主页**: <http://localhost:5173/notes/>
- **MongoDB学习资料**: <http://localhost:5173/notes/mongoDB/start>
- **MongoDB基础概念**: <http://localhost:5173/notes/mongoDB/01-basics>

## 🔧 解决的问题

### 1. Node.js路径问题

- ✅ 创建了启动脚本 `start-dev.sh`
- ✅ 自动设置正确的Node.js路径
- ✅ 检查Node.js和npm是否可用

### 2. 语法高亮警告

- ✅ 配置了markdown语法高亮主题
- ✅ 添加了常用语言支持
- ✅ 启用了行号显示

### 3. VitePress配置优化

- ✅ 添加了MongoDB路由配置
- ✅ 配置了侧边栏和菜单
- ✅ 优化了开发体验

## 📋 文件结构

```
docs/
├── .vitepress/
│   ├── config.ts              # 主配置文件（已优化）
│   ├── menu.ts                # 菜单配置
│   └── sidebar-mongodb.ts     # MongoDB侧边栏配置
├── mongoDB/
│   ├── start.md               # 学习大纲
│   ├── 01-basics.md           # 基础概念
│   ├── 02-installation.md     # 安装配置
│   ├── 03-crud.md             # CRUD操作
│   ├── 04-query.md            # 查询操作
│   ├── 05-indexing.md         # 索引优化
│   ├── 06-aggregation.md      # 聚合管道
│   ├── 07-schema.md           # 数据建模
│   ├── 08-security.md         # 安全管理
│   ├── 09-performance.md     # 性能调优
│   ├── 10-deployment.md      # 部署运维
│   └── README.md             # 使用说明
└── start-dev.sh              # 开发服务器启动脚本
```

## 🎯 学习路径

### 第一阶段：基础入门 (1-2周)

1. [MongoDB基础概念](./mongoDB/01-basics.md)
2. [安装与配置](./mongoDB/02-installation.md)
3. [基本CRUD操作](./mongoDB/03-crud.md)

### 第二阶段：核心技能 (2-3周)

4. [查询操作详解](./mongoDB/04-query.md)
5. [索引与性能优化](./mongoDB/05-indexing.md)
6. [聚合管道](./mongoDB/06-aggregation.md)

### 第三阶段：进阶应用 (2-3周)

7. [数据模型设计](./mongoDB/07-schema.md)
8. [安全与权限管理](./mongoDB/08-security.md)
9. [性能调优](./mongoDB/09-performance.md)

### 第四阶段：生产实践 (1-2周)

10. [部署与运维](./mongoDB/10-deployment.md)

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build

# 预览生产版本
npm run docs:preview
```

## 📝 注意事项

1. **Node.js版本**: 使用v22.17.1版本
2. **端口**: 默认使用5173端口
3. **路径**: 所有链接使用相对路径
4. **语法高亮**: 支持JavaScript、TypeScript、JSON、YAML、Bash、SQL等语言

## 🎉 完成状态

- ✅ VitePress配置完成
- ✅ MongoDB学习资料集成
- ✅ 菜单和侧边栏配置
- ✅ 语法高亮优化
- ✅ 开发服务器启动脚本
- ✅ 使用说明文档

**MongoDB学习资料已经完全配置完成，可以开始学习了！** 🚀
