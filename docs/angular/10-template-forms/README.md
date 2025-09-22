# 10 - 模板驱动表单

## 📖 学习目标

通过本章节学习，您将掌握：

- 模板驱动表单基础
- 表单验证
- 双向数据绑定
- 表单状态管理
- 自定义验证器
- 表单提交处理

## 🎯 核心概念

### 1. 什么是模板驱动表单？

模板驱动表单是Angular提供的一种表单处理方式，特点：

- **声明式**：在模板中定义表单结构
- **双向绑定**：使用ngModel实现数据同步
- **简单易用**：适合简单的表单场景
- **自动验证**：内置验证器自动工作

### 2. 表单指令

```typescript
// 核心指令
ngForm        // 表单指令
ngModel       // 双向绑定
ngModelGroup  // 模型组
ngSubmit      // 提交事件
```

### 3. 表单状态

```typescript
// 表单状态
form.valid        // 表单是否有效
form.invalid      // 表单是否无效
form.pristine     // 表单是否未修改
form.dirty        // 表单是否已修改
form.touched      // 表单是否已触摸
form.untouched    // 表单是否未触摸
form.submitted    // 表单是否已提交
```

## 🏗️ 基础表单创建

### 1. 启用FormsModule

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // 导入FormsModule

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule // 添加到imports数组
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. 基本表单结构

```html
<!-- 基本表单 -->
<form #userForm="ngForm" (ngSubmit)="onSubmit(userForm)">
  <div class="form-group">
    <label for="name">姓名：</label>
    <input 
      type="text" 
      id="name" 
      name="name" 
      [(ngModel)]="user.name"
      required
      minlength="2"
      #nameInput="ngModel">
    
    <!-- 验证错误信息 -->
    <div *ngIf="nameInput.invalid && (nameInput.dirty || nameInput.touched)" 
         class="error-messages">
      <div *ngIf="nameInput.errors?.['required']">姓名是必填项</div>
      <div *ngIf="nameInput.errors?.['minlength']">
        姓名至少需要{{ nameInput.errors?.['minlength'].requiredLength }}个字符
      </div>
    </div>
  </div>
  
  <div class="form-group">
    <label for="email">邮箱：</label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      [(ngModel)]="user.email"
      required
      email
      #emailInput="ngModel">
    
    <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" 
         class="error-messages">
      <div *ngIf="emailInput.errors?.['required']">邮箱是必填项</div>
      <div *ngIf="emailInput.errors?.['email']">请输入有效的邮箱地址</div>
    </div>
  </div>
  
  <div class="form-group">
    <label for="age">年龄：</label>
    <input 
      type="number" 
      id="age" 
      name="age" 
      [(ngModel)]="user.age"
      required
      min="18"
      max="100"
      #ageInput="ngModel">
    
    <div *ngIf="ageInput.invalid && (ageInput.dirty || ageInput.touched)" 
         class="error-messages">
      <div *ngIf="ageInput.errors?.['required']">年龄是必填项</div>
      <div *ngIf="ageInput.errors?.['min']">年龄不能小于18岁</div>
      <div *ngIf="ageInput.errors?.['max']">年龄不能大于100岁</div>
    </div>
  </div>
  
  <button type="submit" [disabled]="userForm.invalid">提交</button>
</form>
```

### 3. 组件代码

```typescript
// user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

export interface User {
  name: string;
  email: string;
  age: number;
  role: string;
  interests: string[];
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  user: User = {
    name: '',
    email: '',
    age: 0,
    role: 'user',
    interests: []
  };
  
  roles = [
    { value: 'user', label: '普通用户' },
    { value: 'admin', label: '管理员' },
    { value: 'moderator', label: '版主' }
  ];
  
  interests = [
    { value: 'programming', label: '编程' },
    { value: 'reading', label: '阅读' },
    { value: 'sports', label: '运动' },
    { value: 'music', label: '音乐' }
  ];
  
  constructor() {}
  
  ngOnInit() {}
  
  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('表单数据:', this.user);
      // 这里可以调用服务提交数据
      // this.userService.createUser(this.user).subscribe(...)
    } else {
      console.log('表单验证失败');
      this.markFormGroupTouched(form);
    }
  }
  
  onInterestChange(interest: string, isChecked: boolean) {
    if (isChecked) {
      this.user.interests.push(interest);
    } else {
      const index = this.user.interests.indexOf(interest);
      if (index > -1) {
        this.user.interests.splice(index, 1);
      }
    }
  }
  
  isInterestSelected(interest: string): boolean {
    return this.user.interests.includes(interest);
  }
  
  private markFormGroupTouched(form: NgForm) {
    Object.keys(form.controls).forEach(key => {
      const control = form.controls[key];
      control.markAsTouched();
    });
  }
}
```

## 🔧 高级表单功能

### 1. 表单组

```html
<!-- 使用ngModelGroup分组 -->
<form #userForm="ngForm" (ngSubmit)="onSubmit(userForm)">
  <!-- 基本信息组 -->
  <fieldset ngModelGroup="basicInfo">
    <legend>基本信息</legend>
    
    <div class="form-group">
      <label for="firstName">名：</label>
      <input 
        type="text" 
        id="firstName" 
        name="firstName" 
        [(ngModel)]="user.firstName"
        required
        #firstNameInput="ngModel">
    </div>
    
    <div class="form-group">
      <label for="lastName">姓：</label>
      <input 
        type="text" 
        id="lastName" 
        name="lastName" 
        [(ngModel)]="user.lastName"
        required
        #lastNameInput="ngModel">
    </div>
  </fieldset>
  
  <!-- 联系信息组 -->
  <fieldset ngModelGroup="contactInfo">
    <legend>联系信息</legend>
    
    <div class="form-group">
      <label for="email">邮箱：</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        [(ngModel)]="user.email"
        required
        email
        #emailInput="ngModel">
    </div>
    
    <div class="form-group">
      <label for="phone">电话：</label>
      <input 
        type="tel" 
        id="phone" 
        name="phone" 
        [(ngModel)]="user.phone"
        pattern="[0-9]{11}"
        #phoneInput="ngModel">
    </div>
  </fieldset>
  
  <button type="submit" [disabled]="userForm.invalid">提交</button>
</form>
```

### 2. 选择框和复选框

```html
<!-- 下拉选择框 -->
<div class="form-group">
  <label for="role">角色：</label>
  <select 
    id="role" 
    name="role" 
    [(ngModel)]="user.role"
    required
    #roleSelect="ngModel">
    <option value="">请选择角色</option>
    <option *ngFor="let role of roles" [value]="role.value">
      {{ role.label }}
    </option>
  </select>
  
  <div *ngIf="roleSelect.invalid && roleSelect.touched" class="error-messages">
    <div *ngIf="roleSelect.errors?.['required']">请选择角色</div>
  </div>
</div>

<!-- 单选按钮组 -->
<div class="form-group">
  <label>性别：</label>
  <div class="radio-group">
    <label>
      <input 
        type="radio" 
        name="gender" 
        value="male" 
        [(ngModel)]="user.gender">
      男
    </label>
    <label>
      <input 
        type="radio" 
        name="gender" 
        value="female" 
        [(ngModel)]="user.gender">
      女
    </label>
  </div>
</div>

<!-- 复选框组 -->
<div class="form-group">
  <label>兴趣爱好：</label>
  <div class="checkbox-group">
    <label *ngFor="let interest of interests">
      <input 
        type="checkbox" 
        [value]="interest.value"
        [checked]="isInterestSelected(interest.value)"
        (change)="onInterestChange(interest.value, $event.target.checked)">
      {{ interest.label }}
    </label>
  </div>
</div>
```

### 3. 文本域和文件上传

```html
<!-- 文本域 -->
<div class="form-group">
  <label for="bio">个人简介：</label>
  <textarea 
    id="bio" 
    name="bio" 
    [(ngModel)]="user.bio"
    rows="4"
    cols="50"
    maxlength="500"
    #bioTextarea="ngModel">
  </textarea>
  <div class="char-count">
    {{ user.bio?.length || 0 }}/500
  </div>
</div>

<!-- 文件上传 -->
<div class="form-group">
  <label for="avatar">头像：</label>
  <input 
    type="file" 
    id="avatar" 
    name="avatar" 
    accept="image/*"
    (change)="onFileSelected($event)"
    #fileInput>
  
  <div *ngIf="selectedFile" class="file-info">
    <p>已选择文件: {{ selectedFile.name }}</p>
    <p>文件大小: {{ formatFileSize(selectedFile.size) }}</p>
  </div>
</div>
```

## 🎯 表单验证

### 1. 内置验证器

```html
<!-- 必填验证 -->
<input 
  type="text" 
  name="name" 
  [(ngModel)]="user.name"
  required
  #nameInput="ngModel">

<!-- 最小长度验证 -->
<input 
  type="text" 
  name="name" 
  [(ngModel)]="user.name"
  minlength="2"
  #nameInput="ngModel">

<!-- 最大长度验证 -->
<input 
  type="text" 
  name="name" 
  [(ngModel)]="user.name"
  maxlength="50"
  #nameInput="ngModel">

<!-- 邮箱格式验证 -->
<input 
  type="email" 
  name="email" 
  [(ngModel)]="user.email"
  email
  #emailInput="ngModel">

<!-- 数字范围验证 -->
<input 
  type="number" 
  name="age" 
  [(ngModel)]="user.age"
  min="18"
  max="100"
  #ageInput="ngModel">

<!-- 正则表达式验证 -->
<input 
  type="tel" 
  name="phone" 
  [(ngModel)]="user.phone"
  pattern="[0-9]{11}"
  #phoneInput="ngModel">
```

### 2. 自定义验证器

```typescript
// custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// 密码强度验证器
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    return valid ? null : { passwordStrength: true };
  };
}

// 确认密码验证器
export function confirmPasswordValidator(passwordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;
    
    const password = control.parent.get(passwordField)?.value;
    const confirmPassword = control.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

// 用户名唯一性验证器（异步）
export function uniqueUsernameValidator(userService: any): ValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> => {
    if (!control.value) return Promise.resolve(null);
    
    return userService.checkUsernameExists(control.value).then((exists: boolean) => {
      return exists ? { usernameExists: true } : null;
    });
  };
}
```

### 3. 使用自定义验证器

```html
<!-- 密码输入 -->
<div class="form-group">
  <label for="password">密码：</label>
  <input 
    type="password" 
    id="password" 
    name="password" 
    [(ngModel)]="user.password"
    required
    minlength="8"
    [ngModelOptions]="{ updateOn: 'blur' }"
    #passwordInput="ngModel">
  
  <div *ngIf="passwordInput.invalid && passwordInput.touched" class="error-messages">
    <div *ngIf="passwordInput.errors?.['required']">密码是必填项</div>
    <div *ngIf="passwordInput.errors?.['minlength']">
      密码至少需要{{ passwordInput.errors?.['minlength'].requiredLength }}个字符
    </div>
    <div *ngIf="passwordInput.errors?.['passwordStrength']">
      密码必须包含大写字母、小写字母、数字和特殊字符
    </div>
  </div>
</div>

<!-- 确认密码 -->
<div class="form-group">
  <label for="confirmPassword">确认密码：</label>
  <input 
    type="password" 
    id="confirmPassword" 
    name="confirmPassword" 
    [(ngModel)]="user.confirmPassword"
    required
    [ngModelOptions]="{ updateOn: 'blur' }"
    #confirmPasswordInput="ngModel">
  
  <div *ngIf="confirmPasswordInput.invalid && confirmPasswordInput.touched" class="error-messages">
    <div *ngIf="confirmPasswordInput.errors?.['required']">请确认密码</div>
    <div *ngIf="confirmPasswordInput.errors?.['passwordMismatch']">两次输入的密码不一致</div>
  </div>
</div>
```

## 🎮 实践练习

### 练习1：创建用户注册表单

创建一个完整的用户注册表单，包含：

- 基本信息（姓名、邮箱、电话）
- 密码设置（密码、确认密码）
- 个人偏好（角色、兴趣爱好）
- 完整的验证和错误提示

### 练习2：创建动态表单

创建一个可以动态添加/删除字段的表单，支持：

- 动态添加联系信息
- 动态添加工作经历
- 表单验证和提交

## 📚 详细示例

### 完整的用户注册表单

```html
<!-- user-registration.component.html -->
<form #registrationForm="ngForm" (ngSubmit)="onSubmit(registrationForm)" class="registration-form">
  <h2>用户注册</h2>
  
  <!-- 基本信息 -->
  <fieldset class="form-section">
    <legend>基本信息</legend>
    
    <div class="form-row">
      <div class="form-group">
        <label for="firstName">名 *</label>
        <input 
          type="text" 
          id="firstName" 
          name="firstName" 
          [(ngModel)]="user.firstName"
          required
          minlength="2"
          maxlength="20"
          #firstNameInput="ngModel"
          class="form-control"
          [class.is-invalid]="firstNameInput.invalid && firstNameInput.touched">
        
        <div *ngIf="firstNameInput.invalid && firstNameInput.touched" class="invalid-feedback">
          <div *ngIf="firstNameInput.errors?.['required']">请输入您的名字</div>
          <div *ngIf="firstNameInput.errors?.['minlength']">
            名字至少需要{{ firstNameInput.errors?.['minlength'].requiredLength }}个字符
          </div>
          <div *ngIf="firstNameInput.errors?.['maxlength']">
            名字不能超过{{ firstNameInput.errors?.['maxlength'].requiredLength }}个字符
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="lastName">姓 *</label>
        <input 
          type="text" 
          id="lastName" 
          name="lastName" 
          [(ngModel)]="user.lastName"
          required
          minlength="2"
          maxlength="20"
          #lastNameInput="ngModel"
          class="form-control"
          [class.is-invalid]="lastNameInput.invalid && lastNameInput.touched">
        
        <div *ngIf="lastNameInput.invalid && lastNameInput.touched" class="invalid-feedback">
          <div *ngIf="lastNameInput.errors?.['required']">请输入您的姓氏</div>
          <div *ngIf="lastNameInput.errors?.['minlength']">
            姓氏至少需要{{ lastNameInput.errors?.['minlength'].requiredLength }}个字符
          </div>
          <div *ngIf="lastNameInput.errors?.['maxlength']">
            姓氏不能超过{{ lastNameInput.errors?.['maxlength'].requiredLength }}个字符
          </div>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label for="email">邮箱地址 *</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        [(ngModel)]="user.email"
        required
        email
        #emailInput="ngModel"
        class="form-control"
        [class.is-invalid]="emailInput.invalid && emailInput.touched">
      
      <div *ngIf="emailInput.invalid && emailInput.touched" class="invalid-feedback">
        <div *ngIf="emailInput.errors?.['required']">请输入邮箱地址</div>
        <div *ngIf="emailInput.errors?.['email']">请输入有效的邮箱地址</div>
      </div>
    </div>
    
    <div class="form-group">
      <label for="phone">手机号码</label>
      <input 
        type="tel" 
        id="phone" 
        name="phone" 
        [(ngModel)]="user.phone"
        pattern="[0-9]{11}"
        #phoneInput="ngModel"
        class="form-control"
        [class.is-invalid]="phoneInput.invalid && phoneInput.touched">
      
      <div *ngIf="phoneInput.invalid && phoneInput.touched" class="invalid-feedback">
        <div *ngIf="phoneInput.errors?.['pattern']">请输入11位手机号码</div>
      </div>
    </div>
  </fieldset>
  
  <!-- 账户信息 -->
  <fieldset class="form-section">
    <legend>账户信息</legend>
    
    <div class="form-group">
      <label for="username">用户名 *</label>
      <input 
        type="text" 
        id="username" 
        name="username" 
        [(ngModel)]="user.username"
        required
        minlength="3"
        maxlength="20"
        pattern="[a-zA-Z0-9_]+"
        #usernameInput="ngModel"
        class="form-control"
        [class.is-invalid]="usernameInput.invalid && usernameInput.touched">
      
      <div *ngIf="usernameInput.invalid && usernameInput.touched" class="invalid-feedback">
        <div *ngIf="usernameInput.errors?.['required']">请输入用户名</div>
        <div *ngIf="usernameInput.errors?.['minlength']">
          用户名至少需要{{ usernameInput.errors?.['minlength'].requiredLength }}个字符
        </div>
        <div *ngIf="usernameInput.errors?.['maxlength']">
          用户名不能超过{{ usernameInput.errors?.['maxlength'].requiredLength }}个字符
        </div>
        <div *ngIf="usernameInput.errors?.['pattern']">
          用户名只能包含字母、数字和下划线
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label for="password">密码 *</label>
      <input 
        type="password" 
        id="password" 
        name="password" 
        [(ngModel)]="user.password"
        required
        minlength="8"
        #passwordInput="ngModel"
        class="form-control"
        [class.is-invalid]="passwordInput.invalid && passwordInput.touched">
      
      <div *ngIf="passwordInput.invalid && passwordInput.touched" class="invalid-feedback">
        <div *ngIf="passwordInput.errors?.['required']">请输入密码</div>
        <div *ngIf="passwordInput.errors?.['minlength']">
          密码至少需要{{ passwordInput.errors?.['minlength'].requiredLength }}个字符
        </div>
      </div>
      
      <div class="password-requirements">
        <small>密码要求：</small>
        <ul>
          <li [class.valid]="hasUpperCase">至少包含一个大写字母</li>
          <li [class.valid]="hasLowerCase">至少包含一个小写字母</li>
          <li [class.valid]="hasNumber">至少包含一个数字</li>
          <li [class.valid]="hasSpecialChar">至少包含一个特殊字符</li>
        </ul>
      </div>
    </div>
    
    <div class="form-group">
      <label for="confirmPassword">确认密码 *</label>
      <input 
        type="password" 
        id="confirmPassword" 
        name="confirmPassword" 
        [(ngModel)]="user.confirmPassword"
        required
        #confirmPasswordInput="ngModel"
        class="form-control"
        [class.is-invalid]="confirmPasswordInput.invalid && confirmPasswordInput.touched">
      
      <div *ngIf="confirmPasswordInput.invalid && confirmPasswordInput.touched" class="invalid-feedback">
        <div *ngIf="confirmPasswordInput.errors?.['required']">请确认密码</div>
        <div *ngIf="confirmPasswordInput.errors?.['passwordMismatch']">两次输入的密码不一致</div>
      </div>
    </div>
  </fieldset>
  
  <!-- 个人偏好 -->
  <fieldset class="form-section">
    <legend>个人偏好</legend>
    
    <div class="form-group">
      <label>性别</label>
      <div class="radio-group">
        <label class="radio-label">
          <input 
            type="radio" 
            name="gender" 
            value="male" 
            [(ngModel)]="user.gender">
          <span>男</span>
        </label>
        <label class="radio-label">
          <input 
            type="radio" 
            name="gender" 
            value="female" 
            [(ngModel)]="user.gender">
          <span>女</span>
        </label>
        <label class="radio-label">
          <input 
            type="radio" 
            name="gender" 
            value="other" 
            [(ngModel)]="user.gender">
          <span>其他</span>
        </label>
      </div>
    </div>
    
    <div class="form-group">
      <label for="birthDate">出生日期</label>
      <input 
        type="date" 
        id="birthDate" 
        name="birthDate" 
        [(ngModel)]="user.birthDate"
        #birthDateInput="ngModel"
        class="form-control">
    </div>
    
    <div class="form-group">
      <label>兴趣爱好</label>
      <div class="checkbox-group">
        <label *ngFor="let interest of interests" class="checkbox-label">
          <input 
            type="checkbox" 
            [value]="interest.value"
            [checked]="isInterestSelected(interest.value)"
            (change)="onInterestChange(interest.value, $event.target.checked)">
          <span>{{ interest.label }}</span>
        </label>
      </div>
    </div>
    
    <div class="form-group">
      <label for="bio">个人简介</label>
      <textarea 
        id="bio" 
        name="bio" 
        [(ngModel)]="user.bio"
        rows="4"
        maxlength="500"
        placeholder="介绍一下自己..."
        class="form-control">
      </textarea>
      <div class="char-count">
        {{ user.bio?.length || 0 }}/500
      </div>
    </div>
  </fieldset>
  
  <!-- 服务条款 -->
  <div class="form-group">
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        name="agreeTerms" 
        [(ngModel)]="user.agreeTerms"
        required
        #agreeTermsInput="ngModel">
      <span>我同意 <a href="#" target="_blank">服务条款</a> 和 <a href="#" target="_blank">隐私政策</a></span>
    </label>
    
    <div *ngIf="agreeTermsInput.invalid && agreeTermsInput.touched" class="invalid-feedback">
      <div *ngIf="agreeTermsInput.errors?.['required']">请同意服务条款和隐私政策</div>
    </div>
  </div>
  
  <!-- 提交按钮 -->
  <div class="form-actions">
    <button 
      type="submit" 
      [disabled]="registrationForm.invalid || isSubmitting"
      class="btn btn-primary">
      <span *ngIf="isSubmitting" class="spinner"></span>
      {{ isSubmitting ? '注册中...' : '注册' }}
    </button>
    
    <button 
      type="button" 
      (click)="resetForm(registrationForm)"
      class="btn btn-secondary">
      重置
    </button>
  </div>
</form>
```

```typescript
// user-registration.component.ts
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  gender: string;
  birthDate: string;
  interests: string[];
  bio: string;
  agreeTerms: boolean;
}

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.css']
})
export class UserRegistrationComponent implements OnInit {
  user: User = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: '',
    birthDate: '',
    interests: [],
    bio: '',
    agreeTerms: false
  };
  
  interests = [
    { value: 'programming', label: '编程' },
    { value: 'reading', label: '阅读' },
    { value: 'sports', label: '运动' },
    { value: 'music', label: '音乐' },
    { value: 'travel', label: '旅行' },
    { value: 'photography', label: '摄影' },
    { value: 'cooking', label: '烹饪' },
    { value: 'gaming', label: '游戏' }
  ];
  
  isSubmitting = false;
  
  constructor() {}
  
  ngOnInit() {}
  
  onSubmit(form: NgForm) {
    if (form.valid) {
      this.isSubmitting = true;
      
      // 模拟API调用
      setTimeout(() => {
        console.log('注册用户:', this.user);
        this.isSubmitting = false;
        alert('注册成功！');
        this.resetForm(form);
      }, 2000);
    } else {
      this.markFormGroupTouched(form);
    }
  }
  
  resetForm(form: NgForm) {
    form.resetForm();
    this.user = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      gender: '',
      birthDate: '',
      interests: [],
      bio: '',
      agreeTerms: false
    };
  }
  
  onInterestChange(interest: string, isChecked: boolean) {
    if (isChecked) {
      this.user.interests.push(interest);
    } else {
      const index = this.user.interests.indexOf(interest);
      if (index > -1) {
        this.user.interests.splice(index, 1);
      }
    }
  }
  
  isInterestSelected(interest: string): boolean {
    return this.user.interests.includes(interest);
  }
  
  // 密码强度检查
  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.user.password);
  }
  
  get hasLowerCase(): boolean {
    return /[a-z]/.test(this.user.password);
  }
  
  get hasNumber(): boolean {
    return /[0-9]/.test(this.user.password);
  }
  
  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.user.password);
  }
  
  private markFormGroupTouched(form: NgForm) {
    Object.keys(form.controls).forEach(key => {
      const control = form.controls[key];
      control.markAsTouched();
    });
  }
}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 创建模板驱动表单
- [ ] 使用ngModel进行双向绑定
- [ ] 实现表单验证
- [ ] 处理表单提交
- [ ] 使用表单组
- [ ] 创建自定义验证器

## 🚀 下一步

完成本章节学习后，请继续学习[11-响应式表单](./../11-reactive-forms/README.md)。
