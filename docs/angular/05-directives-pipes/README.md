# 05 - 指令与管道

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular内置指令的使用
- 结构指令详解
- 属性指令详解
- 自定义指令创建
- 内置管道的使用
- 自定义管道创建

## 🎯 核心概念

### 1. 指令类型

Angular指令分为三种类型：

```
指令 (Directives)
├── 组件指令 (Component Directives)
├── 结构指令 (Structural Directives) - 改变DOM结构
└── 属性指令 (Attribute Directives) - 改变元素属性
```

### 2. 管道类型

```
管道 (Pipes)
├── 内置管道 (Built-in Pipes)
└── 自定义管道 (Custom Pipes)
```

## 🔧 结构指令

### 1. *ngIf

```html
<!-- 基本条件渲染 -->
<div *ngIf="isLoggedIn">欢迎回来！</div>
<div *ngIf="!isLoggedIn">请先登录</div>

<!-- 使用else -->
<div *ngIf="user; else noUser">
  <h2>欢迎，{{ user.name }}！</h2>
</div>
<ng-template #noUser>
  <p>请先登录</p>
</ng-template>

<!-- 复杂条件 -->
<div *ngIf="user && user.role === 'admin'">
  管理员面板
</div>
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

<!-- 获取循环状态 -->
<div *ngFor="let item of items; let first = first; let last = last; let even = even; let odd = odd">
  <span [class.first]="first" [class.last]="last" [class.even]="even" [class.odd]="odd">
    {{ item }}
  </span>
</div>
```

### 3. *ngSwitch

```html
<div [ngSwitch]="status">
  <div *ngSwitchCase="'loading'">加载中...</div>
  <div *ngSwitchCase="'success'">成功！</div>
  <div *ngSwitchCase="'error'">错误！</div>
  <div *ngSwitchDefault>未知状态</div>
</div>

<!-- 数字switch -->
<div [ngSwitch]="dayOfWeek">
  <div *ngSwitchCase="1">星期一</div>
  <div *ngSwitchCase="2">星期二</div>
  <div *ngSwitchCase="3">星期三</div>
  <div *ngSwitchCase="4">星期四</div>
  <div *ngSwitchCase="5">星期五</div>
  <div *ngSwitchDefault>周末</div>
</div>
```

## 🎨 属性指令

### 1. [ngClass]

```html
<!-- 条件类 -->
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">内容</div>

<!-- 动态类 -->
<div [ngClass]="cssClass">内容</div>

<!-- 复杂条件 -->
<div [ngClass]="{
  'btn': true,
  'btn-primary': type === 'primary',
  'btn-secondary': type === 'secondary',
  'btn-large': size === 'large',
  'btn-disabled': isDisabled
}">按钮</div>
```

### 2. [ngStyle]

```html
<!-- 动态样式 -->
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">文本</div>

<!-- 条件样式 -->
<div [ngStyle]="{
  'background-color': isActive ? 'green' : 'red',
  'color': 'white',
  'padding': '10px'
}">内容</div>

<!-- 复杂样式对象 -->
<div [ngStyle]="dynamicStyles">内容</div>
```

### 3. [ngModel]

```html
<!-- 双向绑定 -->
<input [(ngModel)]="name" placeholder="请输入姓名">
<textarea [(ngModel)]="description"></textarea>

<!-- 带验证 -->
<input 
  [(ngModel)]="email" 
  type="email" 
  required 
  email
  #emailInput="ngModel">

<!-- 选择框 -->
<select [(ngModel)]="selectedOption">
  <option value="">请选择</option>
  <option value="option1">选项1</option>
  <option value="option2">选项2</option>
</select>
```

## 🔨 自定义指令

### 1. 属性指令

```typescript
// highlight.directive.ts
import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective implements OnInit, OnDestroy {
  @Input() appHighlight: string = 'yellow';
  @Input() highlightColor: string = 'yellow';
  @Input() defaultColor: string = '';

  private originalColor: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.originalColor = this.el.nativeElement.style.backgroundColor;
    this.setHighlightColor(this.highlightColor || this.appHighlight);
  }

  ngOnDestroy() {
    this.setHighlightColor(this.originalColor);
  }

  private setHighlightColor(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', color);
  }
}
```

```html
<!-- 使用自定义指令 -->
<div appHighlight="lightblue">高亮内容</div>
<div appHighlight highlightColor="lightgreen">另一种高亮</div>
```

### 2. 结构指令

```typescript
// unless.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appUnless]'
})
export class UnlessDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
```

```html
<!-- 使用自定义结构指令 -->
<div *appUnless="isHidden">这个内容在isHidden为false时显示</div>
```

## 🔧 内置管道

### 1. 常用内置管道

```html
<!-- 日期管道 -->
<p>当前时间：{{ currentDate | date:'yyyy-MM-dd HH:mm:ss' }}</p>
<p>短日期：{{ currentDate | date:'short' }}</p>
<p>长日期：{{ currentDate | date:'full' }}</p>

<!-- 货币管道 -->
<p>价格：{{ price | currency:'CNY':'symbol':'1.2-2' }}</p>
<p>美元：{{ price | currency:'USD' }}</p>

<!-- 数字管道 -->
<p>小数：{{ number | number:'1.2-2' }}</p>
<p>百分比：{{ percentage | percent:'1.2-2' }}</p>

<!-- 文本管道 -->
<p>大写：{{ text | uppercase }}</p>
<p>小写：{{ text | lowercase }}</p>
<p>标题：{{ text | titlecase }}</p>

<!-- JSON管道 -->
<pre>{{ object | json }}</pre>

<!-- 切片管道 -->
<p>前5个字符：{{ text | slice:0:5 }}</p>
<p>数组切片：{{ items | slice:0:3 }}</p>

<!-- 键值对管道 -->
<div *ngFor="let item of object | keyvalue">
  {{ item.key }}: {{ item.value }}
</div>
```

### 2. 管道链式调用

```html
<!-- 链式管道 -->
<p>格式化价格：{{ price | currency:'CNY' | lowercase }}</p>
<p>格式化日期：{{ date | date:'short' | uppercase }}</p>
<p>数组处理：{{ items | slice:0:5 | json }}</p>
```

## 🎯 自定义管道

### 1. 基本管道

```typescript
// capitalize.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
```

### 2. 带参数的管道

```typescript
// truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.substring(0, limit) + suffix;
  }
}
```

### 3. 纯管道 vs 非纯管道

```typescript
// 纯管道（默认）
@Pipe({
  name: 'purePipe',
  pure: true // 默认值
})
export class PurePipe implements PipeTransform {
  transform(value: any): any {
    // 纯管道：输入相同，输出相同
    return value.toUpperCase();
  }
}

// 非纯管道
@Pipe({
  name: 'impurePipe',
  pure: false
})
export class ImpurePipe implements PipeTransform {
  transform(value: any): any {
    // 非纯管道：每次变更检测都会执行
    return new Date().toISOString();
  }
}
```

### 4. 复杂管道示例

```typescript
// filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

export interface FilterOptions {
  field: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
}

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], options: FilterOptions): any[] {
    if (!items || !options) return items;

    return items.filter(item => {
      const fieldValue = this.getNestedValue(item, options.field);
      
      switch (options.operator) {
        case 'contains':
          return fieldValue && fieldValue.toString().toLowerCase().includes(options.value.toLowerCase());
        case 'startsWith':
          return fieldValue && fieldValue.toString().toLowerCase().startsWith(options.value.toLowerCase());
        case 'endsWith':
          return fieldValue && fieldValue.toString().toLowerCase().endsWith(options.value.toLowerCase());
        case 'equals':
        default:
          return fieldValue === options.value;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}
```

## 🎮 实践练习

### 练习1：创建自定义指令

创建一个自定义指令，实现以下功能：

- 鼠标悬停时高亮显示
- 点击时改变背景色
- 支持自定义颜色配置

### 练习2：创建自定义管道

创建一个自定义管道，实现以下功能：

- 格式化文件大小（字节转换为KB、MB、GB）
- 格式化时间差（显示相对时间，如"2小时前"）
- 过滤数组（支持多条件过滤）

## 📚 详细示例

### 完整的指令和管道示例

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HighlightDirective } from './directives/highlight.directive';
import { UnlessDirective } from './directives/unless.directive';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { FilterPipe } from './pipes/filter.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HighlightDirective,
    UnlessDirective,
    CapitalizePipe,
    TruncatePipe,
    FilterPipe
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

```typescript
// app.component.ts
import { Component } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '指令与管道示例';
  
  // 用户数据
  users: User[] = [
    { id: 1, name: 'john doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'jane smith', email: 'jane@example.com', role: 'user', status: 'inactive' },
    { id: 3, name: 'bob wilson', email: 'bob@example.com', role: 'moderator', status: 'active' }
  ];

  // 状态
  isHighlighted = false;
  selectedUser: User | null = null;
  searchTerm = '';
  filterOptions = {
    field: 'name',
    value: '',
    operator: 'contains' as const
  };

  // 方法
  toggleHighlight() {
    this.isHighlighted = !this.isHighlighted;
  }

  selectUser(user: User) {
    this.selectedUser = user;
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterOptions.value = target.value;
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }
}
```

```html
<!-- app.component.html -->
<div class="container">
  <h1>{{ title }}</h1>

  <!-- 指令示例 -->
  <section class="directives-section">
    <h2>指令示例</h2>
    
    <!-- 结构指令 -->
    <div class="structural-directives">
      <h3>结构指令</h3>
      
      <!-- ngIf -->
      <div *ngIf="selectedUser; else noUserSelected">
        <h4>选中的用户：{{ selectedUser.name | capitalize }}</h4>
        <p>邮箱：{{ selectedUser.email }}</p>
        <p>角色：{{ selectedUser.role | capitalize }}</p>
        <p>状态：<span [ngClass]="getStatusClass(selectedUser.status)">{{ selectedUser.status | capitalize }}</span></p>
      </div>
      <ng-template #noUserSelected>
        <p>请选择一个用户</p>
      </ng-template>

      <!-- ngFor -->
      <div class="user-list">
        <h4>用户列表</h4>
        <ul>
          <li *ngFor="let user of users; let i = index; trackBy: trackByUserId" 
              [class.selected]="selectedUser?.id === user.id"
              (click)="selectUser(user)">
            {{ i + 1 }}. {{ user.name | capitalize }} - {{ user.email }}
          </li>
        </ul>
      </div>

      <!-- ngSwitch -->
      <div class="status-display">
        <h4>状态显示</h4>
        <div [ngSwitch]="selectedUser?.status">
          <div *ngSwitchCase="'active'" class="status-active">用户活跃</div>
          <div *ngSwitchCase="'inactive'" class="status-inactive">用户非活跃</div>
          <div *ngSwitchDefault class="status-unknown">状态未知</div>
        </div>
      </div>
    </div>

    <!-- 属性指令 -->
    <div class="attribute-directives">
      <h3>属性指令</h3>
      
      <!-- ngClass -->
      <div [ngClass]="{'highlighted': isHighlighted, 'selected': selectedUser}">
        动态类绑定示例
      </div>
      
      <!-- ngStyle -->
      <div [ngStyle]="{
        'background-color': isHighlighted ? 'lightblue' : 'lightgray',
        'padding': '10px',
        'border-radius': '5px'
      }">
        动态样式绑定示例
      </div>

      <!-- 自定义指令 -->
      <div appHighlight="lightgreen" class="custom-directive">
        自定义高亮指令
      </div>
    </div>
  </section>

  <!-- 管道示例 -->
  <section class="pipes-section">
    <h2>管道示例</h2>
    
    <!-- 内置管道 -->
    <div class="built-in-pipes">
      <h3>内置管道</h3>
      
      <div class="pipe-examples">
        <p><strong>日期管道：</strong>{{ currentDate | date:'yyyy-MM-dd HH:mm:ss' }}</p>
        <p><strong>货币管道：</strong>{{ price | currency:'CNY':'symbol':'1.2-2' }}</p>
        <p><strong>数字管道：</strong>{{ number | number:'1.2-2' }}</p>
        <p><strong>文本管道：</strong>{{ text | uppercase }}</p>
        <p><strong>JSON管道：</strong><pre>{{ selectedUser | json }}</pre></p>
      </div>
    </div>

    <!-- 自定义管道 -->
    <div class="custom-pipes">
      <h3>自定义管道</h3>
      
      <div class="pipe-examples">
        <p><strong>首字母大写：</strong>{{ 'hello world' | capitalize }}</p>
        <p><strong>文本截断：</strong>{{ longText | truncate:20:'...' }}</p>
        <p><strong>链式管道：</strong>{{ 'hello world' | capitalize | truncate:5 }}</p>
      </div>
    </div>

    <!-- 过滤示例 -->
    <div class="filter-example">
      <h3>过滤示例</h3>
      
      <input 
        type="text" 
        placeholder="搜索用户..." 
        (input)="onSearchChange($event)"
        class="search-input">
      
      <div class="filtered-users">
        <h4>过滤结果：</h4>
        <ul>
          <li *ngFor="let user of users | filter:filterOptions">
            {{ user.name | capitalize }} - {{ user.email }}
          </li>
        </ul>
      </div>
    </div>
  </section>

  <!-- 控制按钮 -->
  <div class="controls">
    <button (click)="toggleHighlight()" class="btn btn-primary">
      {{ isHighlighted ? '取消高亮' : '高亮显示' }}
    </button>
  </div>
</div>
```

```css
/* app.component.css */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

h1, h2, h3, h4 {
  color: #333;
  margin-bottom: 15px;
}

/* 结构指令样式 */
.user-list ul {
  list-style: none;
  padding: 0;
}

.user-list li {
  padding: 10px;
  margin: 5px 0;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-list li:hover {
  background: #e9ecef;
}

.user-list li.selected {
  background: #007bff;
  color: white;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #dc3545;
  font-weight: bold;
}

.status-unknown {
  color: #6c757d;
  font-weight: bold;
}

/* 属性指令样式 */
.highlighted {
  background-color: #fff3cd;
  border: 2px solid #ffc107;
}

.selected {
  border: 2px solid #007bff;
}

.custom-directive {
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
  font-weight: bold;
}

/* 管道示例样式 */
.pipe-examples {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
}

.pipe-examples p {
  margin: 8px 0;
  font-family: monospace;
}

.pipe-examples pre {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

/* 过滤示例样式 */
.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 15px;
}

.filtered-users ul {
  list-style: none;
  padding: 0;
}

.filtered-users li {
  padding: 8px;
  margin: 5px 0;
  background: #e3f2fd;
  border-radius: 4px;
}

/* 控制按钮 */
.controls {
  text-align: center;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  section {
    padding: 15px;
  }
}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用所有内置结构指令
- [ ] 使用所有内置属性指令
- [ ] 创建自定义属性指令
- [ ] 创建自定义结构指令
- [ ] 使用所有内置管道
- [ ] 创建自定义管道
- [ ] 理解纯管道和非纯管道的区别

## 🚀 下一步

完成本章节学习后，请继续学习[06-服务与依赖注入](./../06-services/README.md)。
