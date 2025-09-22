# 04 - 数据绑定与事件处理

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular数据绑定机制
- 插值绑定
- 属性绑定
- 事件绑定
- 双向绑定
- 事件处理最佳实践

## 🎯 核心概念

### 1. 数据绑定类型

Angular提供四种数据绑定方式：

```
数据流向         语法                    类型
组件 → 模板      {{ value }}            插值绑定
组件 → 模板      [property]="value"     属性绑定
模板 → 组件      (event)="handler()"    事件绑定
双向绑定         [(ngModel)]="value"    双向绑定
```

### 2. 变更检测

Angular使用变更检测来跟踪数据变化：

- **脏检查**：比较当前值和之前值
- **自动触发**：用户交互、HTTP请求、定时器
- **性能优化**：OnPush策略减少检测频率

## 🔧 插值绑定

### 1. 基本插值

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

### 2. 安全导航操作符

```html
<!-- 避免空值错误 -->
<p>用户名：{{ user?.name }}</p>
<p>邮箱：{{ user?.profile?.email }}</p>

<!-- 使用默认值 -->
<p>显示名称：{{ user?.name || '匿名用户' }}</p>
```

### 3. 管道使用

```html
<!-- 内置管道 -->
<p>价格：{{ price | currency:'CNY':'symbol':'1.2-2' }}</p>
<p>日期：{{ date | date:'yyyy-MM-dd HH:mm:ss' }}</p>
<p>文本：{{ text | uppercase }}</p>
<p>数字：{{ number | number:'1.2-2' }}</p>

<!-- 链式管道 -->
<p>价格：{{ price | currency:'CNY' | lowercase }}</p>
```

## 🎨 属性绑定

### 1. 基本属性绑定

```html
<!-- 基本属性 -->
<img [src]="imageUrl" [alt]="imageAlt">
<button [disabled]="isDisabled">按钮</button>
<input [value]="inputValue" [placeholder]="placeholder">

<!-- 类绑定 -->
<div [class.active]="isActive">内容</div>
<div [class]="cssClass">内容</div>
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">内容</div>

<!-- 样式绑定 -->
<div [style.color]="textColor">文本</div>
<div [style.font-size.px]="fontSize">文本</div>
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">文本</div>
```

### 2. 属性绑定示例

```typescript
// 组件代码
export class DataBindingComponent {
  // 基本属性
  imageUrl = 'https://example.com/image.jpg';
  imageAlt = '示例图片';
  isDisabled = false;
  inputValue = '初始值';
  placeholder = '请输入内容';

  // 类绑定
  isActive = true;
  cssClass = 'custom-class';
  isDisabled = false;

  // 样式绑定
  textColor = 'blue';
  fontSize = 16;

  // 动态样式对象
  dynamicStyles = {
    'background-color': 'lightblue',
    'padding': '10px',
    'border-radius': '5px'
  };
}
```

```html
<!-- 模板代码 -->
<div class="container">
  <!-- 基本属性绑定 -->
  <img [src]="imageUrl" [alt]="imageAlt" class="responsive-image">
  <button [disabled]="isDisabled" class="btn">点击我</button>
  <input [value]="inputValue" [placeholder]="placeholder" class="form-input">

  <!-- 类绑定 -->
  <div [class.active]="isActive" class="card">
    动态类绑定
  </div>
  
  <div [class]="cssClass">
    完全替换类
  </div>
  
  <div [ngClass]="{'active': isActive, 'disabled': isDisabled}">
    条件类绑定
  </div>

  <!-- 样式绑定 -->
  <div [style.color]="textColor" [style.font-size.px]="fontSize">
    动态样式
  </div>
  
  <div [ngStyle]="dynamicStyles">
    样式对象绑定
  </div>
</div>
```

## ⚡ 事件绑定

### 1. 基本事件绑定

```html
<!-- 点击事件 -->
<button (click)="onClick()">点击</button>
<button (click)="onClick($event)">点击（带事件对象）</button>

<!-- 输入事件 -->
<input (input)="onInput($event)" (blur)="onBlur()">
<textarea (input)="onTextareaInput($event)"></textarea>

<!-- 表单事件 -->
<form (submit)="onSubmit($event)">
  <button type="submit">提交</button>
</form>

<!-- 鼠标事件 -->
<div (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
  鼠标悬停区域
</div>
```

### 2. 键盘事件

```html
<!-- 键盘事件 -->
<input (keyup)="onKeyUp($event)" (keydown)="onKeyDown($event)">

<!-- 特定按键 -->
<input (keyup.enter)="onEnter()" (keyup.escape)="onEscape()">
<input (keyup.space)="onSpace()" (keyup.arrowup)="onArrowUp()">

<!-- 组合键 -->
<input (keyup.control.enter)="onCtrlEnter()">
```

### 3. 事件处理示例

```typescript
// 组件代码
export class EventHandlingComponent {
  // 基本事件处理
  onClick() {
    console.log('按钮被点击');
  }

  onClickWithEvent(event: MouseEvent) {
    console.log('点击位置:', event.clientX, event.clientY);
    event.preventDefault(); // 阻止默认行为
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    console.log('输入值:', target.value);
  }

  onBlur() {
    console.log('输入框失去焦点');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('表单提交');
  }

  // 键盘事件处理
  onKeyUp(event: KeyboardEvent) {
    console.log('按键:', event.key);
  }

  onEnter() {
    console.log('按下了Enter键');
  }

  onEscape() {
    console.log('按下了Escape键');
  }

  // 鼠标事件处理
  onMouseEnter() {
    console.log('鼠标进入');
  }

  onMouseLeave() {
    console.log('鼠标离开');
  }
}
```

## 🔄 双向绑定

### 1. 使用ngModel

```html
<!-- 基本双向绑定 -->
<input [(ngModel)]="name" placeholder="请输入姓名">
<textarea [(ngModel)]="description"></textarea>

<!-- 带验证的双向绑定 -->
<input 
  [(ngModel)]="email" 
  type="email" 
  required 
  email
  #emailInput="ngModel">

<!-- 选择框双向绑定 -->
<select [(ngModel)]="selectedOption">
  <option value="">请选择</option>
  <option value="option1">选项1</option>
  <option value="option2">选项2</option>
</select>
```

### 2. 自定义双向绑定

```typescript
// 自定义组件
@Component({
  selector: 'app-custom-input',
  template: `
    <input 
      [value]="value" 
      (input)="onInput($event)"
      (blur)="onBlur()">
  `
})
export class CustomInputComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }

  onBlur() {
    // 失去焦点时的处理
  }
}
```

```html
<!-- 使用自定义双向绑定 -->
<app-custom-input [(value)]="customValue"></app-custom-input>
```

## 🎮 实践练习

### 练习1：创建交互式表单

创建一个包含以下功能的表单：

- 姓名输入（双向绑定）
- 邮箱输入（带验证）
- 年龄选择（数字输入）
- 爱好选择（复选框组）
- 实时预览用户输入

### 练习2：实现动态样式切换

创建一个组件，支持：

- 点击切换主题颜色
- 动态调整字体大小
- 切换显示/隐藏内容
- 添加/移除CSS类

## 📚 详细示例

### 完整的用户信息组件

```typescript
// user-info.component.ts
import { Component } from '@angular/core';

export interface User {
  name: string;
  email: string;
  age: number;
  hobbies: string[];
  theme: string;
}

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent {
  // 用户数据
  user: User = {
    name: '',
    email: '',
    age: 0,
    hobbies: [],
    theme: 'light'
  };

  // 可用选项
  availableHobbies = ['编程', '阅读', '运动', '音乐', '旅行'];
  themes = [
    { value: 'light', label: '浅色主题' },
    { value: 'dark', label: '深色主题' },
    { value: 'blue', label: '蓝色主题' }
  ];

  // 状态
  isEditing = false;
  showPreview = true;

  // 事件处理
  onNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.user.name = target.value;
  }

  onHobbyToggle(hobby: string, isChecked: boolean) {
    if (isChecked) {
      this.user.hobbies.push(hobby);
    } else {
      const index = this.user.hobbies.indexOf(hobby);
      if (index > -1) {
        this.user.hobbies.splice(index, 1);
      }
    }
  }

  onThemeChange(theme: string) {
    this.user.theme = theme;
  }

  toggleEditing() {
    this.isEditing = !this.isEditing;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  saveUser() {
    console.log('保存用户信息:', this.user);
    this.isEditing = false;
  }

  resetUser() {
    this.user = {
      name: '',
      email: '',
      age: 0,
      hobbies: [],
      theme: 'light'
    };
  }

  // 计算属性
  get userDisplayName(): string {
    return this.user.name || '匿名用户';
  }

  get isFormValid(): boolean {
    return !!(this.user.name && this.user.email && this.user.age > 0);
  }

  get themeClass(): string {
    return `theme-${this.user.theme}`;
  }
}
```

```html
<!-- user-info.component.html -->
<div class="user-info-container" [ngClass]="themeClass">
  <div class="header">
    <h2>用户信息管理</h2>
    <div class="controls">
      <button (click)="toggleEditing()" class="btn btn-primary">
        {{ isEditing ? '取消编辑' : '编辑信息' }}
      </button>
      <button (click)="togglePreview()" class="btn btn-secondary">
        {{ showPreview ? '隐藏预览' : '显示预览' }}
      </button>
    </div>
  </div>

  <div class="content">
    <!-- 编辑表单 -->
    <div class="edit-form" *ngIf="isEditing">
      <div class="form-group">
        <label for="name">姓名：</label>
        <input 
          id="name"
          type="text" 
          [(ngModel)]="user.name"
          placeholder="请输入姓名"
          class="form-control">
      </div>

      <div class="form-group">
        <label for="email">邮箱：</label>
        <input 
          id="email"
          type="email" 
          [(ngModel)]="user.email"
          placeholder="请输入邮箱"
          class="form-control">
      </div>

      <div class="form-group">
        <label for="age">年龄：</label>
        <input 
          id="age"
          type="number" 
          [(ngModel)]="user.age"
          min="1"
          max="120"
          class="form-control">
      </div>

      <div class="form-group">
        <label>爱好：</label>
        <div class="checkbox-group">
          <label *ngFor="let hobby of availableHobbies" class="checkbox-label">
            <input 
              type="checkbox" 
              [value]="hobby"
              [checked]="user.hobbies.includes(hobby)"
              (change)="onHobbyToggle(hobby, $event.target.checked)">
            {{ hobby }}
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="theme">主题：</label>
        <select 
          id="theme"
          [(ngModel)]="user.theme"
          class="form-control">
          <option *ngFor="let theme of themes" [value]="theme.value">
            {{ theme.label }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button 
          (click)="saveUser()" 
          [disabled]="!isFormValid"
          class="btn btn-success">
          保存
        </button>
        <button (click)="resetUser()" class="btn btn-warning">
          重置
        </button>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="preview" *ngIf="showPreview">
      <h3>用户信息预览</h3>
      <div class="user-card">
        <div class="user-avatar">
          {{ userDisplayName.charAt(0) }}
        </div>
        <div class="user-details">
          <h4>{{ userDisplayName }}</h4>
          <p><strong>邮箱：</strong>{{ user.email || '未设置' }}</p>
          <p><strong>年龄：</strong>{{ user.age || '未设置' }}</p>
          <p><strong>爱好：</strong>{{ user.hobbies.join(', ') || '无' }}</p>
          <p><strong>主题：</strong>{{ user.theme }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

```css
/* user-info.component.css */
.user-info-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.theme-light {
  background-color: #ffffff;
  color: #333333;
}

.theme-dark {
  background-color: #333333;
  color: #ffffff;
}

.theme-blue {
  background-color: #e3f2fd;
  color: #1565c0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.controls {
  display: flex;
  gap: 10px;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.edit-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.preview {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.user-details h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.user-details p {
  margin: 5px 0;
  color: #666;
}

.btn {
  padding: 8px 16px;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 10px;
  }
  
  .controls {
    width: 100%;
    justify-content: center;
  }
}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用插值绑定显示数据
- [ ] 使用属性绑定设置元素属性
- [ ] 使用事件绑定处理用户交互
- [ ] 使用双向绑定实现数据同步
- [ ] 处理各种类型的事件
- [ ] 实现动态样式和类绑定

## 🚀 下一步

完成本章节学习后，请继续学习[05-指令与管道](./../05-directives-pipes/README.md)。
