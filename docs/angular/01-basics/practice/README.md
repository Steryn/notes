# 练习1：环境搭建与项目创建

## 🎯 练习目标

通过本练习，您将：

- 验证开发环境是否正确安装
- 创建第一个Angular项目
- 熟悉项目结构
- 运行并查看应用

## 📋 练习步骤

### 步骤1：环境检查

1. 打开终端/命令提示符
2. 检查Node.js版本：

   ```bash
   node --version
   ```

   确保版本为18.x或更高

3. 检查npm版本：

   ```bash
   npm --version
   ```

   确保版本为9.x或更高

### 步骤2：安装Angular CLI

```bash
# 全局安装Angular CLI
npm install -g @angular/cli

# 验证安装
ng version
```

### 步骤3：创建项目

```bash
# 创建新项目（选择默认配置）
ng new hello-angular

# 进入项目目录
cd hello-angular
```

### 步骤4：启动开发服务器

```bash
# 启动开发服务器
ng serve

# 或者指定端口
ng serve --port 4201
```

### 步骤5：查看应用

1. 打开浏览器访问 `<http://localhost:4200>`
2. 您应该看到Angular的欢迎页面
3. 尝试修改 `src/app/app.component.html` 文件
4. 观察浏览器中的实时更新

## 🔧 练习任务

### 任务1：修改欢迎信息

1. 打开 `src/app/app.component.html`
2. 将标题改为"我的第一个Angular应用"
3. 添加您的姓名
4. 保存文件并观察变化

### 任务2：探索项目结构

1. 查看 `src/app/app.component.ts` 文件
2. 理解组件的结构
3. 查看 `src/app/app.module.ts` 文件
4. 理解模块的作用

### 任务3：添加样式

1. 打开 `src/app/app.component.css`
2. 添加一些自定义样式
3. 在HTML中应用这些样式

## 📝 练习代码示例

### app.component.html

```html
<div class="container">
  <h1>{{ title }}</h1>
  <p>欢迎来到Angular世界！</p>
  <p>我的名字是：{{ name }}</p>
</div>
```

### app.component.ts

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '我的第一个Angular应用';
  name = '您的姓名';
}
```

### app.component.css

```css
.container {
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #1976d2;
  margin-bottom: 20px;
}

p {
  font-size: 16px;
  line-height: 1.5;
}
```

## ✅ 完成检查

完成本练习后，请确认：

- [ ] 成功创建了Angular项目
- [ ] 开发服务器正常运行
- [ ] 能够修改组件内容
- [ ] 理解基本的项目结构
- [ ] 能够添加自定义样式

## 🎉 恭喜

您已经成功创建了第一个Angular应用！接下来请学习[02-第一个Angular应用](../../02-first-app/README.md)来深入了解Angular的核心概念。
