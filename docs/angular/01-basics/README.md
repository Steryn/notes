# 01 - Angular基础概念与环境搭建

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular的基本概念和架构
- 开发环境的搭建
- Angular CLI的使用
- 项目结构理解

## 🎯 核心概念

### 1. 什么是Angular？

Angular是一个基于TypeScript的开源Web应用框架，由Google开发。它采用组件化架构，帮助开发者构建可扩展的单页面应用(SPA)。

### 2. Angular的核心特性

- **组件化架构**：将应用分解为可重用的组件
- **双向数据绑定**：自动同步模型和视图
- **依赖注入**：管理组件间的依赖关系
- **路由系统**：实现单页面应用导航
- **TypeScript支持**：提供类型安全和更好的开发体验

### 3. Angular架构概览

```
┌─────────────────┐
│   模板 (Template) │
├─────────────────┤
│   组件 (Component) │
├─────────────────┤
│   服务 (Service)  │
├─────────────────┤
│   模块 (Module)   │
└─────────────────┘
```

## 🛠️ 环境搭建

### 1. 系统要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 2. 安装Angular CLI

```bash
# 全局安装Angular CLI
npm install -g @angular/cli

# 验证安装
ng version
```

### 3. 创建新项目

```bash
# 创建新项目
ng new my-angular-app

# 进入项目目录
cd my-angular-app

# 启动开发服务器
ng serve
```

## 📁 项目结构解析

```
my-angular-app/
├── src/                    # 源代码目录
│   ├── app/               # 应用主目录
│   │   ├── app.component.css
│   │   ├── app.component.html
│   │   ├── app.component.spec.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   ├── assets/            # 静态资源
│   ├── environments/      # 环境配置
│   ├── index.html         # 主HTML文件
│   ├── main.ts           # 应用入口点
│   ├── polyfills.ts      # 浏览器兼容性
│   ├── styles.css        # 全局样式
│   └── test.ts           # 测试入口
├── angular.json          # Angular配置文件
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript配置
└── README.md
```

### 关键文件说明

- **main.ts**: 应用启动入口
- **app.module.ts**: 根模块，定义应用的基本结构
- **app.component.ts**: 根组件，应用的根组件
- **angular.json**: Angular项目配置文件
- **tsconfig.json**: TypeScript编译配置

## 🎮 实践练习

### 练习1：环境搭建验证

1. 安装Node.js和npm
2. 全局安装Angular CLI
3. 创建名为`hello-angular`的新项目
4. 启动开发服务器并访问<http://localhost:4200>

### 练习2：项目结构探索

1. 打开创建的项目
2. 查看各个文件的内容
3. 理解文件的作用和关系
4. 尝试修改`app.component.html`中的内容

## 📚 扩展阅读

- [Angular官方文档 - 快速开始](https://angular.cn/start)
- [Angular CLI命令参考](https://angular.cn/cli)
- [TypeScript基础](https://www.typescriptlang.org/docs/)

## 🔍 常见问题

### Q: 如何更新Angular CLI？

A: 使用命令 `npm install -g @angular/cli@latest`

### Q: 项目启动失败怎么办？

A: 检查Node.js版本，确保端口4200未被占用

### Q: 如何创建特定版本的Angular项目？

A: 使用 `ng new my-app --version=20.0.0`

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 解释Angular的基本概念
- [ ] 搭建开发环境
- [ ] 使用Angular CLI创建项目
- [ ] 理解项目结构
- [ ] 启动开发服务器

## 🚀 下一步

完成本章节学习后，请继续学习[02-第一个Angular应用](./../02-first-app/README.md)。
