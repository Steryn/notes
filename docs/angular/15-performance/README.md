# 15 - 性能优化

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular性能优化策略
- 变更检测优化
- 内存泄漏预防
- 懒加载和代码分割
- 缓存策略
- 性能监控和调试

## 🎯 核心概念

### 1. 性能优化原则

- **减少变更检测**：最小化不必要的变更检测
- **优化渲染**：减少DOM操作和重绘
- **内存管理**：防止内存泄漏
- **代码分割**：按需加载代码
- **缓存策略**：减少重复计算和网络请求

### 2. 性能瓶颈

```
用户交互 → 变更检测 → 组件渲染 → DOM更新 → 浏览器重绘
    ↓           ↓           ↓           ↓           ↓
  事件处理    脏检查      模板编译    样式计算    布局计算
```

### 3. 优化策略

- **OnPush策略**：减少变更检测频率
- **TrackBy函数**：优化列表渲染
- **虚拟滚动**：处理大量数据
- **懒加载**：按需加载模块
- **缓存**：减少重复计算

## 🔧 变更检测优化

### 1. OnPush变更检测策略

```typescript
// 使用OnPush策略的组件
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush // 使用OnPush策略
})
export class UserCardComponent {
  @Input() user: User;
  @Input() showActions: boolean = true;

  // 组件只在以下情况触发变更检测：
  // 1. 输入属性引用发生变化
  // 2. 组件内部事件触发
  // 3. 手动触发变更检测
}
```

### 2. 手动触发变更检测

```typescript
import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataDisplayComponent {
  data: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  updateData(newData: any[]) {
    this.data = newData;
    // 手动触发变更检测
    this.cdr.markForCheck();
  }

  // 或者使用detectChanges()立即检测
  updateDataImmediate(newData: any[]) {
    this.data = newData;
    this.cdr.detectChanges();
  }
}
```

### 3. 使用AsyncPipe

```typescript
// 组件
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of users$ | async">
      {{ user.name }}
    </div>
  `
})
export class UserListComponent {
  users$ = this.userService.getUsers();
  
  constructor(private userService: UserService) {}
}
```

## 🎯 列表渲染优化

### 1. TrackBy函数

```typescript
// 组件
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of users; trackBy: trackByUserId">
      {{ user.name }}
    </div>
  `
})
export class UserListComponent {
  users: User[] = [];

  trackByUserId(index: number, user: User): number {
    return user.id; // 使用唯一ID作为trackBy
  }

  // 或者使用索引（适用于静态列表）
  trackByIndex(index: number, item: any): number {
    return index;
  }
}
```

### 2. 虚拟滚动

```typescript
// 安装CDK
// npm install @angular/cdk

// 模块配置
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    ScrollingModule
  ]
})
export class AppModule {}

// 组件使用
@Component({
  selector: 'app-large-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
    }
    .item {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
  `]
})
export class LargeListComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
}
```

## 🧠 内存管理

### 1. 订阅管理

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-data-component',
  templateUrl: './data-component.component.html'
})
export class DataComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // 收集所有订阅
    this.subscriptions.push(
      this.dataService.getData().subscribe(data => {
        this.data = data;
      })
    );

    this.subscriptions.push(
      this.userService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy() {
    // 取消所有订阅
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 2. 使用takeUntil操作符

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-clean-component',
  templateUrl: './clean-component.component.html'
})
export class CleanComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.data = data;
      });

    this.userService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 3. 事件监听器清理

```typescript
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-scroll-component',
  templateUrl: './scroll-component.component.html'
})
export class ScrollComponent implements OnInit, OnDestroy {
  private scrollListener?: () => void;

  ngOnInit() {
    // 添加滚动监听器
    this.scrollListener = this.onScroll.bind(this);
    window.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy() {
    // 移除滚动监听器
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private onScroll() {
    // 处理滚动事件
  }

  // 或者使用HostListener装饰器
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    // 处理滚动事件
  }
}
```

## 📦 懒加载和代码分割

### 1. 路由懒加载

```typescript
// 路由配置
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];

// 预加载策略
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules // 预加载所有模块
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

### 2. 自定义预加载策略

```typescript
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // 只预加载标记为preload的路由
    if (route.data && route.data['preload']) {
      return load();
    }
    return of(null);
  }
}

// 使用自定义策略
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: CustomPreloadingStrategy
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

### 3. 动态导入组件

```typescript
import { Component, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';

@Component({
  selector: 'app-dynamic-loader',
  template: `
    <button (click)="loadComponent()">加载组件</button>
    <ng-container #dynamicComponent></ng-container>
  `
})
export class DynamicLoaderComponent {
  @ViewChild('dynamicComponent', { read: ViewContainerRef }) 
  dynamicComponent!: ViewContainerRef;

  private componentRef?: ComponentRef<any>;

  async loadComponent() {
    // 动态导入组件
    const { LazyComponent } = await import('./lazy/lazy.component');
    
    // 创建组件实例
    this.componentRef = this.dynamicComponent.createComponent(LazyComponent);
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
```

## 💾 缓存策略

### 1. HTTP缓存

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, any>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event.type === 4) { // HttpResponse
          this.cache.set(req.url, event);
        }
      })
    );
  }
}
```

### 2. 服务端缓存

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachedDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟

  constructor(private http: HttpClient) {}

  getData<T>(url: string, useCache: boolean = true): Observable<T> {
    if (useCache) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return of(cached.data);
      }
    }

    return this.http.get<T>(url).pipe(
      tap(data => {
        this.cache.set(url, {
          data,
          timestamp: Date.now()
        });
      })
    );
  }

  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}
```

### 3. 计算属性缓存

```typescript
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-expensive-component',
  template: `
    <div>{{ expensiveCalculation() }}</div>
  `
})
export class ExpensiveComponent {
  @Input() data: any[] = [];
  
  private calculationCache = new Map<string, any>();

  expensiveCalculation(): any {
    const cacheKey = JSON.stringify(this.data);
    
    if (this.calculationCache.has(cacheKey)) {
      return this.calculationCache.get(cacheKey);
    }

    // 执行昂贵的计算
    const result = this.performExpensiveCalculation(this.data);
    
    // 缓存结果
    this.calculationCache.set(cacheKey, result);
    
    return result;
  }

  private performExpensiveCalculation(data: any[]): any {
    // 模拟昂贵的计算
    return data.reduce((acc, item) => acc + item.value, 0);
  }
}
```

## 📊 性能监控

### 1. 使用Angular DevTools

```typescript
// 安装Angular DevTools浏览器扩展
// 在开发环境中监控性能

// 在组件中添加性能标记
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-performance-component',
  template: `<div>性能监控组件</div>`
})
export class PerformanceComponent implements OnInit {
  ngOnInit() {
    // 性能标记
    performance.mark('component-init-start');
    
    // 组件初始化逻辑
    this.initializeComponent();
    
    performance.mark('component-init-end');
    performance.measure('component-init', 'component-init-start', 'component-init-end');
  }

  private initializeComponent() {
    // 初始化逻辑
  }
}
```

### 2. 自定义性能监控服务

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metrics: Map<string, number> = new Map();

  startTiming(name: string): void {
    this.metrics.set(`${name}-start`, performance.now());
  }

  endTiming(name: string): number {
    const startTime = this.metrics.get(`${name}-start`);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.set(name, duration);
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}
```

### 3. 变更检测性能监控

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplicationRef } from '@angular/core';

@Component({
  selector: 'app-performance-monitor',
  template: `<div>性能监控</div>`
})
export class PerformanceMonitorComponent implements OnInit, OnDestroy {
  private changeDetectionCount = 0;

  constructor(private appRef: ApplicationRef) {}

  ngOnInit() {
    // 监控变更检测
    const originalTick = this.appRef.tick.bind(this.appRef);
    this.appRef.tick = () => {
      this.changeDetectionCount++;
      console.log(`变更检测次数: ${this.changeDetectionCount}`);
      return originalTick();
    };
  }

  ngOnDestroy() {
    console.log(`总变更检测次数: ${this.changeDetectionCount}`);
  }
}
```

## 🎮 实践练习

### 练习1：优化大型列表组件

创建一个包含大量数据的列表组件，并应用以下优化：

- 使用OnPush变更检测策略
- 实现TrackBy函数
- 使用虚拟滚动
- 添加分页或无限滚动

### 练习2：实现缓存系统

创建一个带有缓存功能的数据服务，包括：

- HTTP请求缓存
- 内存缓存
- 缓存过期策略
- 缓存清理机制

## 📚 性能优化最佳实践

### 1. 组件设计原则

```typescript
// 好的组件设计
@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  @Input() user: User;
  
  // 使用纯函数
  getDisplayName(): string {
    return `${this.user.firstName} ${this.user.lastName}`;
  }
}

// 避免的设计
@Component({
  selector: 'app-bad-component',
  template: `<div>{{ getData() }}</div>`
})
export class BadComponent {
  // 避免在模板中调用方法
  getData(): string {
    // 每次变更检测都会执行
    return 'expensive calculation';
  }
}
```

### 2. 内存泄漏预防

```typescript
// 正确的订阅管理
@Component({
  selector: 'app-clean-component',
  template: `<div>Clean Component</div>`
})
export class CleanComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.dataService.getData()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error:', error);
          return of(null);
        })
      )
      .subscribe(data => {
        this.data = data;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 3. 性能测试

```typescript
// 性能测试示例
describe('Performance Tests', () => {
  it('should render large list efficiently', () => {
    const startTime = performance.now();
    
    // 渲染大量数据
    component.items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    fixture.detectChanges();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 断言渲染时间在合理范围内
    expect(renderTime).toBeLessThan(100); // 100ms
  });
});
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用OnPush变更检测策略
- [ ] 优化列表渲染性能
- [ ] 防止内存泄漏
- [ ] 实现懒加载和代码分割
- [ ] 使用缓存策略
- [ ] 监控和调试性能

## 🚀 下一步

完成本章节学习后，请继续学习[16-部署与构建](./../16-deployment/README.md)。
