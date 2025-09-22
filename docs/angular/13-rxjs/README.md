# 13 - RxJS与异步编程

## 📖 学习目标

通过本章节学习，您将掌握：

- RxJS核心概念和原理
- 高级操作符的使用
- Subject和BehaviorSubject
- 调度器(Schedulers)
- 错误处理策略
- 内存泄漏预防
- 性能优化技巧

## 🎯 核心概念

### 1. 什么是RxJS？

RxJS (Reactive Extensions for JavaScript) 是一个用于处理异步和基于事件的程序的库，它使用Observable序列来编写异步和基于事件的程序。

### 2. 核心概念

```
Observable (可观察对象) - 数据流
├── Observer (观察者) - 订阅者
├── Subscription (订阅) - 连接
├── Operators (操作符) - 转换
└── Subject (主体) - 多播
```

### 3. 响应式编程模式

```
数据源 → 操作符链 → 订阅者
   ↓         ↓         ↓
Observable → Operators → Observer
```

## 🔧 Observable基础

### 1. 创建Observable

```typescript
import { Observable, of, from, interval, timer } from 'rxjs';

// 创建简单值
const simple$ = of(1, 2, 3, 4, 5);

// 从数组创建
const array$ = from([1, 2, 3, 4, 5]);

// 从Promise创建
const promise$ = from(fetch('/api/data'));

// 定时器
const interval$ = interval(1000); // 每秒发射
const timer$ = timer(2000, 1000); // 2秒后开始，每秒发射

// 自定义Observable
const custom$ = new Observable(observer => {
  observer.next('Hello');
  observer.next('World');
  observer.complete();
});
```

### 2. 订阅Observable

```typescript
// 基本订阅
const subscription = observable.subscribe({
  next: value => console.log('Next:', value),
  error: error => console.error('Error:', error),
  complete: () => console.log('Complete')
});

// 简化订阅
observable.subscribe(
  value => console.log('Next:', value),
  error => console.error('Error:', error),
  () => console.log('Complete')
);

// 只处理next
observable.subscribe(value => console.log('Next:', value));
```

## 🎯 高级操作符

### 1. 转换操作符

```typescript
import { map, switchMap, mergeMap, concatMap, exhaustMap } from 'rxjs/operators';

// map - 转换每个值
const doubled$ = source$.pipe(
  map(x => x * 2)
);

// switchMap - 切换到新的Observable
const userPosts$ = userId$.pipe(
  switchMap(id => this.userService.getUserPosts(id))
);

// mergeMap - 合并多个Observable
const searchResults$ = searchQuery$.pipe(
  mergeMap(query => this.searchService.search(query))
);

// concatMap - 按顺序执行
const uploadFiles$ = fileList$.pipe(
  concatMap(file => this.uploadService.upload(file))
);

// exhaustMap - 忽略新的请求直到当前完成
const saveData$ = formData$.pipe(
  exhaustMap(data => this.dataService.save(data))
);
```

### 2. 过滤操作符

```typescript
import { filter, take, takeUntil, takeWhile, skip, distinct } from 'rxjs/operators';

// filter - 过滤值
const evenNumbers$ = numbers$.pipe(
  filter(x => x % 2 === 0)
);

// take - 取前N个值
const firstFive$ = source$.pipe(
  take(5)
);

// takeUntil - 直到某个条件
const data$ = source$.pipe(
  takeUntil(this.destroy$)
);

// takeWhile - 当条件为真时取值
const ascending$ = numbers$.pipe(
  takeWhile(x => x < 10)
);

// skip - 跳过前N个值
const afterFirst$ = source$.pipe(
  skip(1)
);

// distinct - 去重
const unique$ = source$.pipe(
  distinct()
);
```

### 3. 组合操作符

```typescript
import { combineLatest, merge, zip, withLatestFrom } from 'rxjs';
import { startWith, debounceTime, throttleTime } from 'rxjs/operators';

// combineLatest - 组合最新的值
const combined$ = combineLatest([
  user$,
  posts$,
  comments$
]).pipe(
  map(([user, posts, comments]) => ({
    user,
    posts,
    comments
  }))
);

// merge - 合并多个Observable
const merged$ = merge(
  click$,
  keyup$,
  scroll$
);

// zip - 按索引组合
const zipped$ = zip(
  names$,
  ages$,
  cities$
).pipe(
  map(([name, age, city]) => ({ name, age, city }))
);

// withLatestFrom - 与最新的值组合
const searchResults$ = searchQuery$.pipe(
  withLatestFrom(filters$),
  switchMap(([query, filters]) => 
    this.searchService.search(query, filters)
  )
);

// debounceTime - 防抖
const debouncedSearch$ = searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged()
);

// throttleTime - 节流
const throttledScroll$ = scroll$.pipe(
  throttleTime(100)
);
```

## 🔄 Subject和BehaviorSubject

### 1. Subject

```typescript
import { Subject } from 'rxjs';

// 创建Subject
const subject = new Subject<string>();

// 订阅
const subscription1 = subject.subscribe(value => 
  console.log('Observer 1:', value)
);

const subscription2 = subject.subscribe(value => 
  console.log('Observer 2:', value)
);

// 发射值
subject.next('Hello');
subject.next('World');

// 完成
subject.complete();

// 错误
subject.error(new Error('Something went wrong'));
```

### 2. BehaviorSubject

```typescript
import { BehaviorSubject } from 'rxjs';

// 创建BehaviorSubject（需要初始值）
const behaviorSubject = new BehaviorSubject<string>('Initial Value');

// 订阅（会立即收到当前值）
const subscription = behaviorSubject.subscribe(value => 
  console.log('Current value:', value)
);

// 获取当前值
console.log('Current value:', behaviorSubject.value);

// 发射新值
behaviorSubject.next('New Value');
```

### 3. 实际应用示例

```typescript
// 用户认证状态管理
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // 从localStorage恢复用户状态
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
  }

  login(user: User) {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}

// 使用服务
@Component({
  selector: 'app-header',
  template: `
    <div *ngIf="user$ | async as user">
      欢迎，{{ user.name }}！
      <button (click)="logout()">退出</button>
    </div>
    <div *ngIf="!(user$ | async)">
      <a routerLink="/login">登录</a>
    </div>
  `
})
export class HeaderComponent {
  user$ = this.authService.user$;

  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
```

## ⚡ 调度器(Schedulers)

### 1. 调度器类型

```typescript
import { 
  asyncScheduler, 
  queueScheduler, 
  asapScheduler, 
  animationFrameScheduler 
} from 'rxjs';

// asyncScheduler - 异步执行
const async$ = of(1, 2, 3).pipe(
  observeOn(asyncScheduler)
);

// queueScheduler - 同步执行
const queue$ = of(1, 2, 3).pipe(
  observeOn(queueScheduler)
);

// asapScheduler - 尽快异步执行
const asap$ = of(1, 2, 3).pipe(
  observeOn(asapScheduler)
);

// animationFrameScheduler - 在下一帧执行
const animation$ = of(1, 2, 3).pipe(
  observeOn(animationFrameScheduler)
);
```

### 2. 实际应用

```typescript
// 防抖搜索
const searchResults$ = searchInput$.pipe(
  debounceTime(300, asyncScheduler),
  distinctUntilChanged(),
  switchMap(query => this.searchService.search(query))
);

// 动画优化
const animation$ = scroll$.pipe(
  throttleTime(16, animationFrameScheduler), // 60fps
  map(event => event.target.scrollTop)
);
```

## 🛡️ 错误处理

### 1. 基本错误处理

```typescript
import { catchError, retry, retryWhen, delay } from 'rxjs/operators';
import { throwError, timer } from 'rxjs';

// catchError - 捕获错误
const safeData$ = data$.pipe(
  catchError(error => {
    console.error('Error:', error);
    return of([]); // 返回默认值
  })
);

// retry - 重试
const retryData$ = data$.pipe(
  retry(3) // 重试3次
);

// retryWhen - 条件重试
const retryWhenData$ = data$.pipe(
  retryWhen(errors => 
    errors.pipe(
      delay(1000),
      take(3)
    )
  )
);

// 自定义错误处理
const customError$ = data$.pipe(
  catchError(error => {
    if (error.status === 404) {
      return of(null);
    } else if (error.status === 500) {
      return throwError('服务器错误');
    } else {
      return throwError('未知错误');
    }
  })
);
```

### 2. 全局错误处理

```typescript
// 全局错误处理服务
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorSubject = new Subject<Error>();
  public error$ = this.errorSubject.asObservable();

  handleError(error: any) {
    console.error('Global error:', error);
    this.errorSubject.next(error);
    
    // 发送到错误监控服务
    this.sendToMonitoring(error);
  }

  private sendToMonitoring(error: any) {
    // 发送到错误监控服务
  }
}

// HTTP拦截器
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError(error => {
        this.errorHandler.handleError(error);
        return throwError(error);
      })
    );
  }
}
```

## 🧠 内存泄漏预防

### 1. 订阅管理

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-data-component',
  template: `<div>{{ data }}</div>`
})
export class DataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: any;

  ngOnInit() {
    // 使用takeUntil自动取消订阅
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.data = data;
      });

    // 多个订阅
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // 处理用户数据
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 2. 手动订阅管理

```typescript
@Component({
  selector: 'app-manual-component',
  template: `<div>{{ data }}</div>`
})
export class ManualComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  data: any;

  ngOnInit() {
    // 收集订阅
    this.subscriptions.push(
      this.dataService.getData().subscribe(data => {
        this.data = data;
      })
    );

    this.subscriptions.push(
      this.userService.getUser().subscribe(user => {
        // 处理用户数据
      })
    );
  }

  ngOnDestroy() {
    // 取消所有订阅
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

## 🎮 实践练习

### 练习1：实现搜索功能

创建一个带有防抖、去重、错误处理的搜索功能：

- 用户输入搜索关键词
- 300ms防抖
- 去重相同查询
- 错误处理和重试
- 加载状态管理

### 练习2：实现实时数据更新

创建一个实时数据更新系统：

- 使用WebSocket连接
- 自动重连机制
- 错误处理和恢复
- 数据缓存和同步

## 📚 详细示例

### 完整的搜索组件

```typescript
// search.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  catchError, 
  startWith,
  takeUntil,
  retry
} from 'rxjs/operators';
import { SearchService } from './search.service';

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  type: string;
}

export interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
}

@Component({
  selector: 'app-search',
  template: `
    <div class="search-container">
      <input 
        [formControl]="searchControl"
        placeholder="搜索..."
        class="search-input">
      
      <div *ngIf="searchState$ | async as state" class="search-results">
        <div *ngIf="state.loading" class="loading">
          搜索中...
        </div>
        
        <div *ngIf="state.error" class="error">
          错误: {{ state.error }}
          <button (click)="retrySearch()">重试</button>
        </div>
        
        <div *ngIf="!state.loading && !state.error" class="results">
          <div *ngFor="let result of state.results" class="result-item">
            <h3>{{ result.title }}</h3>
            <p>{{ result.description }}</p>
            <span class="type">{{ result.type }}</span>
          </div>
          
          <div *ngIf="state.results.length === 0 && state.query" class="no-results">
            没有找到相关结果
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  private retrySubject = new Subject<void>();
  
  searchState$ = new BehaviorSubject<SearchState>({
    results: [],
    loading: false,
    error: null,
    query: ''
  });

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    // 搜索流
    const searchQuery$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      takeUntil(this.destroy$)
    );

    // 重试流
    const retry$ = this.retrySubject.pipe(
      switchMap(() => this.searchControl.value),
      takeUntil(this.destroy$)
    );

    // 合并搜索和重试流
    const searchTrigger$ = combineLatest([searchQuery$, retry$]).pipe(
      map(([query]) => query),
      distinctUntilChanged()
    );

    // 执行搜索
    searchTrigger$.pipe(
      switchMap(query => {
        if (!query || query.trim() === '') {
          return of({
            results: [],
            loading: false,
            error: null,
            query: ''
          });
        }

        this.updateState({ loading: true, error: null, query });

        return this.searchService.search(query).pipe(
          map(results => ({
            results,
            loading: false,
            error: null,
            query
          })),
          catchError(error => {
            console.error('Search error:', error);
            return of({
              results: [],
              loading: false,
              error: '搜索失败，请重试',
              query
            });
          }),
          retry(2) // 重试2次
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.searchState$.next(state);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retrySearch() {
    this.retrySubject.next();
  }

  private updateState(partialState: Partial<SearchState>) {
    const currentState = this.searchState$.value;
    this.searchState$.next({ ...currentState, ...partialState });
  }
}
```

### 实时数据服务

```typescript
// realtime-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, timer } from 'rxjs';
import { 
  switchMap, 
  catchError, 
  retry, 
  takeUntil,
  shareReplay
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RealtimeDataService {
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private dataSubject = new Subject<any>();
  private destroy$ = new Subject<void>();

  public connection$ = this.connectionSubject.asObservable();
  public data$ = this.dataSubject.asObservable();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    // 模拟WebSocket连接
    timer(0, 5000).pipe(
      switchMap(() => this.fetchData()),
      catchError(error => {
        console.error('Connection error:', error);
        this.connectionSubject.next(false);
        return this.reconnect();
      }),
      retry(3),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.dataSubject.next(data);
      this.connectionSubject.next(true);
    });
  }

  private fetchData(): Observable<any> {
    // 模拟API调用
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          timestamp: new Date(),
          value: Math.random() * 100
        });
        observer.complete();
      }, 1000);
    });
  }

  private reconnect(): Observable<any> {
    return timer(5000).pipe(
      switchMap(() => this.fetchData())
    );
  }

  disconnect() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## 🔧 性能优化技巧

### 1. 使用shareReplay

```typescript
// 共享Observable结果
const sharedData$ = this.dataService.getData().pipe(
  shareReplay(1) // 缓存最后一个值
);

// 多个订阅者共享同一个请求
const subscription1 = sharedData$.subscribe(data => console.log('Sub1:', data));
const subscription2 = sharedData$.subscribe(data => console.log('Sub2:', data));
```

### 2. 使用distinctUntilChanged

```typescript
// 只在值真正改变时发射
const distinctData$ = data$.pipe(
  distinctUntilChanged()
);
```

### 3. 使用auditTime

```typescript
// 限制发射频率
const throttledData$ = data$.pipe(
  auditTime(100) // 每100ms最多发射一次
);
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 理解RxJS核心概念
- [ ] 使用高级操作符
- [ ] 使用Subject和BehaviorSubject
- [ ] 理解调度器的作用
- [ ] 实现错误处理策略
- [ ] 预防内存泄漏
- [ ] 优化性能

## 🚀 下一步

完成本章节学习后，请继续学习[14-测试](./../14-testing/README.md)。
