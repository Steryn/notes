# 03 - 组件与模板

## 📖 学习目标

通过本章节学习，您将掌握：

- 组件的深入理解
- 模板语法详解
- 组件生命周期
- 组件间通信
- 高级模板功能

## 🎯 核心概念

### 1. 组件架构

组件是Angular应用的核心，每个组件包含：

```
组件 (Component)
├── 类 (Class) - 业务逻辑
├── 模板 (Template) - 视图结构
├── 样式 (Styles) - 外观样式
└── 元数据 (Metadata) - 配置信息
```

### 2. 组件生命周期

Angular组件有完整的生命周期钩子：

```typescript
ngOnChanges()    // 输入属性变化时
ngOnInit()       // 组件初始化时
ngDoCheck()      // 每次变更检测时
ngAfterContentInit()    // 内容投影初始化后
ngAfterContentChecked() // 内容投影检查后
ngAfterViewInit()       // 视图初始化后
ngAfterViewChecked()    // 视图检查后
ngOnDestroy()    // 组件销毁前
```

### 3. 模板语法

Angular模板支持丰富的语法：

- **插值**：`{{ expression }}`
- **属性绑定**：`[property]="expression"`
- **事件绑定**：`(event)="handler()"`
- **双向绑定**：`[(ngModel)]="property"`
- **结构指令**：`*ngIf`, `*ngFor`, `*ngSwitch`
- **属性指令**：`[ngClass]`, `[ngStyle]`

## 🏗️ 组件创建

### 1. 使用CLI创建组件

```bash
# 创建组件
ng generate component user-profile
# 或简写
ng g c user-profile

# 创建组件并指定路径
ng g c components/user-profile

# 创建内联模板组件
ng g c user-profile --inline-template
```

### 2. 手动创建组件

```typescript
// user-profile.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  @Input() user: any;
  @Output() userUpdated = new EventEmitter<any>();
  
  onUpdate() {
    this.userUpdated.emit(this.user);
  }
}
```

## 🎨 模板语法详解

### 1. 插值绑定

```html
<!-- 基本插值 -->
<h1>{{ title }}</h1>
<p>用户数量：{{ userCount }}</p>

<!-- 表达式插值 -->
<p>总价：{{ price * quantity }}</p>
<p>状态：{{ isActive ? '活跃' : '非活跃' }}</p>

<!-- 方法调用插值 -->
<p>格式化日期：{{ formatDate(createdAt) }}</p>
```

### 2. 属性绑定

```html
<!-- 基本属性绑定 -->
<img [src]="imageUrl" [alt]="imageAlt">
<button [disabled]="isDisabled">按钮</button>

<!-- 类绑定 -->
<div [class.active]="isActive">内容</div>
<div [class]="cssClass">内容</div>
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">内容</div>

<!-- 样式绑定 -->
<div [style.color]="textColor">文本</div>
<div [style.font-size.px]="fontSize">文本</div>
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">文本</div>
```

### 3. 事件绑定

```html
<!-- 基本事件绑定 -->
<button (click)="onClick()">点击</button>
<input (input)="onInput($event)" (blur)="onBlur()">

<!-- 事件对象 -->
<button (click)="onClick($event)">点击</button>

<!-- 键盘事件 -->
<input (keyup.enter)="onEnter()" (keyup.escape)="onEscape()">
```

### 4. 双向绑定

```html
<!-- 使用ngModel -->
<input [(ngModel)]="name" placeholder="请输入姓名">
<textarea [(ngModel)]="description"></textarea>

<!-- 自定义双向绑定 -->
<app-custom-input [(value)]="data"></app-custom-input>
```

## 🔄 结构指令

### 1. *ngIf

```html
<!-- 条件渲染 -->
<div *ngIf="isLoggedIn">欢迎回来！</div>
<div *ngIf="!isLoggedIn">请先登录</div>

<!-- 使用else -->
<div *ngIf="user; else noUser">
  <h2>欢迎，{{ user.name }}！</h2>
</div>
<ng-template #noUser>
  <p>请先登录</p>
</ng-template>
```

### 2. *ngFor

```html
<!-- 基本循环 -->
<ul>
  <li *ngFor="let item of items">{{ item }}</li>
</ul>

<!-- 带索引的循环 -->
<ul>
  <li *ngFor="let item of items; let i = index">
    {{ i + 1 }}. {{ item }}
  </li>
</ul>

<!-- 带trackBy的循环 -->
<ul>
  <li *ngFor="let user of users; trackBy: trackByUserId">
    {{ user.name }}
  </li>
</ul>
```

### 3. *ngSwitch

```html
<div [ngSwitch]="status">
  <div *ngSwitchCase="'loading'">加载中...</div>
  <div *ngSwitchCase="'success'">成功！</div>
  <div *ngSwitchCase="'error'">错误！</div>
  <div *ngSwitchDefault>未知状态</div>
</div>
```

## 🔗 组件间通信

### 1. 父子组件通信

```typescript
// 父组件
@Component({
  template: `
    <app-child 
      [data]="parentData" 
      (dataChange)="onDataChange($event)">
    </app-child>
  `
})
export class ParentComponent {
  parentData = 'Hello from parent';
  
  onDataChange(newData: string) {
    this.parentData = newData;
  }
}

// 子组件
@Component({
  selector: 'app-child',
  template: `
    <p>接收到的数据：{{ data }}</p>
    <button (click)="updateData()">更新数据</button>
  `
})
export class ChildComponent {
  @Input() data: string = '';
  @Output() dataChange = new EventEmitter<string>();
  
  updateData() {
    this.dataChange.emit('Updated from child');
  }
}
```

### 2. 使用服务通信

```typescript
// 数据服务
@Injectable()
export class DataService {
  private dataSubject = new BehaviorSubject<string>('');
  data$ = this.dataSubject.asObservable();
  
  updateData(data: string) {
    this.dataSubject.next(data);
  }
}

// 组件A
@Component({...})
export class ComponentA {
  constructor(private dataService: DataService) {}
  
  sendData() {
    this.dataService.updateData('Data from A');
  }
}

// 组件B
@Component({...})
export class ComponentB {
  data: string = '';
  
  constructor(private dataService: DataService) {
    this.dataService.data$.subscribe(data => {
      this.data = data;
    });
  }
}
```

## 🎮 实践练习

### 练习1：创建用户卡片组件

创建一个可重用的用户卡片组件，包含：

- 用户头像
- 用户信息
- 操作按钮
- 自定义样式

### 练习2：创建动态列表组件

创建一个动态列表组件，支持：

- 添加/删除项目
- 编辑项目
- 搜索过滤
- 排序功能

## 📚 详细示例

### 完整的用户卡片组件

```typescript
// user-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css']
})
export class UserCardComponent {
  @Input() user: User | null = null;
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<User>();
  @Output() delete = new EventEmitter<User>();
  @Output() toggle = new EventEmitter<User>();
  
  onEdit() {
    if (this.user) {
      this.edit.emit(this.user);
    }
  }
  
  onDelete() {
    if (this.user) {
      this.delete.emit(this.user);
    }
  }
  
  onToggle() {
    if (this.user) {
      this.toggle.emit(this.user);
    }
  }
}
```

```html
<!-- user-card.component.html -->
<div class="user-card" [class.inactive]="!user?.isActive">
  <div class="avatar">
    <img [src]="user?.avatar" [alt]="user?.name" *ngIf="user?.avatar">
    <div class="avatar-placeholder" *ngIf="!user?.avatar">
      {{ user?.name?.charAt(0) }}
    </div>
  </div>
  
  <div class="user-info">
    <h3>{{ user?.name }}</h3>
    <p class="email">{{ user?.email }}</p>
    <span class="role" [class]="'role-' + user?.role?.toLowerCase()">
      {{ user?.role }}
    </span>
  </div>
  
  <div class="status" [class.active]="user?.isActive">
    {{ user?.isActive ? '活跃' : '非活跃' }}
  </div>
  
  <div class="actions" *ngIf="showActions">
    <button (click)="onEdit()" class="btn btn-edit">编辑</button>
    <button (click)="onToggle()" class="btn btn-toggle">
      {{ user?.isActive ? '禁用' : '启用' }}
    </button>
    <button (click)="onDelete()" class="btn btn-delete">删除</button>
  </div>
</div>
```

```css
/* user-card.component.css */
.user-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.user-card.inactive {
  opacity: 0.6;
  border-color: #ffc107;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 15px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.user-info {
  text-align: center;
  margin-bottom: 15px;
}

.user-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.email {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.role {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.role-admin {
  background: #dc3545;
  color: white;
}

.role-user {
  background: #28a745;
  color: white;
}

.role-moderator {
  background: #ffc107;
  color: #333;
}

.status {
  text-align: center;
  margin-bottom: 15px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status:not(.active) {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-toggle {
  background: #ffc107;
  color: #333;
}

.btn-toggle:hover {
  background: #e0a800;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}
```

## 🔧 高级功能

### 1. 内容投影

```html
<!-- 父组件 -->
<app-card>
  <h2>卡片标题</h2>
  <p>卡片内容</p>
  <button>操作按钮</button>
</app-card>

<!-- 子组件模板 -->
<div class="card">
  <div class="card-header">
    <ng-content select="h2"></ng-content>
  </div>
  <div class="card-body">
    <ng-content select="p"></ng-content>
  </div>
  <div class="card-footer">
    <ng-content select="button"></ng-content>
  </div>
</div>
```

### 2. 视图封装

```typescript
@Component({
  selector: 'app-component',
  templateUrl: './component.html',
  styleUrls: ['./component.css'],
  encapsulation: ViewEncapsulation.None // 全局样式
  // encapsulation: ViewEncapsulation.Emulated // 默认，模拟封装
  // encapsulation: ViewEncapsulation.ShadowDom // 原生Shadow DOM
})
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 创建和使用组件
- [ ] 理解组件生命周期
- [ ] 使用各种模板语法
- [ ] 实现组件间通信
- [ ] 使用结构指令
- [ ] 创建可重用组件

## 🚀 下一步

完成本章节学习后，请继续学习[04-数据绑定与事件处理](./../04-data-binding/README.md)。
