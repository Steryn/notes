# 08 - 路由基础

## 📖 学习目标

通过本章节学习，您将掌握：

- Angular路由系统基础
- 路由配置和导航
- 路由参数传递
- 路由守卫
- 嵌套路由
- 懒加载模块

## 🎯 核心概念

### 1. 什么是路由？

路由是Angular中用于实现单页面应用(SPA)导航的机制，它允许：

- 根据URL显示不同组件
- 实现页面间的导航
- 管理浏览器历史记录
- 支持前进后退按钮

### 2. 路由系统架构

```
URL → Router → Route → Component
  ↓
Browser History
  ↓
Navigation Events
```

### 3. 路由配置

```typescript
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', component: NotFoundComponent } // 通配符路由
];
```

## 🏗️ 基础路由配置

### 1. 配置路由模块

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 2. 在根模块中导入

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule // 导入路由模块
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 3. 在模板中使用路由

```html
<!-- app.component.html -->
<nav>
  <a routerLink="/home">首页</a>
  <a routerLink="/about">关于</a>
  <a routerLink="/contact">联系</a>
</nav>

<main>
  <router-outlet></router-outlet>
</main>
```

## 🔗 路由导航

### 1. 模板导航

```html
<!-- 基本导航 -->
<a routerLink="/home">首页</a>
<a routerLink="/about">关于</a>

<!-- 动态路由 -->
<a [routerLink]="['/user', userId]">用户详情</a>

<!-- 带查询参数 -->
<a [routerLink]="['/search']" [queryParams]="{q: 'angular'}">搜索</a>

<!-- 带片段 -->
<a routerLink="/home" fragment="section1">跳转到章节1</a>

<!-- 激活状态样式 -->
<a routerLink="/home" routerLinkActive="active">首页</a>
```

### 2. 编程式导航

```typescript
// 在组件中注入Router
import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-navigation',
  template: `
    <button (click)="goToHome()">去首页</button>
    <button (click)="goToUser(123)">用户详情</button>
    <button (click)="goBack()">返回</button>
  `
})
export class NavigationComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  goToHome() {
    this.router.navigate(['/home']);
  }
  
  goToUser(userId: number) {
    this.router.navigate(['/user', userId]);
  }
  
  goToSearch(query: string) {
    this.router.navigate(['/search'], {
      queryParams: { q: query }
    });
  }
  
  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  
  goForward() {
    this.router.navigate(['../'], { 
      relativeTo: this.route,
      queryParams: { page: 2 }
    });
  }
}
```

## 📝 路由参数

### 1. 路径参数

```typescript
// 路由配置
const routes: Routes = [
  { path: 'user/:id', component: UserDetailComponent },
  { path: 'user/:id/edit', component: UserEditComponent }
];

// 获取路径参数
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  template: `
    <h2>用户详情</h2>
    <p>用户ID: {{ userId }}</p>
    <p>用户信息: {{ userInfo | json }}</p>
  `
})
export class UserDetailComponent implements OnInit {
  userId: string | null = null;
  userInfo: any = null;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    // 获取路径参数
    this.userId = this.route.snapshot.paramMap.get('id');
    
    // 监听参数变化
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      this.loadUser();
    });
  }
  
  private loadUser() {
    if (this.userId) {
      // 根据ID加载用户信息
      // this.userService.getUser(this.userId).subscribe(user => {
      //   this.userInfo = user;
      // });
    }
  }
}
```

### 2. 查询参数

```typescript
// 路由配置
const routes: Routes = [
  { path: 'search', component: SearchComponent }
];

// 获取查询参数
@Component({
  selector: 'app-search',
  template: `
    <h2>搜索结果</h2>
    <p>搜索关键词: {{ searchQuery }}</p>
    <p>页码: {{ currentPage }}</p>
  `
})
export class SearchComponent implements OnInit {
  searchQuery: string | null = null;
  currentPage: number = 1;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    // 获取查询参数
    this.searchQuery = this.route.snapshot.queryParamMap.get('q');
    this.currentPage = Number(this.route.snapshot.queryParamMap.get('page')) || 1;
    
    // 监听查询参数变化
    this.route.queryParamMap.subscribe(params => {
      this.searchQuery = params.get('q');
      this.currentPage = Number(params.get('page')) || 1;
      this.performSearch();
    });
  }
  
  private performSearch() {
    if (this.searchQuery) {
      // 执行搜索
      console.log(`搜索: ${this.searchQuery}, 页码: ${this.currentPage}`);
    }
  }
}
```

### 3. 路由数据

```typescript
// 路由配置
const routes: Routes = [
  { 
    path: 'admin', 
    component: AdminComponent,
    data: { 
      title: '管理后台',
      requiresAuth: true,
      roles: ['admin']
    }
  }
];

// 获取路由数据
@Component({
  selector: 'app-admin',
  template: `
    <h2>{{ pageTitle }}</h2>
    <p>需要认证: {{ requiresAuth }}</p>
    <p>所需角色: {{ roles.join(', ') }}</p>
  `
})
export class AdminComponent implements OnInit {
  pageTitle: string = '';
  requiresAuth: boolean = false;
  roles: string[] = [];
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    // 获取路由数据
    const data = this.route.snapshot.data;
    this.pageTitle = data['title'] || '';
    this.requiresAuth = data['requiresAuth'] || false;
    this.roles = data['roles'] || [];
  }
}
```

## 🛡️ 路由守卫

### 1. CanActivate守卫

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  }
}

// 在路由中使用
const routes: Routes = [
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  }
];
```

### 2. CanDeactivate守卫

```typescript
// unsaved-changes.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(
    component: CanComponentDeactivate
  ): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}

// 在组件中实现
@Component({...})
export class UserEditComponent implements CanComponentDeactivate {
  hasUnsavedChanges = false;
  
  canDeactivate(): boolean {
    if (this.hasUnsavedChanges) {
      return confirm('您有未保存的更改，确定要离开吗？');
    }
    return true;
  }
}
```

### 3. Resolve守卫

```typescript
// user-resolver.service.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class UserResolver implements Resolve<any> {
  constructor(private userService: UserService) {}
  
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    const userId = route.paramMap.get('id');
    return this.userService.getUser(userId!);
  }
}

// 在路由中使用
const routes: Routes = [
  { 
    path: 'user/:id', 
    component: UserDetailComponent,
    resolve: { user: UserResolver }
  }
];

// 在组件中获取解析的数据
@Component({...})
export class UserDetailComponent implements OnInit {
  user: any;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    this.user = this.route.snapshot.data['user'];
  }
}
```

## 🎮 实践练习

### 练习1：创建完整的导航系统

创建一个包含以下功能的路由系统：

- 首页、关于、联系页面
- 用户列表和详情页面
- 登录和注册页面
- 404错误页面

### 练习2：实现路由守卫

为应用添加：

- 认证守卫
- 角色权限守卫
- 未保存更改守卫
- 数据预加载守卫

## 📚 详细示例

### 完整的路由配置

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { UnsavedChangesGuard } from './guards/unsaved-changes.guard';

const routes: Routes = [
  // 首页
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  
  // 认证相关
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // 用户相关
  { 
    path: 'users', 
    component: UserListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'user/:id', 
    component: UserDetailComponent,
    canActivate: [AuthGuard],
    resolve: { user: UserResolver }
  },
  { 
    path: 'user/:id/edit', 
    component: UserEditComponent,
    canActivate: [AuthGuard],
    canDeactivate: [UnsavedChangesGuard]
  },
  
  // 管理相关
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  
  // 关于和联系
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  
  // 懒加载模块
  { 
    path: 'dashboard', 
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  
  // 404页面
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // 开发时启用路由跟踪
    scrollPositionRestoration: 'top' // 页面切换时滚动到顶部
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 导航组件

```typescript
// navigation.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <a routerLink="/home">MyApp</a>
      </div>
      
      <div class="nav-links">
        <a routerLink="/home" 
           routerLinkActive="active" 
           [routerLinkActiveOptions]="{exact: true}">
           首页
        </a>
        <a routerLink="/about" routerLinkActive="active">关于</a>
        <a routerLink="/contact" routerLinkActive="active">联系</a>
        
        <!-- 认证用户可见 -->
        <ng-container *ngIf="isAuthenticated">
          <a routerLink="/users" routerLinkActive="active">用户</a>
          <a routerLink="/dashboard" routerLinkActive="active">仪表板</a>
        </ng-container>
        
        <!-- 管理员可见 -->
        <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active">管理</a>
      </div>
      
      <div class="nav-auth">
        <ng-container *ngIf="!isAuthenticated; else userMenu">
          <a routerLink="/login">登录</a>
          <a routerLink="/register">注册</a>
        </ng-container>
        
        <ng-template #userMenu>
          <div class="user-menu">
            <span>欢迎，{{ currentUser?.name }}</span>
            <button (click)="logout()">退出</button>
          </div>
        </ng-template>
      </div>
    </nav>
  `,
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  isAuthenticated = false;
  isAdmin = false;
  currentUser: any = null;
  currentUrl = '';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    // 监听路由变化
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;
      });
    
    // 监听认证状态变化
    this.authService.authState$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
    });
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
```

### 面包屑组件

```typescript
// breadcrumb.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="breadcrumb">
      <ol>
        <li *ngFor="let item of breadcrumbs; let last = last">
          <a *ngIf="!last" [routerLink]="item.url">{{ item.label }}</a>
          <span *ngIf="last" class="current">{{ item.label }}</span>
        </li>
      </ol>
    </nav>
  `,
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];
  
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}
  
  ngOnInit() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });
  }
  
  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;
    
    if (children.length === 0) {
      return breadcrumbs;
    }
    
    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      
      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }
      
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    
    return breadcrumbs;
  }
}
```

## 🔧 高级路由功能

### 1. 懒加载模块

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
export class AppRoutingModule { }
```

### 2. 自定义预加载策略

```typescript
// custom-preloading-strategy.ts
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

// 在路由中使用
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    data: { preload: true }
  }
];
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 配置基本路由
- [ ] 实现路由导航
- [ ] 处理路由参数
- [ ] 使用路由守卫
- [ ] 实现嵌套路由
- [ ] 配置懒加载

## 🚀 下一步

完成本章节学习后，请继续学习[09-路由高级功能](./../09-advanced-routing/README.md)。
