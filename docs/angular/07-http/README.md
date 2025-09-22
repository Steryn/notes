# 07 - HTTP通信

## 📖 学习目标

通过本章节学习，您将掌握：

- HTTP客户端的使用
- RESTful API调用
- 请求和响应处理
- 错误处理机制
- 拦截器的使用
- 缓存策略
- 文件上传下载

## 🎯 核心概念

### 1. HttpClient模块

Angular的HttpClient提供了强大的HTTP客户端功能：

- **基于Observable**：所有HTTP操作返回Observable
- **类型安全**：支持TypeScript类型检查
- **拦截器支持**：可以拦截请求和响应
- **错误处理**：内置错误处理机制
- **进度支持**：支持上传下载进度

### 2. HTTP方法

```typescript
// 常用HTTP方法
GET     // 获取数据
POST    // 创建数据
PUT     // 更新数据
PATCH   // 部分更新
DELETE  // 删除数据
HEAD    // 获取响应头
OPTIONS // 获取支持的HTTP方法
```

### 3. 请求配置

```typescript
interface HttpRequestConfig {
  headers?: HttpHeaders;
  params?: HttpParams;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  observe?: 'body' | 'response' | 'events';
  reportProgress?: boolean;
  withCredentials?: boolean;
}
```

## 🏗️ 基础HTTP操作

### 1. 配置HttpClient

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule // 导入HttpClient模块
  ],
  // ...
})
export class AppModule { }
```

### 2. 基本HTTP请求

```typescript
// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://api.example.com';
  
  constructor(private http: HttpClient) {}
  
  // GET请求 - 获取所有用户
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`);
  }
  
  // GET请求 - 根据ID获取用户
  getUserById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`);
  }
  
  // POST请求 - 创建用户
  createUser(user: Partial<User>): Observable<ApiResponse<User>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<ApiResponse<User>>(
      `${this.baseUrl}/users`,
      user,
      { headers }
    );
  }
  
  // PUT请求 - 更新用户
  updateUser(id: number, user: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(
      `${this.baseUrl}/users/${id}`,
      user
    );
  }
  
  // DELETE请求 - 删除用户
  deleteUser(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/users/${id}`);
  }
  
  // 带查询参数的GET请求
  searchUsers(query: string, page: number = 1, limit: number = 10): Observable<ApiResponse<User[]>> {
    let params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users/search`, { params });
  }
}
```

## 🔧 高级HTTP功能

### 1. 请求拦截器

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 获取token
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // 克隆请求并添加认证头
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}

// 注册拦截器
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
```

### 2. 响应拦截器

```typescript
// response.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // 统一处理响应格式
          if (event.body && event.body.success === false) {
            throw new Error(event.body.message || '请求失败');
          }
        }
        return event;
      }),
      catchError(error => {
        // 统一错误处理
        console.error('HTTP Error:', error);
        return throwError(error);
      })
    );
  }
}
```

### 3. 错误处理

```typescript
// error-handler.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '发生未知错误';
    
    if (error.error instanceof ErrorEvent) {
      // 客户端错误
      errorMessage = `客户端错误: ${error.error.message}`;
    } else {
      // 服务器错误
      switch (error.status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          break;
        case 403:
          errorMessage = '禁止访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `服务器错误: ${error.status}`;
      }
    }
    
    console.error('Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

// 在服务中使用
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
```

## 📁 文件操作

### 1. 文件上传

```typescript
// file-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(private http: HttpClient) {}
  
  // 单文件上传
  uploadFile(file: File): Observable<{ progress: number; result?: any }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post('/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            return { progress };
          case HttpEventType.Response:
            return { progress: 100, result: event.body };
          default:
            return { progress: 0 };
        }
      }),
      filter(event => event.progress > 0)
    );
  }
  
  // 多文件上传
  uploadMultipleFiles(files: File[]): Observable<{ progress: number; results?: any[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    return this.http.post('/api/upload/multiple', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            return { progress };
          case HttpEventType.Response:
            return { progress: 100, results: event.body };
          default:
            return { progress: 0 };
        }
      }),
      filter(event => event.progress > 0)
    );
  }
}
```

### 2. 文件下载

```typescript
// file-download.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {
  constructor(private http: HttpClient) {}
  
  // 下载文件
  downloadFile(url: string, filename?: string): Observable<Blob> {
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      map(blob => {
        // 创建下载链接
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        return blob;
      })
    );
  }
  
  // 预览文件
  previewFile(url: string): Observable<string> {
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      map(blob => {
        return window.URL.createObjectURL(blob);
      })
    );
  }
}
```

## 🎮 实践练习

### 练习1：创建完整的API服务

创建一个完整的用户管理API服务，包含：

- 用户CRUD操作
- 分页查询
- 搜索功能
- 错误处理
- 加载状态管理

### 练习2：实现文件上传组件

创建一个文件上传组件，支持：

- 单文件/多文件上传
- 上传进度显示
- 文件类型验证
- 文件大小限制
- 拖拽上传

## 📚 详细示例

### 完整的用户管理服务

```typescript
// user-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private baseUrl = '/api/users';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // 获取用户列表
  getUsers(params: UserQueryParams = {}): Observable<UserListResponse> {
    this.setLoading(true);
    this.clearError();
    
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    
    return this.http.get<UserListResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 根据ID获取用户
  getUserById(id: number): Observable<User> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<User>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 创建用户
  createUser(userData: Partial<User>): Observable<User> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.post<User>(this.baseUrl, userData)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 更新用户
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.put<User>(`${this.baseUrl}/${id}`, userData)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 删除用户
  deleteUser(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 批量删除用户
  deleteUsers(ids: number[]): Observable<void> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.delete<void>(`${this.baseUrl}/batch`, {
      body: { ids }
    }).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }
  
  // 上传用户头像
  uploadAvatar(userId: number, file: File): Observable<{ avatarUrl: string }> {
    this.setLoading(true);
    this.clearError();
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post<{ avatarUrl: string }>(`${this.baseUrl}/${userId}/avatar`, formData)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }
  
  // 导出用户数据
  exportUsers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get(`${this.baseUrl}/export`, {
      params: new HttpParams().set('format', format),
      responseType: 'blob'
    }).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
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
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = '发生未知错误';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `客户端错误: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          break;
        case 403:
          errorMessage = '没有权限执行此操作';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 409:
          errorMessage = '数据冲突，请检查输入';
          break;
        case 422:
          errorMessage = '数据验证失败';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `服务器错误: ${error.status}`;
      }
    }
    
    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

### 使用API服务的组件

```typescript
// user-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserApiService, User, UserQueryParams } from './user-api.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  
  // 分页信息
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // 搜索
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  // 订阅管理
  private subscriptions: Subscription[] = [];
  
  constructor(private userApiService: UserApiService) {}
  
  ngOnInit() {
    this.loadUsers();
    this.setupSearch();
    this.subscribeToLoading();
    this.subscribeToError();
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadUsers() {
    const params: UserQueryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm || undefined
    };
    
    this.subscriptions.push(
      this.userApiService.getUsers(params).subscribe({
        next: (response) => {
          this.users = response.users;
          this.totalItems = response.total;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('加载用户失败:', error);
        }
      })
    );
  }
  
  onSearch(searchTerm: string) {
    this.searchSubject.next(searchTerm);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }
  
  createUser() {
    // 打开创建用户对话框
    // 这里可以调用模态框或导航到创建页面
  }
  
  editUser(user: User) {
    // 打开编辑用户对话框
    // 这里可以调用模态框或导航到编辑页面
  }
  
  deleteUser(user: User) {
    if (confirm(`确定要删除用户 "${user.name}" 吗？`)) {
      this.subscriptions.push(
        this.userApiService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers(); // 重新加载列表
          },
          error: (error) => {
            console.error('删除用户失败:', error);
          }
        })
      );
    }
  }
  
  uploadAvatar(user: User, event: any) {
    const file = event.target.files[0];
    if (file) {
      this.subscriptions.push(
        this.userApiService.uploadAvatar(user.id, file).subscribe({
          next: (response) => {
            user.avatar = response.avatarUrl;
          },
          error: (error) => {
            console.error('上传头像失败:', error);
          }
        })
      );
    }
  }
  
  exportUsers() {
    this.subscriptions.push(
      this.userApiService.exportUsers('csv').subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'users.csv';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('导出失败:', error);
        }
      })
    );
  }
  
  private setupSearch() {
    this.subscriptions.push(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(searchTerm => {
          this.searchTerm = searchTerm;
          this.currentPage = 1;
          this.loadUsers();
          return [];
        })
      ).subscribe()
    );
  }
  
  private subscribeToLoading() {
    this.subscriptions.push(
      this.userApiService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
  }
  
  private subscribeToError() {
    this.subscriptions.push(
      this.userApiService.error$.subscribe(error => {
        this.error = error;
      })
    );
  }
}
```

## 🔧 缓存策略

### 1. HTTP缓存

```typescript
// cache.service.ts
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
// cached-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachedApiService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟
  
  constructor(private http: HttpClient) {}
  
  get<T>(url: string, useCache: boolean = true): Observable<T> {
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

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用HttpClient进行HTTP请求
- [ ] 处理请求和响应
- [ ] 实现错误处理机制
- [ ] 使用拦截器
- [ ] 处理文件上传下载
- [ ] 实现缓存策略

## 🚀 下一步

完成本章节学习后，请继续学习[08-路由基础](./../08-routing/README.md)。
