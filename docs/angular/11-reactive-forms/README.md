# 11 - 响应式表单

## 📖 学习目标

通过本章节学习，您将掌握：

- 响应式表单基础
- FormBuilder的使用
- FormGroup和FormControl
- 表单验证
- 自定义验证器
- 表单状态管理
- 复杂表单处理

## 🎯 核心概念

### 1. 响应式表单优势

- **类型安全**：编译时类型检查
- **可测试性**：易于单元测试
- **可预测性**：状态变化可追踪
- **灵活性**：支持复杂表单逻辑
- **性能**：按需更新，性能更好

### 2. 表单结构

```
FormGroup
├── FormControl (单个字段)
├── FormArray (数组字段)
└── FormGroup (嵌套组)
```

### 3. 验证器类型

- **同步验证器**：立即返回验证结果
- **异步验证器**：返回Promise或Observable
- **内置验证器**：required, email, min, max等
- **自定义验证器**：业务逻辑验证

## 🔧 基础响应式表单

### 1. 启用ReactiveFormsModule

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule // 导入ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. 基本表单创建

```typescript
// user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;

  constructor() {
    this.userForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      age: new FormControl('', [Validators.required, Validators.min(18), Validators.max(100)]),
      phone: new FormControl('', [Validators.pattern(/^[0-9]{11}$/)]),
      address: new FormGroup({
        street: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
        zipCode: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)])
      })
    });
  }

  ngOnInit() {
    // 监听表单值变化
    this.userForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
    });

    // 监听表单状态变化
    this.userForm.statusChanges.subscribe(status => {
      console.log('Form status:', status);
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form submitted:', this.userForm.value);
      // 处理表单提交
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
```

### 3. 表单模板

```html
<!-- user-form.component.html -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <div class="form-group">
    <label for="name">姓名：</label>
    <input 
      id="name"
      type="text" 
      formControlName="name"
      class="form-control"
      [class.is-invalid]="userForm.get('name')?.invalid && userForm.get('name')?.touched">
    
    <div *ngIf="userForm.get('name')?.invalid && userForm.get('name')?.touched" 
         class="invalid-feedback">
      <div *ngIf="userForm.get('name')?.errors?.['required']">姓名是必填项</div>
      <div *ngIf="userForm.get('name')?.errors?.['minlength']">
        姓名至少需要{{ userForm.get('name')?.errors?.['minlength'].requiredLength }}个字符
      </div>
    </div>
  </div>

  <div class="form-group">
    <label for="email">邮箱：</label>
    <input 
      id="email"
      type="email" 
      formControlName="email"
      class="form-control"
      [class.is-invalid]="userForm.get('email')?.invalid && userForm.get('email')?.touched">
    
    <div *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched" 
         class="invalid-feedback">
      <div *ngIf="userForm.get('email')?.errors?.['required']">邮箱是必填项</div>
      <div *ngIf="userForm.get('email')?.errors?.['email']">请输入有效的邮箱地址</div>
    </div>
  </div>

  <div class="form-group">
    <label for="age">年龄：</label>
    <input 
      id="age"
      type="number" 
      formControlName="age"
      class="form-control"
      [class.is-invalid]="userForm.get('age')?.invalid && userForm.get('age')?.touched">
    
    <div *ngIf="userForm.get('age')?.invalid && userForm.get('age')?.touched" 
         class="invalid-feedback">
      <div *ngIf="userForm.get('age')?.errors?.['required']">年龄是必填项</div>
      <div *ngIf="userForm.get('age')?.errors?.['min']">年龄不能小于18岁</div>
      <div *ngIf="userForm.get('age')?.errors?.['max']">年龄不能大于100岁</div>
    </div>
  </div>

  <!-- 嵌套表单组 -->
  <div formGroupName="address">
    <h3>地址信息</h3>
    
    <div class="form-group">
      <label for="street">街道：</label>
      <input 
        id="street"
        type="text" 
        formControlName="street"
        class="form-control"
        [class.is-invalid]="userForm.get('address.street')?.invalid && userForm.get('address.street')?.touched">
      
      <div *ngIf="userForm.get('address.street')?.invalid && userForm.get('address.street')?.touched" 
           class="invalid-feedback">
        街道是必填项
      </div>
    </div>

    <div class="form-group">
      <label for="city">城市：</label>
      <input 
        id="city"
        type="text" 
        formControlName="city"
        class="form-control"
        [class.is-invalid]="userForm.get('address.city')?.invalid && userForm.get('address.city')?.touched">
      
      <div *ngIf="userForm.get('address.city')?.invalid && userForm.get('address.city')?.touched" 
           class="invalid-feedback">
        城市是必填项
      </div>
    </div>

    <div class="form-group">
      <label for="zipCode">邮编：</label>
      <input 
        id="zipCode"
        type="text" 
        formControlName="zipCode"
        class="form-control"
        [class.is-invalid]="userForm.get('address.zipCode')?.invalid && userForm.get('address.zipCode')?.touched">
      
      <div *ngIf="userForm.get('address.zipCode')?.invalid && userForm.get('address.zipCode')?.touched" 
           class="invalid-feedback">
        请输入6位数字邮编
      </div>
    </div>
  </div>

  <button type="submit" [disabled]="userForm.invalid" class="btn btn-primary">
    提交
  </button>
</form>
```

## 🏗️ FormBuilder

### 1. 使用FormBuilder

```typescript
// user-form-builder.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form-builder',
  templateUrl: './user-form-builder.component.html'
})
export class UserFormBuilderComponent implements OnInit {
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      // 基本信息
      personalInfo: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.pattern(/^[0-9]{11}$/)]],
        birthDate: ['', Validators.required]
      }),

      // 地址信息
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
        country: ['', Validators.required]
      }),

      // 账户信息
      account: this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator }),

      // 偏好设置
      preferences: this.fb.group({
        newsletter: [false],
        notifications: [true],
        theme: ['light', Validators.required],
        language: ['zh', Validators.required]
      })
    });
  }

  ngOnInit() {
    // 监听表单变化
    this.userForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
    });

    // 监听特定字段变化
    this.userForm.get('personalInfo.firstName')?.valueChanges.subscribe(value => {
      console.log('First name changed:', value);
    });
  }

  // 密码匹配验证器
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form submitted:', this.userForm.value);
      // 处理表单提交
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  resetForm() {
    this.userForm.reset();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
```

## 🔄 FormArray

### 1. 动态表单数组

```typescript
// dynamic-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html'
})
export class DynamicFormComponent implements OnInit {
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // 动态技能数组
      skills: this.fb.array([]),
      // 动态工作经历数组
      workExperience: this.fb.array([])
    });
  }

  ngOnInit() {
    // 添加初始技能
    this.addSkill();
    // 添加初始工作经历
    this.addWorkExperience();
  }

  // 获取技能FormArray
  get skillsArray(): FormArray {
    return this.userForm.get('skills') as FormArray;
  }

  // 获取工作经历FormArray
  get workExperienceArray(): FormArray {
    return this.userForm.get('workExperience') as FormArray;
  }

  // 添加技能
  addSkill() {
    const skillGroup = this.fb.group({
      name: ['', Validators.required],
      level: ['beginner', Validators.required],
      years: [0, [Validators.min(0), Validators.max(50)]]
    });

    this.skillsArray.push(skillGroup);
  }

  // 删除技能
  removeSkill(index: number) {
    this.skillsArray.removeAt(index);
  }

  // 添加工作经历
  addWorkExperience() {
    const workExpGroup = this.fb.group({
      company: ['', Validators.required],
      position: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      current: [false],
      description: ['', Validators.maxLength(500)]
    });

    // 监听当前工作状态变化
    workExpGroup.get('current')?.valueChanges.subscribe(isCurrent => {
      const endDateControl = workExpGroup.get('endDate');
      if (isCurrent) {
        endDateControl?.clearValidators();
        endDateControl?.setValue('');
      } else {
        endDateControl?.setValidators(Validators.required);
      }
      endDateControl?.updateValueAndValidity();
    });

    this.workExperienceArray.push(workExpGroup);
  }

  // 删除工作经历
  removeWorkExperience(index: number) {
    this.workExperienceArray.removeAt(index);
  }

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form submitted:', this.userForm.value);
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }
}
```

### 2. FormArray模板

```html
<!-- dynamic-form.component.html -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <div class="form-group">
    <label for="name">姓名：</label>
    <input id="name" type="text" formControlName="name" class="form-control">
  </div>

  <div class="form-group">
    <label for="email">邮箱：</label>
    <input id="email" type="email" formControlName="email" class="form-control">
  </div>

  <!-- 技能数组 -->
  <div class="form-section">
    <h3>技能</h3>
    <div formArrayName="skills">
      <div *ngFor="let skill of skillsArray.controls; let i = index" 
           [formGroupName]="i" 
           class="skill-item">
        <div class="form-row">
          <div class="form-group">
            <label>技能名称：</label>
            <input formControlName="name" class="form-control" placeholder="技能名称">
          </div>
          <div class="form-group">
            <label>熟练程度：</label>
            <select formControlName="level" class="form-control">
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
              <option value="expert">专家</option>
            </select>
          </div>
          <div class="form-group">
            <label>使用年限：</label>
            <input formControlName="years" type="number" class="form-control" min="0" max="50">
          </div>
          <div class="form-group">
            <button type="button" (click)="removeSkill(i)" class="btn btn-danger">删除</button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" (click)="addSkill()" class="btn btn-secondary">添加技能</button>
  </div>

  <!-- 工作经历数组 -->
  <div class="form-section">
    <h3>工作经历</h3>
    <div formArrayName="workExperience">
      <div *ngFor="let work of workExperienceArray.controls; let i = index" 
           [formGroupName]="i" 
           class="work-item">
        <div class="form-group">
          <label>公司名称：</label>
          <input formControlName="company" class="form-control" placeholder="公司名称">
        </div>
        <div class="form-group">
          <label>职位：</label>
          <input formControlName="position" class="form-control" placeholder="职位">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>开始日期：</label>
            <input formControlName="startDate" type="date" class="form-control">
          </div>
          <div class="form-group">
            <label>结束日期：</label>
            <input formControlName="endDate" type="date" class="form-control">
          </div>
          <div class="form-group">
            <label>
              <input formControlName="current" type="checkbox"> 当前工作
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>工作描述：</label>
          <textarea formControlName="description" class="form-control" rows="3" 
                    placeholder="工作描述"></textarea>
        </div>
        <button type="button" (click)="removeWorkExperience(i)" class="btn btn-danger">删除</button>
      </div>
    </div>
    <button type="button" (click)="addWorkExperience()" class="btn btn-secondary">添加工作经历</button>
  </div>

  <button type="submit" [disabled]="userForm.invalid" class="btn btn-primary">提交</button>
</form>
```

## 🎯 自定义验证器

### 1. 同步验证器

```typescript
// validators/custom.validators.ts
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

// 年龄验证器
export function ageValidator(minAge: number, maxAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const age = new Date().getFullYear() - new Date(value).getFullYear();
    if (age < minAge || age > maxAge) {
      return { ageRange: { min: minAge, max: maxAge, actual: age } };
    }
    return null;
  };
}

// 用户名验证器
export function usernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const valid = /^[a-zA-Z0-9_]{3,20}$/.test(value);
    return valid ? null : { usernameFormat: true };
  };
}
```

### 2. 异步验证器

```typescript
// validators/async.validators.ts
import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AsyncValidators {
  constructor(private userService: UserService) {}

  // 用户名唯一性验证
  usernameUniqueValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.userService.checkUsernameExists(control.value).pipe(
        map(exists => exists ? { usernameExists: true } : null),
        catchError(() => of(null))
      );
    };
  }

  // 邮箱唯一性验证
  emailUniqueValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.userService.checkEmailExists(control.value).pipe(
        map(exists => exists ? { emailExists: true } : null),
        catchError(() => of(null))
      );
    };
  }
}
```

### 3. 使用自定义验证器

```typescript
// 在组件中使用
import { passwordStrengthValidator, ageValidator } from '../validators/custom.validators';
import { AsyncValidators } from '../validators/async.validators';

export class UserFormComponent {
  constructor(
    private fb: FormBuilder,
    private asyncValidators: AsyncValidators
  ) {
    this.userForm = this.fb.group({
      username: ['', 
        [Validators.required, Validators.minLength(3)],
        [this.asyncValidators.usernameUniqueValidator()]
      ],
      email: ['', 
        [Validators.required, Validators.email],
        [this.asyncValidators.emailUniqueValidator()]
      ],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        passwordStrengthValidator()
      ]],
      birthDate: ['', [
        Validators.required,
        ageValidator(18, 100)
      ]]
    });
  }
}
```

## 🎮 实践练习

### 练习1：创建用户注册表单

创建一个完整的用户注册表单，包含：

- 基本信息（姓名、邮箱、密码）
- 地址信息（可添加多个地址）
- 工作经历（动态添加/删除）
- 技能标签（动态管理）
- 完整的验证和错误处理

### 练习2：实现动态问卷系统

创建一个动态问卷系统，支持：

- 动态添加/删除问题
- 多种问题类型（单选、多选、文本、评分）
- 条件显示问题
- 表单验证和提交

## 📚 详细示例

### 完整的用户注册表单

```typescript
// user-registration.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { passwordStrengthValidator } from '../validators/custom.validators';
import { AsyncValidators } from '../validators/async.validators';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.css']
})
export class UserRegistrationComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private asyncValidators: AsyncValidators
  ) {
    this.userForm = this.fb.group({
      // 基本信息
      personalInfo: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', 
          [Validators.required, Validators.email],
          [this.asyncValidators.emailUniqueValidator()]
        ],
        phone: ['', [Validators.pattern(/^1[3-9]\d{9}$/)]],
        birthDate: ['', Validators.required]
      }),

      // 账户信息
      account: this.fb.group({
        username: ['', 
          [Validators.required, Validators.minLength(3)],
          [this.asyncValidators.usernameUniqueValidator()]
        ],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          passwordStrengthValidator()
        ]],
        confirmPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator }),

      // 地址信息
      addresses: this.fb.array([]),

      // 工作经历
      workExperience: this.fb.array([]),

      // 技能
      skills: this.fb.array([]),

      // 偏好设置
      preferences: this.fb.group({
        newsletter: [false],
        notifications: [true],
        theme: ['light', Validators.required],
        language: ['zh', Validators.required]
      }),

      // 服务条款
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    // 添加初始地址
    this.addAddress();
    // 添加初始工作经历
    this.addWorkExperience();
    // 添加初始技能
    this.addSkill();
  }

  // 获取FormArray
  get addressesArray(): FormArray {
    return this.userForm.get('addresses') as FormArray;
  }

  get workExperienceArray(): FormArray {
    return this.userForm.get('workExperience') as FormArray;
  }

  get skillsArray(): FormArray {
    return this.userForm.get('skills') as FormArray;
  }

  // 密码匹配验证器
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // 地址管理
  addAddress() {
    const addressGroup = this.fb.group({
      type: ['home', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      country: ['', Validators.required],
      isDefault: [false]
    });

    // 监听默认地址变化
    addressGroup.get('isDefault')?.valueChanges.subscribe(isDefault => {
      if (isDefault) {
        this.addressesArray.controls.forEach(control => {
          if (control !== addressGroup) {
            control.get('isDefault')?.setValue(false);
          }
        });
      }
    });

    this.addressesArray.push(addressGroup);
  }

  removeAddress(index: number) {
    this.addressesArray.removeAt(index);
  }

  // 工作经历管理
  addWorkExperience() {
    const workExpGroup = this.fb.group({
      company: ['', Validators.required],
      position: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      current: [false],
      description: ['', Validators.maxLength(500)]
    });

    // 监听当前工作状态变化
    workExpGroup.get('current')?.valueChanges.subscribe(isCurrent => {
      const endDateControl = workExpGroup.get('endDate');
      if (isCurrent) {
        endDateControl?.clearValidators();
        endDateControl?.setValue('');
      } else {
        endDateControl?.setValidators(Validators.required);
      }
      endDateControl?.updateValueAndValidity();
    });

    this.workExperienceArray.push(workExpGroup);
  }

  removeWorkExperience(index: number) {
    this.workExperienceArray.removeAt(index);
  }

  // 技能管理
  addSkill() {
    const skillGroup = this.fb.group({
      name: ['', Validators.required],
      level: ['beginner', Validators.required],
      years: [0, [Validators.min(0), Validators.max(50)]]
    });

    this.skillsArray.push(skillGroup);
  }

  removeSkill(index: number) {
    this.skillsArray.removeAt(index);
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      
      // 模拟API调用
      setTimeout(() => {
        console.log('Form submitted:', this.userForm.value);
        this.isSubmitting = false;
        alert('注册成功！');
        this.resetForm();
      }, 2000);
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  resetForm() {
    this.userForm.reset();
    // 重新添加初始项
    this.addressesArray.clear();
    this.workExperienceArray.clear();
    this.skillsArray.clear();
    this.addAddress();
    this.addWorkExperience();
    this.addSkill();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }
}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用ReactiveFormsModule创建表单
- [ ] 使用FormBuilder构建复杂表单
- [ ] 使用FormGroup和FormControl
- [ ] 使用FormArray管理动态字段
- [ ] 创建自定义验证器
- [ ] 处理表单状态和验证
- [ ] 实现复杂的表单逻辑

## 🚀 下一步

完成本章节学习后，请继续学习[12-状态管理](./../12-state-management/README.md)。
