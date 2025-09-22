# 14 - 测试

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular测试基础
- 单元测试
- 集成测试
- 端到端测试
- 测试最佳实践
- 测试工具和技巧

## 🎯 核心概念

### 1. 测试金字塔

```
    /\
   /  \     E2E Tests (少量)
  /____\    
 /      \   Integration Tests (适量)
/________\  
/          \ Unit Tests (大量)
/____________\
```

### 2. 测试类型

- **单元测试**：测试单个组件、服务或函数
- **集成测试**：测试多个组件或服务之间的交互
- **端到端测试**：测试完整的用户流程

### 3. 测试工具

- **Jasmine**：测试框架
- **Karma**：测试运行器
- **Protractor**：E2E测试工具
- **Cypress**：现代E2E测试工具

## 🏗️ 测试环境配置

### 1. 基本配置

```typescript
// karma.conf.js
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Jasmine配置
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
```

### 2. 测试脚本

```json
// package.json
{
  "scripts": {
    "test": "ng test",
    "test:watch": "ng test --watch",
    "test:coverage": "ng test --code-coverage",
    "e2e": "ng e2e",
    "e2e:headless": "ng e2e --headless"
  }
}
```

## 🔧 单元测试

### 1. 组件测试

```typescript
// user-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';
import { User } from '../models/user';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user information', () => {
    const user: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    };

    component.user = user;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h3').textContent).toContain('John Doe');
    expect(compiled.querySelector('.email').textContent).toContain('john@example.com');
  });

  it('should emit edit event when edit button is clicked', () => {
    const user: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    };

    component.user = user;
    fixture.detectChanges();

    spyOn(component.edit, 'emit');
    
    const editButton = fixture.nativeElement.querySelector('.btn-edit');
    editButton.click();

    expect(component.edit.emit).toHaveBeenCalledWith(user);
  });

  it('should not show actions when showActions is false', () => {
    component.showActions = false;
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelector('.actions');
    expect(actions).toBeFalsy();
  });
});
```

### 2. 服务测试

```typescript
// user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User } from '../models/user';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get users', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' }
    ];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should create user', () => {
    const newUser: Partial<User> = {
      name: 'New User',
      email: 'new@example.com',
      role: 'user'
    };

    const createdUser: User = {
      id: 3,
      ...newUser
    } as User;

    service.createUser(newUser).subscribe(user => {
      expect(user).toEqual(createdUser);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(createdUser);
  });

  it('should handle error when getting users fails', () => {
    service.getUsers().subscribe(
      () => fail('should have failed'),
      error => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne('/api/users');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
```

### 3. 管道测试

```typescript
// capitalize.pipe.spec.ts
import { CapitalizePipe } from './capitalize.pipe';

describe('CapitalizePipe', () => {
  let pipe: CapitalizePipe;

  beforeEach(() => {
    pipe = new CapitalizePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should capitalize first letter', () => {
    expect(pipe.transform('hello')).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should handle already capitalized string', () => {
    expect(pipe.transform('Hello')).toBe('Hello');
  });
});
```

## 🔗 集成测试

### 1. 组件集成测试

```typescript
// user-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from './user.service';
import { of } from 'rxjs';

describe('UserListComponent Integration', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['getUsers', 'deleteUser']);

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should load users on init', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' }
    ];

    userService.getUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
  });

  it('should delete user and reload list', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' }
    ];

    userService.getUsers.and.returnValue(of(mockUsers));
    userService.deleteUser.and.returnValue(of(null));

    component.ngOnInit();
    component.deleteUser(1);

    expect(userService.deleteUser).toHaveBeenCalledWith(1);
    expect(userService.getUsers).toHaveBeenCalledTimes(2);
  });
});
```

### 2. 路由测试

```typescript
// app-routing.module.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

describe('AppRoutingModule', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule, RouterTestingModule]
    });
    router = TestBed.inject(Router);
  });

  it('should navigate to home', async () => {
    await router.navigate(['/']);
    expect(router.url).toBe('/home');
  });

  it('should navigate to about', async () => {
    await router.navigate(['/about']);
    expect(router.url).toBe('/about');
  });

  it('should navigate to user detail with id', async () => {
    await router.navigate(['/user', '123']);
    expect(router.url).toBe('/user/123');
  });
});
```

## 🎯 端到端测试

### 1. Cypress配置

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true
  }
});
```

### 2. E2E测试示例

```typescript
// user-management.cy.ts
describe('User Management', () => {
  beforeEach(() => {
    cy.visit('/users');
  });

  it('should display user list', () => {
    cy.get('[data-cy=user-list]').should('be.visible');
    cy.get('[data-cy=user-card]').should('have.length.greaterThan', 0);
  });

  it('should create new user', () => {
    cy.get('[data-cy=create-user-btn]').click();
    
    cy.get('[data-cy=user-form]').should('be.visible');
    
    cy.get('[data-cy=name-input]').type('New User');
    cy.get('[data-cy=email-input]').type('newuser@example.com');
    cy.get('[data-cy=role-select]').select('user');
    
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=user-card]').should('contain', 'New User');
  });

  it('should edit user', () => {
    cy.get('[data-cy=user-card]').first().find('[data-cy=edit-btn]').click();
    
    cy.get('[data-cy=name-input]').clear().type('Updated Name');
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=user-card]').first().should('contain', 'Updated Name');
  });

  it('should delete user', () => {
    cy.get('[data-cy=user-card]').first().find('[data-cy=delete-btn]').click();
    
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
  });

  it('should search users', () => {
    cy.get('[data-cy=search-input]').type('John');
    cy.get('[data-cy=search-btn]').click();
    
    cy.get('[data-cy=user-card]').should('contain', 'John');
  });
});
```

## 🛠️ 测试工具和技巧

### 1. 测试辅助函数

```typescript
// test-utils.ts
import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

export class TestUtils {
  static clickElement(fixture: ComponentFixture<any>, selector: string): void {
    const element = fixture.debugElement.query(By.css(selector));
    element.triggerEventHandler('click', null);
    fixture.detectChanges();
  }

  static setInputValue(fixture: ComponentFixture<any>, selector: string, value: string): void {
    const input = fixture.debugElement.query(By.css(selector));
    input.nativeElement.value = value;
    input.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  static getElementText(fixture: ComponentFixture<any>, selector: string): string {
    const element = fixture.debugElement.query(By.css(selector));
    return element.nativeElement.textContent.trim();
  }

  static hasClass(fixture: ComponentFixture<any>, selector: string, className: string): boolean {
    const element = fixture.debugElement.query(By.css(selector));
    return element.nativeElement.classList.contains(className);
  }
}
```

### 2. 模拟数据工厂

```typescript
// test-data-factory.ts
import { User } from '../models/user';

export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      ...overrides
    };
  }

  static createUsers(count: number): User[] {
    return Array.from({ length: count }, (_, index) => 
      this.createUser({
        id: index + 1,
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`
      })
    );
  }
}
```

### 3. 异步测试

```typescript
// async-testing.spec.ts
import { fakeAsync, tick } from '@angular/core/testing';

describe('Async Testing', () => {
  it('should handle async operations with fakeAsync', fakeAsync(() => {
    let value = 0;
    
    setTimeout(() => {
      value = 1;
    }, 1000);
    
    expect(value).toBe(0);
    
    tick(1000);
    
    expect(value).toBe(1);
  }));

  it('should handle promises', async () => {
    const promise = Promise.resolve('test');
    
    const result = await promise;
    
    expect(result).toBe('test');
  });

  it('should handle observables', (done) => {
    const observable = of('test');
    
    observable.subscribe(value => {
      expect(value).toBe('test');
      done();
    });
  });
});
```

## 📊 测试覆盖率

### 1. 覆盖率配置

```typescript
// angular.json
{
  "test": {
    "builder": "@angular-devkit/build-angular:karma",
    "options": {
      "codeCoverage": true,
      "codeCoverageExclude": [
        "src/**/*.spec.ts",
        "src/**/*.module.ts",
        "src/main.ts",
        "src/polyfills.ts"
      ]
    }
  }
}
```

### 2. 覆盖率报告

```bash
# 生成覆盖率报告
ng test --code-coverage

# 查看覆盖率报告
open coverage/index.html
```

## 🎮 实践练习

### 练习1：为现有组件编写测试

为之前创建的用户卡片组件编写完整的测试套件，包括：

- 组件创建测试
- 属性绑定测试
- 事件发射测试
- 条件渲染测试

### 练习2：编写服务测试

为用户服务编写测试，包括：

- HTTP请求测试
- 错误处理测试
- 数据转换测试
- 缓存功能测试

## 📚 测试最佳实践

### 1. 测试命名

```typescript
// 好的测试命名
describe('UserService', () => {
  describe('getUsers', () => {
    it('should return users when API call succeeds', () => {
      // 测试实现
    });

    it('should return empty array when API call fails', () => {
      // 测试实现
    });
  });
});

// 避免的测试命名
describe('UserService', () => {
  it('should work', () => {
    // 测试实现
  });
});
```

### 2. 测试结构

```typescript
// AAA模式：Arrange, Act, Assert
it('should calculate total price correctly', () => {
  // Arrange - 准备测试数据
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];

  // Act - 执行被测试的操作
  const total = calculateTotal(items);

  // Assert - 验证结果
  expect(total).toBe(35);
});
```

### 3. 测试隔离

```typescript
describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;

  beforeEach(() => {
    // 每个测试前重新创建组件
    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // 清理工作
    fixture.destroy();
  });
});
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 编写端到端测试
- [ ] 使用测试工具和技巧
- [ ] 理解测试最佳实践
- [ ] 生成和分析测试覆盖率

## 🚀 下一步

完成本章节学习后，请继续学习[15-性能优化](./../15-performance/README.md)。
