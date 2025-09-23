# 17 - 响应式表单高级功能

## 📖 学习目标

通过本章节学习，您将掌握：

- 响应式表单的高级用法
- 自定义验证器
- 异步验证
- 动态表单
- FormArray和FormGroup
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

## 🔧 高级FormBuilder用法

### 1. 复杂表单结构

```typescript
// user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
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

      // 账户设置
      account: this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator })
    });
  }

  ngOnInit() {
    // 添加初始工作经历
    this.addWorkExperience();
    
    // 添加初始技能
    this.addSkill();

    // 监听表单变化
    this.userForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
    });

    // 监听表单状态变化
    this.userForm.statusChanges.subscribe(status => {
      console.log('Form status:', status);
    });
  }

  // 获取FormArray
  get workExperienceArray(): FormArray {
    return this.userForm.get('workExperience') as FormArray;
  }

  get skillsArray(): FormArray {
    return this.userForm.get('skills') as FormArray;
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

  // 提交表单
  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form submitted:', this.userForm.value);
      // 处理表单提交
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  // 重置表单
  resetForm() {
    this.userForm.reset();
    // 重新添加初始项
    this.workExperienceArray.clear();
    this.skillsArray.clear();
    this.addWorkExperience();
    this.addSkill();
  }

  // 标记所有字段为已触摸
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

// 文件类型验证器
export function fileTypeValidator(allowedTypes: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;
    if (!file) return null;

    const fileType = file.type;
    if (!allowedTypes.includes(fileType)) {
      return { fileType: { allowed: allowedTypes, actual: fileType } };
    }
    return null;
  };
}

// 文件大小验证器
export function fileSizeValidator(maxSize: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;
    if (!file) return null;

    if (file.size > maxSize) {
      return { fileSize: { max: maxSize, actual: file.size } };
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

// 手机号验证器
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const valid = /^1[3-9]\d{9}$/.test(value);
    return valid ? null : { phoneFormat: true };
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

  // 身份证号验证
  idCardValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.userService.validateIdCard(control.value).pipe(
        map(valid => valid ? null : { idCardInvalid: true }),
        catchError(() => of({ idCardInvalid: true }))
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

## 🔄 动态表单

### 1. 动态表单组件

```typescript
// dynamic-form.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: { value: any; label: string }[];
  validators?: any[];
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

@Component({
  selector: 'app-dynamic-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div *ngFor="let section of sections" class="form-section">
        <h3>{{ section.title }}</h3>
        
        <div *ngFor="let field of section.fields" class="form-group">
          <label [for]="field.key">{{ field.label }}</label>
          
          <!-- 文本输入 -->
          <input 
            *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'number'"
            [id]="field.key"
            [type]="field.type"
            [formControlName]="field.key"
            class="form-control">
          
          <!-- 选择框 -->
          <select 
            *ngIf="field.type === 'select'"
            [id]="field.key"
            [formControlName]="field.key"
            class="form-control">
            <option value="">请选择</option>
            <option *ngFor="let option of field.options" [value]="option.value">
              {{ option.label }}
            </option>
          </select>
          
          <!-- 复选框 -->
          <input 
            *ngIf="field.type === 'checkbox'"
            [id]="field.key"
            type="checkbox"
            [formControlName]="field.key">
          
          <!-- 文本域 -->
          <textarea 
            *ngIf="field.type === 'textarea'"
            [id]="field.key"
            [formControlName]="field.key"
            class="form-control"
            rows="4">
          </textarea>
          
          <!-- 错误信息 -->
          <div *ngIf="getFieldError(field.key)" class="error-message">
            {{ getFieldError(field.key) }}
          </div>
        </div>
      </div>
      
      <button type="submit" [disabled]="form.invalid" class="btn btn-primary">
        提交
      </button>
    </form>
  `
})
export class DynamicFormComponent implements OnInit {
  @Input() sections: FormSection[] = [];
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    const formControls: { [key: string]: any } = {};
    
    this.sections.forEach(section => {
      section.fields.forEach(field => {
        formControls[field.key] = [
          { value: '', disabled: false },
          field.validators || []
        ];
      });
    });
    
    this.form = this.fb.group(formControls);
  }

  getFieldError(fieldKey: string): string {
    const control = this.form.get(fieldKey);
    if (control && control.errors && control.touched) {
      const errors = control.errors;
      
      if (errors['required']) return '此字段为必填项';
      if (errors['email']) return '请输入有效的邮箱地址';
      if (errors['minlength']) return `最少需要${errors['minlength'].requiredLength}个字符`;
      if (errors['maxlength']) return `最多允许${errors['maxlength'].requiredLength}个字符`;
      if (errors['pattern']) return '格式不正确';
      if (errors['min']) return `最小值为${errors['min'].min}`;
      if (errors['max']) return `最大值为${errors['max'].max}`;
      
      return '输入有误';
    }
    return '';
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
```

### 2. 使用动态表单

```typescript
// 在父组件中使用
export class ParentComponent {
  formSections: FormSection[] = [
    {
      title: '基本信息',
      fields: [
        {
          key: 'firstName',
          label: '名',
          type: 'text',
          required: true,
          validators: [Validators.required, Validators.minLength(2)]
        },
        {
          key: 'lastName',
          label: '姓',
          type: 'text',
          required: true,
          validators: [Validators.required, Validators.minLength(2)]
        },
        {
          key: 'email',
          label: '邮箱',
          type: 'email',
          required: true,
          validators: [Validators.required, Validators.email]
        },
        {
          key: 'age',
          label: '年龄',
          type: 'number',
          required: true,
          validators: [Validators.required, Validators.min(18), Validators.max(100)]
        }
      ]
    },
    {
      title: '偏好设置',
      fields: [
        {
          key: 'theme',
          label: '主题',
          type: 'select',
          required: true,
          options: [
            { value: 'light', label: '浅色主题' },
            { value: 'dark', label: '深色主题' }
          ]
        },
        {
          key: 'newsletter',
          label: '订阅新闻',
          type: 'checkbox',
          required: false
        }
      ]
    }
  ];
}
```

## 🎮 实践练习

### 练习1：创建复杂的用户注册表单

创建一个包含以下功能的用户注册表单：

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

### 完整的动态表单系统

```typescript
// dynamic-form-builder.service.ts
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  validators?: any[];
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'notEquals' | 'contains';
  };
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  sections?: {
    title: string;
    fields: string[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DynamicFormBuilderService {
  constructor(private fb: FormBuilder) {}

  buildForm(config: FormConfig): FormGroup {
    const formControls: { [key: string]: any } = {};
    
    config.fields.forEach(field => {
      formControls[field.id] = [
        { value: field.defaultValue || '', disabled: false },
        this.buildValidators(field.validators || [])
      ];
    });
    
    const form = this.fb.group(formControls);
    
    // 设置条件显示
    this.setupConditionalFields(form, config.fields);
    
    return form;
  }

  private buildValidators(validators: any[]): any[] {
    return validators.map(validator => {
      if (typeof validator === 'string') {
        switch (validator) {
          case 'required':
            return Validators.required;
          case 'email':
            return Validators.email;
          default:
            return Validators.required;
        }
      }
      return validator;
    });
  }

  private setupConditionalFields(form: FormGroup, fields: FormFieldConfig[]) {
    fields.forEach(field => {
      if (field.conditional) {
        const { field: targetField, value, operator } = field.conditional;
        const targetControl = form.get(targetField);
        const currentControl = form.get(field.id);
        
        if (targetControl && currentControl) {
          targetControl.valueChanges.subscribe(targetValue => {
            const shouldShow = this.evaluateCondition(targetValue, value, operator);
            
            if (shouldShow) {
              currentControl.enable();
            } else {
              currentControl.disable();
              currentControl.setValue('');
            }
          });
        }
      }
    });
  }

  private evaluateCondition(targetValue: any, expectedValue: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return targetValue === expectedValue;
      case 'notEquals':
        return targetValue !== expectedValue;
      case 'contains':
        return targetValue && targetValue.includes(expectedValue);
      default:
        return true;
    }
  }
}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用FormBuilder创建复杂表单
- [ ] 创建自定义同步验证器
- [ ] 创建自定义异步验证器
- [ ] 实现动态表单
- [ ] 使用FormArray管理数组字段
- [ ] 处理表单状态和验证
- [ ] 实现条件显示逻辑

## 🚀 下一步

完成本章节学习后，请继续学习[18-路由高级功能](./../18-advanced-routing/README.md)。
