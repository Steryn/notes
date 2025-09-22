# 12 - 状态管理

## 📖 学习目标

通过本章节学习，您将掌握：

- 状态管理的概念和重要性
- NgRx Store基础
- Actions、Reducers、Effects
- Selectors和DevTools
- 状态管理模式
- 与RxJS的集成

## 🎯 核心概念

### 1. 什么是状态管理？

状态管理是管理应用程序数据流和状态的模式，主要解决：

- **数据一致性**：确保应用状态的一致性
- **可预测性**：状态变化可追踪和调试
- **可维护性**：复杂状态逻辑的集中管理
- **可测试性**：状态逻辑的独立测试

### 2. 状态管理模式

```
用户操作 → Action → Reducer → Store → Selector → Component
    ↓
  Effect → 异步操作 → Action → Reducer
```

### 3. NgRx核心概念

- **Store**：应用状态的单一数据源
- **Action**：描述状态变化的纯对象
- **Reducer**：纯函数，根据Action更新状态
- **Effect**：处理副作用（如HTTP请求）
- **Selector**：从Store中选择特定数据

## 🏗️ NgRx基础

### 1. 安装和配置

```bash
# 安装NgRx
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools

# 安装RxJS（如果未安装）
npm install rxjs
```

### 2. 基本Store配置

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { counterReducer } from './store/counter.reducer';
import { CounterEffects } from './store/counter.effects';

@NgModule({
  declarations: [AppComponent],
  imports: [
    StoreModule.forRoot({ counter: counterReducer }),
    EffectsModule.forRoot([CounterEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## 🔧 Actions

### 1. 定义Actions

```typescript
// store/counter.actions.ts
import { createAction, props } from '@ngrx/store';

// 简单Action
export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const reset = createAction('[Counter] Reset');

// 带参数的Action
export const incrementBy = createAction(
  '[Counter] Increment By',
  props<{ amount: number }>()
);

export const setValue = createAction(
  '[Counter] Set Value',
  props<{ value: number }>()
);

// 异步Action
export const loadCounter = createAction('[Counter] Load');
export const loadCounterSuccess = createAction(
  '[Counter] Load Success',
  props<{ value: number }>()
);
export const loadCounterFailure = createAction(
  '[Counter] Load Failure',
  props<{ error: string }>()
);
```

### 2. 使用Actions

```typescript
// counter.component.ts
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { increment, decrement, reset, incrementBy } from '../store/counter.actions';
import { selectCount } from '../store/counter.selectors';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <h2>计数器: {{ count$ | async }}</h2>
      <button (click)="onIncrement()">增加</button>
      <button (click)="onDecrement()">减少</button>
      <button (click)="onReset()">重置</button>
      <button (click)="onIncrementBy(5)">增加5</button>
    </div>
  `
})
export class CounterComponent {
  count$: Observable<number>;

  constructor(private store: Store) {
    this.count$ = this.store.select(selectCount);
  }

  onIncrement() {
    this.store.dispatch(increment());
  }

  onDecrement() {
    this.store.dispatch(decrement());
  }

  onReset() {
    this.store.dispatch(reset());
  }

  onIncrementBy(amount: number) {
    this.store.dispatch(incrementBy({ amount }));
  }
}
```

## 🔄 Reducers

### 1. 定义Reducer

```typescript
// store/counter.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { increment, decrement, reset, incrementBy, setValue } from './counter.actions';

export interface CounterState {
  value: number;
  loading: boolean;
  error: string | null;
}

export const initialState: CounterState = {
  value: 0,
  loading: false,
  error: null
};

export const counterReducer = createReducer(
  initialState,
  on(increment, (state) => ({
    ...state,
    value: state.value + 1
  })),
  on(decrement, (state) => ({
    ...state,
    value: state.value - 1
  })),
  on(reset, (state) => ({
    ...state,
    value: 0
  })),
  on(incrementBy, (state, { amount }) => ({
    ...state,
    value: state.value + amount
  })),
  on(setValue, (state, { value }) => ({
    ...state,
    value
  }))
);
```

### 2. 复杂Reducer示例

```typescript
// store/user.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { 
  loadUsers, 
  loadUsersSuccess, 
  loadUsersFailure,
  addUser,
  updateUser,
  deleteUser
} from './user.actions';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
}

export const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null
};

export const userReducer = createReducer(
  initialState,
  on(loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false,
    error: null
  })),
  on(loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(addUser, (state, { user }) => ({
    ...state,
    users: [...state.users, user]
  })),
  on(updateUser, (state, { user }) => ({
    ...state,
    users: state.users.map(u => u.id === user.id ? user : u)
  })),
  on(deleteUser, (state, { id }) => ({
    ...state,
    users: state.users.filter(u => u.id !== id)
  }))
);
```

## ⚡ Effects

### 1. 定义Effects

```typescript
// store/counter.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CounterService } from '../services/counter.service';
import { loadCounter, loadCounterSuccess, loadCounterFailure } from './counter.actions';

@Injectable()
export class CounterEffects {
  loadCounter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCounter),
      switchMap(() =>
        this.counterService.getCounter().pipe(
          map(value => loadCounterSuccess({ value })),
          catchError(error => of(loadCounterFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private counterService: CounterService
  ) {}
}
```

### 2. 复杂Effects示例

```typescript
// store/user.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { 
  loadUsers, 
  loadUsersSuccess, 
  loadUsersFailure,
  addUser,
  addUserSuccess,
  addUserFailure
} from './user.actions';

@Injectable()
export class UserEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.userService.getUsers().pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(error => of(loadUsersFailure({ error: error.message })))
        )
      )
    )
  );

  addUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addUser),
      switchMap(({ user }) =>
        this.userService.createUser(user).pipe(
          map(newUser => addUserSuccess({ user: newUser })),
          catchError(error => of(addUserFailure({ error: error.message })))
        )
      )
    )
  );

  // 副作用：显示成功消息
  addUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addUserSuccess),
      tap(() => {
        // 显示成功消息
        console.log('用户添加成功');
      })
    ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private userService: UserService
  ) {}
}
```

## 🎯 Selectors

### 1. 基本Selectors

```typescript
// store/counter.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { CounterState } from './counter.reducer';

// 选择器函数
export const selectCounterState = createFeatureSelector<CounterState>('counter');

export const selectCount = createSelector(
  selectCounterState,
  (state: CounterState) => state.value
);

export const selectLoading = createSelector(
  selectCounterState,
  (state: CounterState) => state.loading
);

export const selectError = createSelector(
  selectCounterState,
  (state: CounterState) => state.error
);
```

### 2. 复杂Selectors

```typescript
// store/user.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUsers = createSelector(
  selectUserState,
  (state: UserState) => state.users
);

export const selectLoading = createSelector(
  selectUserState,
  (state: UserState) => state.loading
);

export const selectError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

export const selectSelectedUser = createSelector(
  selectUserState,
  (state: UserState) => state.selectedUser
);

// 派生选择器
export const selectActiveUsers = createSelector(
  selectUsers,
  (users) => users.filter(user => user.role === 'active')
);

export const selectUserCount = createSelector(
  selectUsers,
  (users) => users.length
);

// 组合选择器
export const selectUserStats = createSelector(
  selectUsers,
  selectUserCount,
  (users, count) => ({
    totalUsers: count,
    activeUsers: users.filter(u => u.role === 'active').length,
    inactiveUsers: users.filter(u => u.role === 'inactive').length
  })
);
```

## 🎮 实践练习

### 练习1：创建用户管理状态

创建一个完整的用户管理状态管理系统，包括：

- 用户列表的加载、添加、更新、删除
- 加载状态和错误处理
- 用户搜索和过滤功能

### 练习2：实现购物车状态管理

实现一个购物车状态管理系统，包括：

- 添加/删除商品
- 更新商品数量
- 计算总价
- 持久化存储

## 📚 详细示例

### 完整的用户管理应用

```typescript
// store/user.actions.ts
import { createAction, props } from '@ngrx/store';
import { User } from '../models/user';

export const loadUsers = createAction('[User] Load Users');
export const loadUsersSuccess = createAction(
  '[User] Load Users Success',
  props<{ users: User[] }>()
);
export const loadUsersFailure = createAction(
  '[User] Load Users Failure',
  props<{ error: string }>()
);

export const addUser = createAction(
  '[User] Add User',
  props<{ user: Omit<User, 'id'> }>()
);
export const addUserSuccess = createAction(
  '[User] Add User Success',
  props<{ user: User }>()
);
export const addUserFailure = createAction(
  '[User] Add User Failure',
  props<{ error: string }>()
);

export const updateUser = createAction(
  '[User] Update User',
  props<{ user: User }>()
);
export const updateUserSuccess = createAction(
  '[User] Update User Success',
  props<{ user: User }>()
);
export const updateUserFailure = createAction(
  '[User] Update User Failure',
  props<{ error: string }>()
);

export const deleteUser = createAction(
  '[User] Delete User',
  props<{ id: number }>()
);
export const deleteUserSuccess = createAction(
  '[User] Delete User Success',
  props<{ id: number }>()
);
export const deleteUserFailure = createAction(
  '[User] Delete User Failure',
  props<{ error: string }>()
);

export const selectUser = createAction(
  '[User] Select User',
  props<{ user: User }>()
);
export const clearSelectedUser = createAction('[User] Clear Selected User');

export const searchUsers = createAction(
  '[User] Search Users',
  props<{ query: string }>()
);
```

```typescript
// store/user.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { User } from '../models/user';
import * as UserActions from './user.actions';

export interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filteredUsers: User[];
}

export const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  searchQuery: '',
  filteredUsers: []
};

export const userReducer = createReducer(
  initialState,
  // 加载用户
  on(UserActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(UserActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    filteredUsers: users,
    loading: false,
    error: null
  })),
  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // 添加用户
  on(UserActions.addUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(UserActions.addUserSuccess, (state, { user }) => ({
    ...state,
    users: [...state.users, user],
    filteredUsers: [...state.filteredUsers, user],
    loading: false,
    error: null
  })),
  on(UserActions.addUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // 更新用户
  on(UserActions.updateUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(UserActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map(u => u.id === user.id ? user : u),
    filteredUsers: state.filteredUsers.map(u => u.id === user.id ? user : u),
    selectedUser: state.selectedUser?.id === user.id ? user : state.selectedUser,
    loading: false,
    error: null
  })),
  on(UserActions.updateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // 删除用户
  on(UserActions.deleteUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(UserActions.deleteUserSuccess, (state, { id }) => ({
    ...state,
    users: state.users.filter(u => u.id !== id),
    filteredUsers: state.filteredUsers.filter(u => u.id !== id),
    selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
    loading: false,
    error: null
  })),
  on(UserActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // 选择用户
  on(UserActions.selectUser, (state, { user }) => ({
    ...state,
    selectedUser: user
  })),
  on(UserActions.clearSelectedUser, (state) => ({
    ...state,
    selectedUser: null
  })),

  // 搜索用户
  on(UserActions.searchUsers, (state, { query }) => {
    const filteredUsers = state.users.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    return {
      ...state,
      searchQuery: query,
      filteredUsers
    };
  })
);
```

```typescript
// store/user.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUsers = createSelector(
  selectUserState,
  (state: UserState) => state.users
);

export const selectFilteredUsers = createSelector(
  selectUserState,
  (state: UserState) => state.filteredUsers
);

export const selectSelectedUser = createSelector(
  selectUserState,
  (state: UserState) => state.selectedUser
);

export const selectLoading = createSelector(
  selectUserState,
  (state: UserState) => state.loading
);

export const selectError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

export const selectSearchQuery = createSelector(
  selectUserState,
  (state: UserState) => state.searchQuery
);

export const selectUserCount = createSelector(
  selectFilteredUsers,
  (users) => users.length
);

export const selectUserStats = createSelector(
  selectUsers,
  (users) => ({
    total: users.length,
    active: users.filter(u => u.role === 'active').length,
    inactive: users.filter(u => u.role === 'inactive').length
  })
);
```

## 🔧 高级模式

### 1. 实体状态管理

```typescript
// store/entity.state.ts
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { User } from '../models/user';

export interface UserEntityState extends EntityState<User> {
  loading: boolean;
  error: string | null;
  selectedUserId: number | null;
}

export const userAdapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: (user: User) => user.id,
  sortComparer: (a: User, b: User) => a.name.localeCompare(b.name)
});

export const initialState: UserEntityState = userAdapter.getInitialState({
  loading: false,
  error: null,
  selectedUserId: null
});
```

### 2. 元数据状态

```typescript
// store/metadata.state.ts
export interface MetadataState {
  lastUpdated: Date | null;
  version: string;
  isLoading: boolean;
  error: string | null;
}

export const initialMetadataState: MetadataState = {
  lastUpdated: null,
  version: '1.0.0',
  isLoading: false,
  error: null
};
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 理解状态管理的概念和重要性
- [ ] 使用NgRx Store管理应用状态
- [ ] 创建和使用Actions
- [ ] 编写Reducers处理状态变化
- [ ] 使用Effects处理副作用
- [ ] 创建Selectors选择数据
- [ ] 使用DevTools调试状态

## 🚀 下一步

完成本章节学习后，请继续学习[13-RxJS与异步编程](./../13-rxjs/README.md)。
