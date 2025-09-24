# 练习2：创建第一个Angular应用

## 🎯 练习目标

通过本练习，您将：

- 创建完整的个人信息管理应用
- 掌握组件的基本结构
- 学会使用模板语法
- 实现数据绑定和事件处理

## 📋 练习步骤

### 步骤1：创建新项目

```bash
# 创建新项目
ng new personal-info-app

# 进入项目目录
cd personal-info-app

# 启动开发服务器
ng serve
```

### 步骤2：修改根组件

1. 打开 `src/app/app.component.ts`
2. 替换为以下代码：

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // 个人信息属性
  title = '个人信息管理系统';
  name = '张三';
  age = 25;
  profession = '前端开发工程师';
  email = 'zhangsan@example.com';
  phone = '138-0000-0000';
  
  // 爱好列表
  hobbies = ['编程', '阅读', '运动', '音乐'];
  
  // 状态控制
  showDetails = false;
  editMode = false;
  
  // 计数器
  visitCount = 0;
  
  // 方法
  toggleDetails() {
    this.showDetails = !this.showDetails;
    this.visitCount++;
  }
  
  toggleEditMode() {
    this.editMode = !this.editMode;
  }
  
  updateInfo(newName: string, newAge: number, newProfession: string) {
    this.name = newName;
    this.age = newAge;
    this.profession = newProfession;
    this.editMode = false;
  }
  
  addHobby(newHobby: string) {
    if (newHobby.trim()) {
      this.hobbies.push(newHobby.trim());
    }
  }
  
  removeHobby(index: number) {
    this.hobbies.splice(index, 1);
  }
}
```

### 步骤3：创建模板

1. 打开 `src/app/app.component.html`
2. 替换为以下代码：

```html
<div class="container">
  <header>
    <h1>{{ title }}</h1>
    <p>访问次数：{{ visitCount }}</p>
  </header>
  
  <main>
    <!-- 基本信息卡片 -->
    <div class="card">
      <h2>基本信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>姓名：</label>
          <span *ngIf="!editMode">{{ name }}</span>
          <input *ngIf="editMode" [(ngModel)]="name" class="edit-input">
        </div>
        
        <div class="info-item">
          <label>年龄：</label>
          <span *ngIf="!editMode">{{ age }}</span>
          <input *ngIf="editMode" [(ngModel)]="age" type="number" class="edit-input">
        </div>
        
        <div class="info-item">
          <label>职业：</label>
          <span *ngIf="!editMode">{{ profession }}</span>
          <input *ngIf="editMode" [(ngModel)]="profession" class="edit-input">
        </div>
        
        <div class="info-item">
          <label>邮箱：</label>
          <span>{{ email }}</span>
        </div>
        
        <div class="info-item">
          <label>电话：</label>
          <span>{{ phone }}</span>
        </div>
      </div>
      
      <div class="button-group">
        <button (click)="toggleEditMode()" class="btn btn-primary">
          {{ editMode ? '保存' : '编辑' }}
        </button>
        <button (click)="toggleDetails()" class="btn btn-secondary">
          {{ showDetails ? '隐藏详细信息' : '显示详细信息' }}
        </button>
      </div>
    </div>
    
    <!-- 详细信息卡片 -->
    <div class="card" *ngIf="showDetails">
      <h2>详细信息</h2>
      
      <!-- 爱好管理 -->
      <div class="hobbies-section">
        <h3>爱好管理</h3>
        <div class="hobby-list">
          <div *ngFor="let hobby of hobbies; let i = index" class="hobby-item">
            <span>{{ hobby }}</span>
            <button (click)="removeHobby(i)" class="btn btn-danger btn-sm">删除</button>
          </div>
        </div>
        
        <div class="add-hobby">
          <input #newHobbyInput placeholder="添加新爱好" class="hobby-input">
          <button (click)="addHobby(newHobbyInput.value); newHobbyInput.value=''" 
                  class="btn btn-success">添加</button>
        </div>
      </div>
    </div>
    
    <!-- 功能演示卡片 -->
    <div class="card">
      <h2>功能演示</h2>
      <div class="demo-section">
        <h3>数据绑定演示</h3>
        <p>当前姓名：<strong>{{ name }}</strong></p>
        <p>当前年龄：<strong>{{ age }}</strong></p>
        <p>爱好数量：<strong>{{ hobbies.length }}</strong></p>
      </div>
    </div>
  </main>
</div>
```

### 步骤4：添加样式

1. 打开 `src/app/app.component.css`
2. 替换为以下代码：

```css
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.card h2 {
  color: #333;
  margin-top: 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.info-item label {
  font-weight: bold;
  min-width: 80px;
  color: #555;
}

.info-item span {
  flex: 1;
  color: #333;
}

.edit-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.hobbies-section {
  margin-top: 20px;
}

.hobby-list {
  margin: 15px 0;
}

.hobby-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 5px 0;
  background-color: #e9ecef;
  border-radius: 5px;
}

.add-hobby {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.hobby-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.demo-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
}

.demo-section h3 {
  margin-top: 0;
  color: #495057;
}

.demo-section p {
  margin: 8px 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .add-hobby {
    flex-direction: column;
  }
}
```

### 步骤5：启用FormsModule

1. 打开 `src/app/app.module.ts`
2. 添加FormsModule导入：

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // 添加这行

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule // 添加这行
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## 🎮 练习任务

### 任务1：添加更多功能

1. 添加生日字段
2. 添加地址信息
3. 实现生日计算年龄功能
4. 添加头像上传功能（模拟）

### 任务2：优化用户体验

1. 添加加载状态
2. 添加确认对话框
3. 实现数据验证
4. 添加动画效果

### 任务3：数据持久化

1. 使用localStorage保存数据
2. 页面刷新后数据不丢失
3. 添加数据导入/导出功能

## ✅ 完成检查

完成本练习后，请确认：

- [ ] 应用能够正常运行
- [ ] 所有按钮功能正常
- [ ] 数据绑定工作正常
- [ ] 样式美观且响应式
- [ ] 代码结构清晰

## 🎉 恭喜

您已经成功创建了第一个完整的Angular应用！这个应用展示了Angular的核心功能：

- 组件结构
- 数据绑定
- 事件处理
- 条件渲染
- 列表渲染
- 表单处理

接下来请学习[03-组件与模板](../../03-components-templates/README.md)来深入了解Angular的组件系统。
