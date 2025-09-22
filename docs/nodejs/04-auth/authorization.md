# 授权机制

## 什么是授权

授权（Authorization）是确定用户是否有权限执行特定操作或访问特定资源的过程。在身份认证确认用户身份后，授权系统决定该用户可以做什么。

认证（Who are you?）和授权（What can you do?）是两个不同但紧密相关的概念。认证解决了"用户是谁"的问题，而授权解决了"用户可以做什么"的问题。

## 授权模型

### 1. 基于角色的访问控制（RBAC）

基于角色的访问控制（Role-Based Access Control，RBAC）是最常见的授权模型之一。它通过将权限分配给角色，再将角色分配给用户，实现对资源访问的控制。

**核心概念**：

- **用户（User）**：系统的使用者
- **角色（Role）**：一组权限的集合
- **权限（Permission）**：执行特定操作的权利
- **资源（Resource）**：系统中受保护的对象

**优点**：

- 简化权限管理，减少管理开销
- 易于实现权限的批量分配和撤销
- 符合组织的结构和责任划分

```javascript
// 简单的RBAC实现示例
class RBAC {
  constructor() {
    this.roles = {};
    this.userRoles = {};
  }
  
  // 创建角色
  createRole(roleName) {
    if (!this.roles[roleName]) {
      this.roles[roleName] = new Set();
    }
  }
  
  // 为角色添加权限
  grantPermission(roleName, permission) {
    if (!this.roles[roleName]) {
      this.createRole(roleName);
    }
    this.roles[roleName].add(permission);
  }
  
  // 为用户分配角色
  assignRole(userId, roleName) {
    if (!this.userRoles[userId]) {
      this.userRoles[userId] = new Set();
    }
    this.userRoles[userId].add(roleName);
  }
  
  // 检查用户是否有权限
  hasPermission(userId, permission) {
    const userRoles = this.userRoles[userId];
    if (!userRoles) {
      return false;
    }
    
    for (const role of userRoles) {
      if (this.roles[role]?.has(permission)) {
        return true;
      }
    }
    
    return false;
  }
}

// 使用示例
const rbac = new RBAC();

// 创建角色
rbac.createRole('admin');
rbac.createRole('user');

// 分配权限
rbac.grantPermission('admin', 'read:all');
rbac.grantPermission('admin', 'write:all');
rbac.grantPermission('user', 'read:self');
rbac.grantPermission('user', 'write:self');

// 分配角色给用户
rbac.assignRole('user1', 'admin');
rbac.assignRole('user2', 'user');

// 检查权限
console.log(rbac.hasPermission('user1', 'read:all')); // true
console.log(rbac.hasPermission('user2', 'write:all')); // false
```

### 2. 基于属性的访问控制（ABAC）

基于属性的访问控制（Attribute-Based Access Control，ABAC）是一种更灵活的授权模型，它基于主体（用户）、对象（资源）、操作和环境的属性来做出授权决策。

**核心概念**：

- **主体属性**：用户的特征，如角色、部门、位置等
- **对象属性**：资源的特征，如类型、所有者、敏感度等
- **操作属性**：请求的操作类型，如读取、写入、删除等
- **环境属性**：当前环境的特征，如时间、位置、系统状态等

**优点**：

- 提供更细粒度的访问控制
- 支持复杂的授权规则
- 易于适应业务规则的变化

```javascript
// 简单的ABAC实现示例
class ABAC {
  constructor() {
    this.policies = [];
  }
  
  // 添加策略
  addPolicy(policy) {
    this.policies.push(policy);
  }
  
  // 评估请求
  evaluate(request) {
    // request包含：subject(主体), object(对象), action(操作), environment(环境)
    for (const policy of this.policies) {
      if (policy.condition(request)) {
        return policy.effect === 'allow';
      }
    }
    // 默认拒绝
    return false;
  }
}

// 使用示例
const abac = new ABAC();

// 添加策略：允许管理员在工作时间读取所有文档
abac.addPolicy({
  effect: 'allow',
  condition: (request) => {
    return request.subject.role === 'admin' &&
           request.action === 'read' &&
           request.object.type === 'document' &&
           request.environment.time >= 9 &&
           request.environment.time <= 18;
  }
});

// 添加策略：允许用户读取自己的文档
abac.addPolicy({
  effect: 'allow',
  condition: (request) => {
    return request.subject.role === 'user' &&
           request.action === 'read' &&
           request.object.type === 'document' &&
           request.subject.id === request.object.ownerId;
  }
});

// 评估请求
const request1 = {
  subject: { id: 'user1', role: 'admin' },
  object: { type: 'document', ownerId: 'user2' },
  action: 'read',
  environment: { time: 10 }
};

console.log(abac.evaluate(request1)); // true

const request2 = {
  subject: { id: 'user1', role: 'user' },
  object: { type: 'document', ownerId: 'user2' },
  action: 'read',
  environment: { time: 10 }
};

console.log(abac.evaluate(request2)); // false
```

### 3. 基于资源的访问控制（RBAC的变种）

基于资源的访问控制专注于资源的所有权和权限。常见的实现包括：

- **自主访问控制（DAC）**：资源所有者可以自行决定谁可以访问资源
- **强制访问控制（MAC）**：系统根据预定义的规则强制执行访问控制

## 授权流程

典型的授权流程包括以下步骤：

1. **认证用户**：首先确认用户的身份
2. **识别资源**：确定用户试图访问的资源
3. **检查权限**：根据授权模型检查用户是否有权限访问该资源
4. **做出决策**：允许或拒绝访问请求
5. **记录审计日志**：记录授权决策，用于审计和监控

## 权限表示方法

### 1. 字符串表示法

使用字符串来表示权限，通常采用"操作:资源"的格式。

例如：

- `read:user`：读取用户信息的权限
- `write:article`：写入文章的权限
- `delete:comment`：删除评论的权限

### 2. 位掩码表示法

使用位运算来表示和检查权限，适用于权限数量有限的场景。

```javascript
// 位掩码权限示例
const PERMISSION_READ = 1 << 0;  // 1 (二进制: 0001)
const PERMISSION_WRITE = 1 << 1; // 2 (二进制: 0010)
const PERMISSION_DELETE = 1 << 2; // 4 (二进制: 0100)
const PERMISSION_ADMIN = 1 << 3; // 8 (二进制: 1000)

// 分配权限
const userPermissions = PERMISSION_READ | PERMISSION_WRITE; // 3 (二进制: 0011)

// 检查权限
function hasPermission(userPermissions, permission) {
  return (userPermissions & permission) === permission;
}

console.log(hasPermission(userPermissions, PERMISSION_READ)); // true
console.log(hasPermission(userPermissions, PERMISSION_DELETE)); // false

// 添加权限
userPermissions |= PERMISSION_DELETE; // 7 (二进制: 0111)

// 移除权限
userPermissions &= ~PERMISSION_WRITE; // 5 (二进制: 0101)
```

### 3. 对象表示法

使用对象来表示更复杂的权限结构。

```javascript
// 对象表示法权限示例
const permissions = {
  users: {
    read: true,
    write: true,
    delete: false
  },
  articles: {
    read: true,
    write: true,
    delete: true
  },
  adminPanel: {
    access: false
  }
};

// 检查权限
function canAccess(permissions, resource, action) {
  return permissions[resource]?.[action] === true;
}

console.log(canAccess(permissions, 'users', 'read')); // true
console.log(canAccess(permissions, 'users', 'delete')); // false
```

## 授权安全最佳实践

1. **实施最小权限原则**：只授予用户完成其任务所需的最小权限
2. **定期审核权限**：定期检查和清理用户权限，移除不必要的权限
3. **分离职责**：避免将过多的权限集中在一个用户或角色上
4. **使用强认证**：结合多因素认证增强安全性
5. **记录授权日志**：记录所有权限变更和访问请求，便于审计和监控
6. **保护敏感操作**：对敏感操作实施额外的验证措施
7. **加密权限数据**：确保权限数据在存储和传输过程中的安全性

## 实践项目

创建一个基于角色的访问控制系统：

1. 设计用户、角色和权限的数据模型
2. 实现RBAC的核心功能（创建角色、分配权限、分配角色）
3. 在Express应用中集成权限检查中间件
4. 创建不同权限级别的路由和资源
5. 实现权限管理界面，用于管理用户角色和权限
6. 添加权限审计日志功能

通过这个项目，您将掌握授权系统的设计和实现方法，为构建安全的Web应用提供基础。
