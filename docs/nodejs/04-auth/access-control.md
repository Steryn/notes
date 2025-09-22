# 权限控制

## 什么是权限控制

权限控制（Access Control）是一种安全机制，用于确定谁可以访问系统中的哪些资源，以及在什么条件下可以访问。它是保护系统资源不被未经授权访问的重要手段，也是实现最小权限原则的关键技术。

## 权限控制的类型

### 1. 自主访问控制（DAC）

自主访问控制（Discretionary Access Control，DAC）允许资源所有者自行决定谁可以访问其资源以及访问的权限级别。资源所有者具有完全的控制权，可以自主地授予或撤销其他用户的访问权限。

**优点**：

- 灵活性高，易于实现
- 用户可以根据需要共享资源

**缺点**：

- 安全性较低，依赖于用户的安全意识
- 难以管理大型系统中的权限

```javascript
// 简单的DAC实现示例
class DACSystem {
  constructor() {
    // 存储资源的访问控制列表（ACL）
    this.acls = new Map();
  }
  
  // 创建资源并设置所有者
  createResource(resourceId, ownerId) {
    this.acls.set(resourceId, {
      owner: ownerId,
      permissions: new Map() // 用户ID => 权限集合
    });
  }
  
  // 授予权限
  grantPermission(resourceId, userId, permission) {
    const acl = this.acls.get(resourceId);
    if (!acl) {
      throw new Error('资源不存在');
    }
    
    // 只有所有者可以授予权限
    if (acl.owner !== userId) {
      throw new Error('只有资源所有者可以授予权限');
    }
    
    if (!acl.permissions.has(userId)) {
      acl.permissions.set(userId, new Set());
    }
    acl.permissions.get(userId).add(permission);
  }
  
  // 检查权限
  checkPermission(resourceId, userId, permission) {
    const acl = this.acls.get(resourceId);
    if (!acl) {
      return false;
    }
    
    // 所有者拥有所有权限
    if (acl.owner === userId) {
      return true;
    }
    
    // 检查用户是否被授予了相应的权限
    const userPermissions = acl.permissions.get(userId);
    return userPermissions && userPermissions.has(permission);
  }
}

// 使用示例
const dac = new DACSystem();

dac.createResource('document1', 'user1');
dac.grantPermission('document1', 'user1', 'user2', 'read');
dac.grantPermission('document1', 'user1', 'user3', 'write');

console.log(dac.checkPermission('document1', 'user2', 'read')); // true
console.log(dac.checkPermission('document1', 'user2', 'write')); // false
console.log(dac.checkPermission('document1', 'user3', 'write')); // true
```

### 2. 强制访问控制（MAC）

强制访问控制（Mandatory Access Control，MAC）是一种由系统管理员或安全策略强制执行的访问控制机制。在MAC系统中，每个用户和资源都被分配了安全标签（如安全级别），访问决策基于预设的安全策略，不受用户或资源所有者的控制。

**优点**：

- 安全性高，严格强制执行安全策略
- 适合处理敏感信息的系统

**缺点**：

- 灵活性低，管理复杂
- 可能影响用户体验

```javascript
// 简单的MAC实现示例
class MACSystem {
  constructor() {
    // 定义安全级别（从低到高）
    this.securityLevels = ['公开', '内部', '机密', '最高机密'];
    // 存储用户和资源的安全标签
    this.userLabels = new Map();
    this.resourceLabels = new Map();
  }
  
  // 设置用户安全标签
  setUserLabel(userId, label) {
    if (!this.securityLevels.includes(label)) {
      throw new Error('无效的安全标签');
    }
    this.userLabels.set(userId, label);
  }
  
  // 设置资源安全标签
  setResourceLabel(resourceId, label) {
    if (!this.securityLevels.includes(label)) {
      throw new Error('无效的安全标签');
    }
    this.resourceLabels.set(resourceId, label);
  }
  
  // 检查访问权限（基于多级安全模型）
  checkAccess(userId, resourceId, operation) {
    const userLabel = this.userLabels.get(userId);
    const resourceLabel = this.resourceLabels.get(resourceId);
    
    if (!userLabel || !resourceLabel) {
      return false;
    }
    
    const userLevelIndex = this.securityLevels.indexOf(userLabel);
    const resourceLevelIndex = this.securityLevels.indexOf(resourceLabel);
    
    // 读取操作：用户级别必须大于等于资源级别
    // 写入操作：用户级别必须等于资源级别
    if (operation === 'read') {
      return userLevelIndex >= resourceLevelIndex;
    } else if (operation === 'write') {
      return userLevelIndex === resourceLevelIndex;
    }
    
    return false;
  }
}

// 使用示例
const mac = new MACSystem();

// 设置用户安全标签
mac.setUserLabel('user1', '最高机密');
mac.setUserLabel('user2', '内部');

// 设置资源安全标签
mac.setResourceLabel('doc1', '机密');
mac.setResourceLabel('doc2', '内部');

console.log(mac.checkAccess('user1', 'doc1', 'read')); // true
console.log(mac.checkAccess('user1', 'doc1', 'write')); // false
console.log(mac.checkAccess('user2', 'doc1', 'read')); // false
console.log(mac.checkAccess('user2', 'doc2', 'write')); // true
```

### 3. 基于角色的访问控制（RBAC）

基于角色的访问控制（Role-Based Access Control，RBAC）是一种通过角色来管理用户权限的访问控制机制。在RBAC系统中，权限被分配给角色，用户通过被分配的角色获得相应的权限。

**优点**：

- 简化权限管理，减少管理开销
- 符合组织的结构和责任划分
- 易于实现权限的批量分配和撤销

**缺点**：

- 角色定义和维护可能比较复杂
- 在某些情况下可能不够灵活

```javascript
// 更完整的RBAC实现示例
class RBACSystem {
  constructor() {
    this.roles = new Map(); // 角色ID => 权限集合
    this.userRoles = new Map(); // 用户ID => 角色ID集合
  }
  
  // 创建角色
  createRole(roleId) {
    if (!this.roles.has(roleId)) {
      this.roles.set(roleId, new Set());
    }
  }
  
  // 为角色添加权限
  addPermissionToRole(roleId, permission) {
    if (!this.roles.has(roleId)) {
      this.createRole(roleId);
    }
    this.roles.get(roleId).add(permission);
  }
  
  // 为用户分配角色
  assignRoleToUser(userId, roleId) {
    if (!this.roles.has(roleId)) {
      throw new Error('角色不存在');
    }
    
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    this.userRoles.get(userId).add(roleId);
  }
  
  // 检查用户是否有特定权限
  hasPermission(userId, permission) {
    const roles = this.userRoles.get(userId);
    if (!roles) {
      return false;
    }
    
    // 检查用户的任何一个角色是否拥有该权限
    for (const roleId of roles) {
      const rolePermissions = this.roles.get(roleId);
      if (rolePermissions && rolePermissions.has(permission)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 获取用户的所有权限
  getUserPermissions(userId) {
    const roles = this.userRoles.get(userId);
    const permissions = new Set();
    
    if (roles) {
      for (const roleId of roles) {
        const rolePermissions = this.roles.get(roleId);
        if (rolePermissions) {
          rolePermissions.forEach(perm => permissions.add(perm));
        }
      }
    }
    
    return Array.from(permissions);
  }
}

// 使用示例
const rbac = new RBACSystem();

// 创建角色
rbac.createRole('admin');
rbac.createRole('editor');
rbac.createRole('viewer');

// 为角色添加权限
rbac.addPermissionToRole('admin', 'create:user');
rbac.addPermissionToRole('admin', 'read:user');
rbac.addPermissionToRole('admin', 'update:user');
rbac.addPermissionToRole('admin', 'delete:user');
rbac.addPermissionToRole('editor', 'create:article');
rbac.addPermissionToRole('editor', 'read:article');
rbac.addPermissionToRole('editor', 'update:article');
rbac.addPermissionToRole('viewer', 'read:article');

// 为用户分配角色
rbac.assignRoleToUser('user1', 'admin');
rbac.assignRoleToUser('user2', 'editor');
rbac.assignRoleToUser('user2', 'viewer');
rbac.assignRoleToUser('user3', 'viewer');

// 检查权限
console.log(rbac.hasPermission('user1', 'create:user')); // true
console.log(rbac.hasPermission('user2', 'update:article')); // true
console.log(rbac.hasPermission('user3', 'create:article')); // false

// 获取用户的所有权限
console.log(rbac.getUserPermissions('user2'));
// ['create:article', 'read:article', 'update:article']
```

### 4. 基于属性的访问控制（ABAC）

基于属性的访问控制（Attribute-Based Access Control，ABAC）是一种更灵活的访问控制机制，它基于主体（用户）、对象（资源）、操作和环境的属性来做出访问决策。

**优点**：

- 提供更细粒度的访问控制
- 支持复杂的授权规则
- 易于适应业务规则的变化

**缺点**：

- 实现复杂，性能开销较大
- 规则管理可能比较困难

```javascript
// 简单的ABAC实现示例
class ABACSystem {
  constructor() {
    this.policies = [];
  }
  
  // 添加访问控制策略
  addPolicy(policy) {
    this.policies.push(policy);
  }
  
  // 评估访问请求
  evaluateAccess(request) {
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
const abac = new ABACSystem();

// 添加策略
abac.addPolicy({
  name: '员工只能访问自己的工资信息',
  effect: 'allow',
  condition: (request) => {
    return request.subject.role === 'employee' &&
           request.object.type === 'salary' &&
           request.action === 'read' &&
           request.subject.id === request.object.employeeId;
  }
});

abac.addPolicy({
  name: '经理可以访问其部门员工的工资信息',
  effect: 'allow',
  condition: (request) => {
    return request.subject.role === 'manager' &&
           request.object.type === 'salary' &&
           request.action === 'read' &&
           request.subject.department === request.object.department;
  }
});

abac.addPolicy({
  name: 'HR可以访问所有员工的工资信息',
  effect: 'allow',
  condition: (request) => {
    return request.subject.role === 'hr' &&
           request.object.type === 'salary' &&
           request.action === 'read';
  }
});

// 评估访问请求
const request1 = {
  subject: { id: '1001', role: 'employee', department: 'engineering' },
  object: { type: 'salary', employeeId: '1001', department: 'engineering' },
  action: 'read',
  environment: { time: '09:30', date: '2023-05-15' }
};

const request2 = {
  subject: { id: '2001', role: 'manager', department: 'engineering' },
  object: { type: 'salary', employeeId: '1001', department: 'engineering' },
  action: 'read',
  environment: { time: '14:15', date: '2023-05-15' }
};

const request3 = {
  subject: { id: '1001', role: 'employee', department: 'engineering' },
  object: { type: 'salary', employeeId: '1002', department: 'engineering' },
  action: 'read',
  environment: { time: '16:45', date: '2023-05-15' }
};

console.log(abac.evaluateAccess(request1)); // true
console.log(abac.evaluateAccess(request2)); // true
console.log(abac.evaluateAccess(request3)); // false
```

## 权限控制的实现方式

### 1. 中间件实现

在Express等Web框架中，可以使用中间件来实现权限控制。

```javascript
// Express中的权限控制中间件
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    // 检查用户是否已认证
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }
    
    // 检查用户是否有足够的权限
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    next();
  };
}

// 使用权限控制中间件保护路由
app.get('/api/users', checkPermission('read:users'), async (req, res) => {
  // 处理请求...
});

app.post('/api/users', checkPermission('create:users'), async (req, res) => {
  // 处理请求...
});

app.put('/api/users/:id', checkPermission('update:users'), async (req, res) => {
  // 处理请求...
});

app.delete('/api/users/:id', checkPermission('delete:users'), async (req, res) => {
  // 处理请求...
});
```

### 2. 数据库级权限控制

除了应用级别的权限控制，还可以在数据库级别实施权限控制。

**MySQL数据库权限控制示例**：

```sql
-- 创建具有只读权限的用户
CREATE USER 'readonly_user'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON database_name.* TO 'readonly_user'@'localhost';

-- 创建具有读写权限的用户
CREATE USER 'readwrite_user'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON database_name.* TO 'readwrite_user'@'localhost';

-- 创建具有管理权限的用户
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON database_name.* TO 'admin_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 3. API网关权限控制

在微服务架构中，可以使用API网关来集中管理权限控制。

```javascript
// 简单的API网关权限控制示例
class APIGateway {
  constructor() {
    this.routes = new Map();
  }
  
  // 注册路由和所需权限
  registerRoute(path, method, requiredPermission, handler) {
    const routeKey = `${method}:${path}`;
    this.routes.set(routeKey, {
      requiredPermission,
      handler
    });
  }
  
  // 处理请求
  async handleRequest(req) {
    const routeKey = `${req.method}:${req.path}`;
    const route = this.routes.get(routeKey);
    
    if (!route) {
      return { status: 404, body: { message: '路由不存在' } };
    }
    
    // 检查权限
    if (route.requiredPermission && (!req.user || !req.user.permissions.includes(route.requiredPermission))) {
      return { status: 403, body: { message: '权限不足' } };
    }
    
    // 处理请求
    try {
      const result = await route.handler(req);
      return { status: 200, body: result };
    } catch (error) {
      return { status: 500, body: { message: error.message } };
    }
  }
}

// 使用示例
const gateway = new APIGateway();

// 注册路由
gateway.registerRoute('/api/users', 'GET', 'read:users', async (req) => {
  // 获取用户列表
  return { users: [{ id: 1, name: '张三' }, { id: 2, name: '李四' }] };
});

gateway.registerRoute('/api/users', 'POST', 'create:users', async (req) => {
  // 创建用户
  return { success: true, userId: 3 };
});

// 处理请求
const request = {
  method: 'GET',
  path: '/api/users',
  user: { id: 1, permissions: ['read:users'] }
};

const response = await gateway.handleRequest(request);
console.log(response);
```

## 权限控制最佳实践

1. **实施最小权限原则**：只授予用户完成其任务所需的最小权限
2. **分层实施权限控制**：在多个层面（应用层、数据库层、网络层）实施权限控制
3. **定期审核权限**：定期检查和清理用户权限，移除不必要的权限
4. **使用角色管理权限**：通过角色而非直接向用户分配权限，简化权限管理
5. **记录权限变更日志**：记录所有权限变更，便于审计和追踪
6. **实施权限分离**：避免将过多的权限集中在一个用户或角色上
7. **使用安全的会话管理**：确保会话的安全性，防止会话劫持
8. **加密敏感数据**：对敏感数据进行加密存储和传输
9. **实施API访问控制**：对API接口实施严格的访问控制
10. **持续监控和审计**：持续监控权限使用情况，及时发现异常行为

## 实践项目

创建一个完整的权限控制系统：

1. 设计权限数据模型，包括用户、角色、权限和资源
2. 实现RBAC系统的核心功能
3. 在Express应用中集成权限控制中间件
4. 创建不同权限级别的API路由
5. 实现权限管理界面，用于管理用户角色和权限
6. 添加权限审计日志功能
7. 实施数据级别的权限控制

通过这个项目，您将掌握权限控制的设计和实现方法，为构建安全的Web应用提供基础。
