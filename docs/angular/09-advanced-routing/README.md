# 09 - 路由高级功能

## 📖 学习目标

通过本章节学习，您将掌握：

- 高级路由守卫
- 路由解析器
- 懒加载策略
- 预加载策略
- 路由动画
- 面包屑导航
- 路由元数据

## 🎯 核心概念

### 1. 高级路由特性

- **路由守卫**：控制路由访问权限
- **路由解析器**：预加载数据
- **懒加载**：按需加载模块
- **预加载**：提前加载模块
- **路由动画**：页面切换动画
- **元数据**：路由配置信息

### 2. 路由生命周期

```
路由匹配 → 守卫检查 → 解析器执行 → 组件加载 → 动画执行
```

## 🛡️ 高级路由守卫

### 1. CanActivate守卫

```typescript
// guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        return true;
      } else {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    });
  }
}
```

### 2. CanActivateChild守卫

```typescript
// guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAdmin()) {
      return true;
    } else {
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
```

### 3. CanDeactivate守卫

```typescript
// guards/unsaved-changes.guard.ts
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

### 4. CanLoad守卫

```typescript
// guards/module-load.guard.ts
import { Injectable } from '@angular/core';
import { CanLoad, Route, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ModuleLoadGuard implements CanLoad {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canLoad(route: Route): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

## 🔍 路由解析器

### 1. 基本解析器

```typescript
// resolvers/user.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserResolver implements Resolve<User> {
  constructor(private userService: UserService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<User> | Promise<User> | User {
    const userId = route.paramMap.get('id');
    if (userId) {
      return this.userService.getUser(+userId);
    } else {
      throw new Error('User ID is required');
    }
  }
}
```

### 2. 复杂解析器

```typescript
// resolvers/user-detail.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';

export interface UserDetailData {
  user: any;
  posts: any[];
  comments: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserDetailResolver implements Resolve<UserDetailData> {
  constructor(
    private userService: UserService,
    private postService: PostService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UserDetailData> {
    const userId = route.paramMap.get('id');
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    return forkJoin({
      user: this.userService.getUser(+userId),
      posts: this.postService.getUserPosts(+userId),
      comments: this.postService.getUserComments(+userId)
    }).pipe(
      catchError(error => {
        console.error('Error loading user detail:', error);
        return of({
          user: null,
          posts: [],
          comments: []
        });
      })
    );
  }
}
```

### 3. 使用解析器

```typescript
// 路由配置
const routes: Routes = [
  {
    path: 'user/:id',
    component: UserDetailComponent,
    resolve: { 
      user: UserResolver,
      userDetail: UserDetailResolver 
    }
  }
];

// 在组件中获取解析的数据
@Component({...})
export class UserDetailComponent implements OnInit {
  user: any;
  userDetail: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // 获取解析的数据
    this.user = this.route.snapshot.data['user'];
    this.userDetail = this.route.snapshot.data['userDetail'];

    // 或者监听数据变化
    this.route.data.subscribe(data => {
      this.user = data['user'];
      this.userDetail = data['userDetail'];
    });
  }
}
```

## 🚀 懒加载策略

### 1. 基本懒加载

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
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)
  }
];
```

### 2. 自定义预加载策略

```typescript
// strategies/custom-preloading.strategy.ts
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
      console.log('Preloading: ' + route.path);
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

### 3. 条件预加载策略

```typescript
// strategies/conditional-preloading.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConditionalPreloadingStrategy implements PreloadingStrategy {
  constructor(private authService: AuthService) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // 根据用户权限决定是否预加载
    if (route.data && route.data['preload']) {
      const requiredRole = route.data['role'];
      
      if (!requiredRole || this.authService.hasRole(requiredRole)) {
        console.log('Preloading: ' + route.path);
        return load();
      }
    }
    return of(null);
  }
}
```

## 🎨 路由动画

### 1. 基本路由动画

```typescript
// animations/route.animations.ts
import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'translateY(20px)'
      })
    ], { optional: true }),
    
    query(':enter', [
      animate('300ms ease-in', style({
        opacity: 1,
        transform: 'translateY(0)'
      }))
    ], { optional: true })
  ])
]);
```

### 2. 复杂路由动画

```typescript
// animations/slide.animations.ts
import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const slideInAnimation = trigger('slideInAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))
      ], { optional: true }),
      
      query(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(-100%)' }))
      ], { optional: true })
    ])
  ])
]);
```

### 3. 使用路由动画

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { slideInAnimation } from './animations/slide.animations';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="navbar">
        <a routerLink="/home" routerLinkActive="active">首页</a>
        <a routerLink="/about" routerLinkActive="active">关于</a>
        <a routerLink="/contact" routerLinkActive="active">联系</a>
      </nav>
      
      <main class="main-content" [@slideInAnimation]="getRouteAnimationData()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  animations: [slideInAnimation]
})
export class AppComponent {
  getRouteAnimationData() {
    return this.router.routerState.root.firstChild?.snapshot.data?.['animation'];
  }
}
```

## 🧭 面包屑导航

### 1. 面包屑服务

```typescript
// services/breadcrumb.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        const breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
        this.breadcrumbsSubject.next(breadcrumbs);
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
        breadcrumbs.push({
          label,
          url,
          icon: child.snapshot.data['icon']
        });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
```

### 2. 面包屑组件

```typescript
// components/breadcrumb.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BreadcrumbService, BreadcrumbItem } from '../services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="breadcrumb" *ngIf="breadcrumbs$ | async as breadcrumbs">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item" *ngFor="let item of breadcrumbs; let last = last">
          <a *ngIf="!last" [routerLink]="item.url" class="breadcrumb-link">
            <i *ngIf="item.icon" [class]="item.icon"></i>
            {{ item.label }}
          </a>
          <span *ngIf="last" class="breadcrumb-current">
            <i *ngIf="item.icon" [class]="item.icon"></i>
            {{ item.label }}
          </span>
        </li>
      </ol>
    </nav>
  `,
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs$: Observable<BreadcrumbItem[]>;

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
  }
}
```

### 3. 路由配置面包屑

```typescript
// 路由配置
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { breadcrumb: '仪表板', icon: 'fas fa-tachometer-alt' }
  },
  {
    path: 'users',
    component: UserListComponent,
    data: { breadcrumb: '用户管理', icon: 'fas fa-users' },
    children: [
      {
        path: ':id',
        component: UserDetailComponent,
        data: { breadcrumb: '用户详情', icon: 'fas fa-user' }
      }
    ]
  }
];
```

## 🎮 实践练习

### 练习1：实现完整的权限系统

创建一个完整的权限系统，包括：

- 基于角色的访问控制
- 路由守卫保护
- 动态菜单显示
- 权限验证服务

### 练习2：实现复杂的导航系统

创建一个复杂的导航系统，包括：

- 面包屑导航
- 路由动画
- 懒加载模块
- 预加载策略

## 📚 详细示例

### 完整的路由配置

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UnsavedChangesGuard } from './guards/unsaved-changes.guard';
import { UserResolver } from './resolvers/user.resolver';
import { CustomPreloadingStrategy } from './strategies/custom-preloading.strategy';

const routes: Routes = [
  // 首页
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    component: HomeComponent,
    data: { 
      breadcrumb: '首页',
      icon: 'fas fa-home',
      animation: 'home'
    }
  },

  // 认证相关
  { 
    path: 'login', 
    component: LoginComponent,
    data: { 
      breadcrumb: '登录',
      animation: 'login'
    }
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    data: { 
      breadcrumb: '注册',
      animation: 'register'
    }
  },

  // 用户相关（需要认证）
  { 
    path: 'profile', 
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard],
    data: { 
      preload: true,
      breadcrumb: '个人资料'
    }
  },

  // 管理相关（需要管理员权限）
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, AdminGuard],
    canActivateChild: [AdminGuard],
    data: { 
      preload: false,
      role: 'admin',
      breadcrumb: '管理后台'
    }
  },

  // 用户详情（使用解析器）
  { 
    path: 'user/:id', 
    component: UserDetailComponent,
    canActivate: [AuthGuard],
    resolve: { user: UserResolver },
    data: { 
      breadcrumb: '用户详情',
      animation: 'user-detail'
    }
  },

  // 用户编辑（使用CanDeactivate守卫）
  { 
    path: 'user/:id/edit', 
    component: UserEditComponent,
    canActivate: [AuthGuard],
    canDeactivate: [UnsavedChangesGuard],
    resolve: { user: UserResolver },
    data: { 
      breadcrumb: '编辑用户',
      animation: 'user-edit'
    }
  },

  // 懒加载模块
  { 
    path: 'dashboard', 
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: { 
      preload: true,
      breadcrumb: '仪表板'
    }
  },

  // 404页面
  { 
    path: '**', 
    component: NotFoundComponent,
    data: { 
      breadcrumb: '页面未找到'
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: CustomPreloadingStrategy,
    enableTracing: false, // 开发时启用路由跟踪
    scrollPositionRestoration: 'top', // 页面切换时滚动到顶部
    anchorScrolling: 'enabled', // 启用锚点滚动
    onSameUrlNavigation: 'reload' // 相同URL时重新加载
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 使用高级路由守卫
- [ ] 创建和使用路由解析器
- [ ] 实现懒加载和预加载
- [ ] 添加路由动画
- [ ] 实现面包屑导航
- [ ] 配置路由元数据
- [ ] 处理复杂的路由场景

## 🚀 下一步

完成本章节学习后，请继续学习[10-模板驱动表单](./../10-template-forms/README.md)。
