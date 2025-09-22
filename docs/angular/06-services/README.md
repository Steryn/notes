# 06 - 服务与依赖注入

## 📖 学习目标

通过本章节学习，您将掌握：

- 服务的概念和作用
- 依赖注入系统
- 创建和使用服务
- 服务的作用域
- 服务间通信
- 高级服务模式

## 🎯 核心概念

### 1. 什么是服务？

服务是Angular中用于封装业务逻辑、数据访问和共享功能的类。服务的主要特点：

- **单一职责**：每个服务专注于特定功能
- **可重用性**：可在多个组件中使用
- **可测试性**：易于单元测试
- **依赖注入**：通过DI系统管理依赖

### 2. 依赖注入系统

Angular的依赖注入系统负责：

- 创建服务实例
- 管理服务生命周期
- 解析依赖关系
- 提供服务实例

### 3. 服务作用域

```
应用级别 (Application Level)
├── 根注入器 (Root Injector)
│   └── 单例服务
├── 模块级别 (Module Level)
│   └── 模块内共享服务
└── 组件级别 (Component Level)
    └── 组件实例服务
```

## 🏗️ 创建服务

### 1. 使用CLI创建服务

```bash
# 创建服务
ng generate service user
# 或简写
ng g s user

# 创建服务并指定路径
ng g s services/user

# 创建服务并注册为提供者
ng g s user --skip-tests
```

### 2. 基本服务结构

```typescript
// user.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // 根级别提供
})
export class UserService {
  private users: User[] = [];
  
  constructor() { }
  
  // 获取所有用户
  getUsers(): User[] {
    return this.users;
  }
  
  // 添加用户
  addUser(user: User): void {
    this.users.push(user);
  }
  
  // 根据ID获取用户
  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  // 更新用户
  updateUser(id: number, updatedUser: Partial<User>): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updatedUser };
      return true;
    }
    return false;
  }
  
  // 删除用户
  deleteUser(id: number): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}
```

## 🔧 依赖注入详解

### 1. 构造函数注入

```typescript
// 组件中注入服务
import { Component } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  users: User[] = [];
  
  constructor(private userService: UserService) {
    this.users = this.userService.getUsers();
  }
}
```

### 2. 使用Inject装饰器

```typescript
import { Component, Inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  users: User[] = [];
  
  constructor(@Inject(UserService) private userService: UserService) {
    this.users = this.userService.getUsers();
  }
}
```

### 3. 可选依赖注入

```typescript
import { Component, Optional } from '@angular/core';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-component',
  template: '<div>组件内容</div>'
})
export class MyComponent {
  constructor(@Optional() private logger?: LoggerService) {
    if (this.logger) {
      this.logger.log('组件初始化');
    }
  }
}
```

## 🎯 服务作用域管理

### 1. 根级别服务（单例）

```typescript
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // 整个应用共享一个实例
}
```

### 2. 模块级别服务

```typescript
// 在模块中提供
@NgModule({
  providers: [UserService],
  // ...
})
export class UserModule { }

// 服务定义
@Injectable()
export class UserService {
  // 模块内共享实例
}
```

### 3. 组件级别服务

```typescript
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  providers: [UserService] // 每个组件实例都有自己的服务实例
})
export class UserComponent {
  constructor(private userService: UserService) {}
}
```

## 🔄 服务间通信

### 1. 使用Subject进行通信

```typescript
// 通信服务
@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private messageSubject = new Subject<string>();
  public message$ = this.messageSubject.asObservable();
  
  sendMessage(message: string) {
    this.messageSubject.next(message);
  }
}

// 发送方组件
@Component({...})
export class SenderComponent {
  constructor(private commService: CommunicationService) {}
  
  sendMessage() {
    this.commService.sendMessage('Hello from sender!');
  }
}

// 接收方组件
@Component({...})
export class ReceiverComponent implements OnInit, OnDestroy {
  message: string = '';
  private subscription?: Subscription;
  
  constructor(private commService: CommunicationService) {}
  
  ngOnInit() {
    this.subscription = this.commService.message$.subscribe(
      message => this.message = message
    );
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### 2. 使用BehaviorSubject

```typescript
@Injectable({
  providedIn: 'root'
})
export class StateService {
  private stateSubject = new BehaviorSubject<AppState>({
    user: null,
    theme: 'light',
    language: 'zh'
  });
  
  public state$ = this.stateSubject.asObservable();
  
  updateState(newState: Partial<AppState>) {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...newState });
  }
  
  getCurrentState(): AppState {
    return this.stateSubject.value;
  }
}

interface AppState {
  user: User | null;
  theme: string;
  language: string;
}
```

## 🎮 实践练习

### 练习1：创建数据管理服务

创建一个完整的数据管理服务，包含：

- CRUD操作
- 数据缓存
- 错误处理
- 加载状态管理

### 练习2：创建配置服务

创建一个配置管理服务，支持：

- 环境配置
- 动态配置更新
- 配置验证
- 配置持久化

## 📚 详细示例

### 完整的数据服务

```typescript
// data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService<T> {
  private dataSubject = new BehaviorSubject<T[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public data$ = this.dataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  private cache = new Map<string, T[]>();
  
  constructor() {}
  
  // 获取数据
  getData(endpoint: string, useCache: boolean = true): Observable<T[]> {
    if (useCache && this.cache.has(endpoint)) {
      this.dataSubject.next(this.cache.get(endpoint)!);
      return this.data$;
    }
    
    this.setLoading(true);
    this.clearError();
    
    // 模拟API调用
    return this.simulateApiCall<T[]>(endpoint).pipe(
      tap(data => {
        this.cache.set(endpoint, data);
        this.dataSubject.next(data);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        return throwError(error);
      })
    );
  }
  
  // 添加数据
  addData(endpoint: string, item: T): Observable<T> {
    this.setLoading(true);
    this.clearError();
    
    return this.simulateApiCall<T>(endpoint, 'POST', item).pipe(
      tap(newItem => {
        const currentData = this.dataSubject.value;
        this.dataSubject.next([...currentData, newItem]);
        this.updateCache(endpoint);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        return throwError(error);
      })
    );
  }
  
  // 更新数据
  updateData(endpoint: string, id: number, item: Partial<T>): Observable<T> {
    this.setLoading(true);
    this.clearError();
    
    return this.simulateApiCall<T>(endpoint, 'PUT', { id, ...item }).pipe(
      tap(updatedItem => {
        const currentData = this.dataSubject.value;
        const index = currentData.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          currentData[index] = updatedItem;
          this.dataSubject.next([...currentData]);
          this.updateCache(endpoint);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        return throwError(error);
      })
    );
  }
  
  // 删除数据
  deleteData(endpoint: string, id: number): Observable<boolean> {
    this.setLoading(true);
    this.clearError();
    
    return this.simulateApiCall<boolean>(endpoint, 'DELETE', { id }).pipe(
      tap(success => {
        if (success) {
          const currentData = this.dataSubject.value;
          const filteredData = currentData.filter((item: any) => item.id !== id);
          this.dataSubject.next(filteredData);
          this.updateCache(endpoint);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        return throwError(error);
      })
    );
  }
  
  // 清除缓存
  clearCache(endpoint?: string): void {
    if (endpoint) {
      this.cache.delete(endpoint);
    } else {
      this.cache.clear();
    }
  }
  
  // 刷新数据
  refreshData(endpoint: string): Observable<T[]> {
    this.clearCache(endpoint);
    return this.getData(endpoint, false);
  }
  
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
  
  private setError(error: string): void {
    this.errorSubject.next(error);
  }
  
  private clearError(): void {
    this.errorSubject.next(null);
  }
  
  private updateCache(endpoint: string): void {
    this.cache.set(endpoint, this.dataSubject.value);
  }
  
  // 模拟API调用
  private simulateApiCall<R>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any
  ): Observable<R> {
    return new Observable(observer => {
      setTimeout(() => {
        // 模拟成功响应
        if (Math.random() > 0.1) { // 90% 成功率
          observer.next(this.generateMockData<R>(endpoint, method, data));
          observer.complete();
        } else {
          // 模拟错误
          observer.error(new Error('API调用失败'));
        }
      }, 1000); // 模拟网络延迟
    });
  }
  
  private generateMockData<R>(endpoint: string, method: string, data?: any): R {
    // 根据endpoint和method生成模拟数据
    // 这里简化处理
    return data as R;
  }
}
```

### 使用数据服务的组件

```typescript
// user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from '../services/data.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];
  
  constructor(private dataService: DataService<User>) {}
  
  ngOnInit() {
    this.loadUsers();
    this.subscribeToData();
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadUsers() {
    this.dataService.getData('/api/users').subscribe();
  }
  
  addUser() {
    const newUser: Partial<User> = {
      name: '新用户',
      email: 'new@example.com',
      role: 'user'
    };
    
    this.dataService.addData('/api/users', newUser as User).subscribe();
  }
  
  updateUser(user: User) {
    const updatedUser = { ...user, name: user.name + ' (已更新)' };
    this.dataService.updateData('/api/users', user.id, updatedUser).subscribe();
  }
  
  deleteUser(user: User) {
    if (confirm('确定要删除这个用户吗？')) {
      this.dataService.deleteData('/api/users', user.id).subscribe();
    }
  }
  
  refreshUsers() {
    this.dataService.refreshData('/api/users').subscribe();
  }
  
  private subscribeToData() {
    // 订阅数据变化
    this.subscriptions.push(
      this.dataService.data$.subscribe(users => {
        this.users = users;
      })
    );
    
    // 订阅加载状态
    this.subscriptions.push(
      this.dataService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
    
    // 订阅错误信息
    this.subscriptions.push(
      this.dataService.error$.subscribe(error => {
        this.error = error;
      })
    );
  }
}
```

## 🔧 高级服务模式

### 1. 工厂服务

```typescript
// 工厂服务
@Injectable({
  providedIn: 'root'
})
export class LoggerFactory {
  createLogger(context: string): Logger {
    return new Logger(context);
  }
}

// 使用工厂
@Injectable()
export class SomeService {
  private logger: Logger;
  
  constructor(private loggerFactory: LoggerFactory) {
    this.logger = this.loggerFactory.createLogger('SomeService');
  }
}
```

### 2. 多提供者

```typescript
// 多个实现
export abstract class StorageService {
  abstract save(key: string, value: any): void;
  abstract get(key: string): any;
}

@Injectable()
export class LocalStorageService extends StorageService {
  save(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  get(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
}

@Injectable()
export class SessionStorageService extends StorageService {
  save(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  
  get(key: string): any {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
}

// 在模块中配置
@NgModule({
  providers: [
    { provide: StorageService, useClass: LocalStorageService },
    // 或者使用工厂
    {
      provide: StorageService,
      useFactory: () => {
        return window.localStorage ? 
          new LocalStorageService() : 
          new SessionStorageService();
      }
    }
  ]
})
export class AppModule {}
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 理解服务的概念和作用
- [ ] 创建和使用服务
- [ ] 理解依赖注入系统
- [ ] 管理服务作用域
- [ ] 实现服务间通信
- [ ] 使用高级服务模式

## 🚀 下一步

完成本章节学习后，请继续学习[07-HTTP通信](./../07-http/README.md)。
