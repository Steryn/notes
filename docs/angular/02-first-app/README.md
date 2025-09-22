# 02 - 第一个Angular应用

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular应用的基本结构
- 组件的创建和使用
- 模板语法基础
- 数据绑定概念
- 组件间通信

## 🎯 核心概念

### 1. Angular应用架构

Angular应用由以下核心部分组成：

```
应用 (Application)
├── 模块 (Modules)
│   └── 组件 (Components)
│       ├── 模板 (Templates)
│       ├── 样式 (Styles)
│       └── 逻辑 (Logic)
├── 服务 (Services)
└── 路由 (Routing)
```

### 2. 组件 (Component)

组件是Angular应用的基本构建块，包含：

- **模板 (Template)**：定义组件的视图
- **类 (Class)**：定义组件的逻辑
- **元数据 (Metadata)**：描述组件的配置

### 3. 数据绑定

Angular提供四种数据绑定方式：

- **插值绑定**：`{{ value }}`
- **属性绑定**：`[property]="value"`
- **事件绑定**：`(event)="handler()"`
- **双向绑定**：`[(ngModel)]="value"`

## 🏗️ 创建第一个应用

### 1. 项目结构

```
src/app/
├── app.component.ts      # 根组件类
├── app.component.html    # 根组件模板
├── app.component.css     # 根组件样式
├── app.component.spec.ts # 根组件测试
└── app.module.ts         # 根模块
```

### 2. 组件类结构

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',           // 组件选择器
  templateUrl: './app.component.html', // 模板文件
  styleUrls: ['./app.component.css']   // 样式文件
})
export class AppComponent {
  // 组件属性
  title = 'My App';
  
  // 组件方法
  onClick() {
    console.log('Button clicked!');
  }
}
```

### 3. 模板语法

```html
<!-- 插值绑定 -->
<h1>{{ title }}</h1>

<!-- 属性绑定 -->
<img [src]="imageUrl" [alt]="imageAlt">

<!-- 事件绑定 -->
<button (click)="onClick()">点击我</button>

<!-- 双向绑定 -->
<input [(ngModel)]="name" placeholder="请输入姓名">
```

## 🎮 实践练习

### 练习1：创建个人信息组件

创建一个显示个人信息的组件，包含：

- 姓名
- 年龄
- 职业
- 爱好列表

### 练习2：添加交互功能

为组件添加：

- 点击按钮显示/隐藏详细信息
- 输入框修改姓名
- 计数器功能

## 📚 详细示例

### 完整的组件示例

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // 属性
  title = '个人信息管理';
  name = '张三';
  age = 25;
  profession = '前端开发工程师';
  hobbies = ['编程', '阅读', '运动'];
  showDetails = false;
  counter = 0;

  // 方法
  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  incrementCounter() {
    this.counter++;
  }

  updateName(newName: string) {
    this.name = newName;
  }
}
```

```html
<!-- app.component.html -->
<div class="container">
  <h1>{{ title }}</h1>
  
  <div class="profile">
    <h2>基本信息</h2>
    <p><strong>姓名：</strong>{{ name }}</p>
    <p><strong>年龄：</strong>{{ age }}</p>
    <p><strong>职业：</strong>{{ profession }}</p>
    
    <button (click)="toggleDetails()">
      {{ showDetails ? '隐藏' : '显示' }}详细信息
    </button>
    
    <div *ngIf="showDetails" class="details">
      <h3>爱好</h3>
      <ul>
        <li *ngFor="let hobby of hobbies">{{ hobby }}</li>
      </ul>
    </div>
  </div>
  
  <div class="interactions">
    <h3>交互功能</h3>
    <div>
      <input [(ngModel)]="name" placeholder="修改姓名">
      <button (click)="updateName(name)">更新姓名</button>
    </div>
    
    <div>
      <p>计数器：{{ counter }}</p>
      <button (click)="incrementCounter()">增加</button>
    </div>
  </div>
</div>
```

```css
/* app.component.css */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.profile {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.details {
  margin-top: 15px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 4px;
}

.interactions {
  background-color: #fff3e0;
  padding: 20px;
  border-radius: 8px;
}

button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

button:hover {
  background-color: #1565c0;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 5px;
}
```

## 🔧 高级功能

### 1. 组件生命周期

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

export class AppComponent implements OnInit, OnDestroy {
  ngOnInit() {
    console.log('组件初始化');
  }
  
  ngOnDestroy() {
    console.log('组件销毁');
  }
}
```

### 2. 输入和输出属性

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-child',
  template: `
    <h3>{{ title }}</h3>
    <button (click)="onButtonClick()">发送消息</button>
  `
})
export class ChildComponent {
  @Input() title: string = '';
  @Output() message = new EventEmitter<string>();
  
  onButtonClick() {
    this.message.emit('来自子组件的消息');
  }
}
```

## 📝 练习任务

### 任务1：创建待办事项组件

创建一个待办事项管理组件，包含：

- 待办事项列表
- 添加新事项
- 标记完成
- 删除事项

### 任务2：创建计数器组件

创建一个独立的计数器组件，包含：

- 显示当前数值
- 增加/减少按钮
- 重置功能
- 最大值限制

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 理解Angular应用的基本结构
- [ ] 创建和使用组件
- [ ] 使用模板语法
- [ ] 实现数据绑定
- [ ] 处理用户交互
- [ ] 理解组件生命周期

## 🚀 下一步

完成本章节学习后，请继续学习[03-组件与模板](./../03-components-templates/README.md)。
