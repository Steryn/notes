# 08 - MongoDB安全与权限管理

## 🎯 学习目标

- 理解MongoDB安全机制和最佳实践
- 掌握用户认证和授权管理
- 学会配置网络安全和加密
- 熟悉安全监控和审计

## 🔐 安全基础

### 1. MongoDB安全层次

MongoDB安全包含多个层次：

- 🔑 **认证 (Authentication)** - 验证用户身份
- 🛡️ **授权 (Authorization)** - 控制用户权限
- 🌐 **网络安全** - 保护网络通信
- 🔒 **数据加密** - 保护数据安全
- 📊 **审计日志** - 记录安全事件

### 2. 安全威胁类型

**常见安全威胁：**

- 🚫 **未授权访问** - 没有认证的用户访问
- 🔓 **权限提升** - 用户获得超出权限的访问
- 🌐 **网络攻击** - 中间人攻击、DDoS等
- 💾 **数据泄露** - 敏感数据被窃取
- 🦠 **恶意软件** - 病毒、木马等

## 👤 用户认证

### 1. 启用认证

```javascript
// 启动MongoDB时启用认证
mongod --auth

// 或在配置文件中启用
security:
  authorization: enabled
```

### 2. 创建管理员用户

```javascript
// 连接到MongoDB（无认证模式）
mongosh

// 切换到admin数据库
use admin

// 创建管理员用户
db.createUser({
  user: "admin",
  pwd: "admin123",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

// 验证用户创建
db.getUsers()
```

### 3. 创建应用用户

```javascript
// 切换到应用数据库
use myapp

// 创建应用用户
db.createUser({
  user: "appuser",
  pwd: "app123",
  roles: [
    { role: "readWrite", db: "myapp" }
  ]
})

// 创建只读用户
db.createUser({
  user: "readonly",
  pwd: "read123",
  roles: [
    { role: "read", db: "myapp" }
  ]
})
```

### 4. 用户管理

```javascript
// 查看所有用户
db.getUsers()

// 查看特定用户
db.getUser("appuser")

// 更新用户密码
db.changeUserPassword("appuser", "newpassword")

// 更新用户角色
db.updateUser("appuser", {
  roles: [
    { role: "readWrite", db: "myapp" },
    { role: "read", db: "reports" }
  ]
})

// 删除用户
db.dropUser("appuser")
```

## 🛡️ 角色和权限

### 1. 内置角色

**数据库级角色：**

- `read` - 只读权限
- `readWrite` - 读写权限
- `dbAdmin` - 数据库管理权限
- `userAdmin` - 用户管理权限
- `dbOwner` - 数据库所有者权限

**集群级角色：**

- `clusterAdmin` - 集群管理权限
- `clusterManager` - 集群管理权限
- `clusterMonitor` - 集群监控权限
- `hostManager` - 主机管理权限

**备份和恢复角色：**

- `backup` - 备份权限
- `restore` - 恢复权限

### 2. 自定义角色

```javascript
// 创建自定义角色
use admin
db.createRole({
  role: "customRole",
  privileges: [
    {
      resource: { db: "myapp", collection: "users" },
      actions: ["find", "insert", "update"]
    },
    {
      resource: { db: "myapp", collection: "orders" },
      actions: ["find"]
    }
  ],
  roles: []
})

// 将角色分配给用户
use myapp
db.grantRolesToUser("appuser", ["customRole"])

// 撤销用户角色
db.revokeRolesFromUser("appuser", ["customRole"])
```

### 3. 权限管理

```javascript
// 查看角色权限
db.getRole("readWrite", { showPrivileges: true })

// 查看用户权限
db.getUser("appuser", { showPrivileges: true })

// 查看所有角色
db.getRoles()

// 删除自定义角色
db.dropRole("customRole")
```

## 🌐 网络安全

### 1. 网络绑定

```yaml
# 配置文件中的网络设置
net:
  port: 27017
  bindIp: 127.0.0.1  # 只绑定本地IP
  # bindIp: 0.0.0.0  # 绑定所有IP（不推荐）
  maxIncomingConnections: 100
  wireObjectCheck: true
  ipv6: false
```

### 2. 防火墙配置

```bash
# Linux防火墙配置
# 只允许特定IP访问MongoDB
sudo ufw allow from 192.168.1.0/24 to any port 27017
sudo ufw deny 27017

# 或使用iptables
sudo iptables -A INPUT -p tcp --dport 27017 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 27017 -j DROP
```

### 3. SSL/TLS加密

```yaml
# 配置文件中的SSL设置
net:
  ssl:
    mode: requireSSL
    PEMKeyFile: /path/to/mongodb.pem
    CAFile: /path/to/ca.pem
    allowConnectionsWithoutCertificates: false
    allowInvalidCertificates: false
    allowInvalidHostnames: false
```

### 4. 连接字符串

```javascript
// 使用SSL连接
mongosh "mongodb://username:password@host:27017/database?ssl=true"

// 使用SSL和认证
mongosh "mongodb://username:password@host:27017/database?ssl=true&authSource=admin"
```

## 🔒 数据加密

### 1. 传输加密

```javascript
// 生成SSL证书
openssl req -newkey rsa:2048 -new -x509 -days 365 -nodes -out mongodb.crt -keyout mongodb.key
cat mongodb.key mongodb.crt > mongodb.pem
```

### 2. 存储加密

```yaml
# 配置文件中的加密设置
security:
  enableEncryption: true
  encryptionKeyFile: /path/to/encryption.key
  encryptionCipherMode: AES256-CBC
```

### 3. 字段级加密

```javascript
// 使用客户端字段级加密
const { ClientEncryption } = require('mongodb-client-encryption');

const clientEncryption = new ClientEncryption(client, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    local: {
      key: Buffer.from('your-32-byte-key-here')
    }
  }
});

// 加密字段
const encryptedField = await clientEncryption.encrypt('sensitive-data', {
  algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
  keyId: keyId
});
```

## 📊 安全监控

### 1. 审计日志

```yaml
# 配置文件中的审计设置
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
  filter: '{ atype: { $in: ["authenticate", "authorize"] } }'
```

### 2. 安全事件监控

```javascript
// 查看认证失败
db.system.profile.find({
  "command.authenticate": { $exists: true },
  "command.authenticationDatabase": { $exists: true }
})

// 查看权限检查
db.system.profile.find({
  "command.authorize": { $exists: true }
})
```

### 3. 安全配置检查

```javascript
// 检查安全配置
db.runCommand({ connectionStatus: 1 })

// 检查用户权限
db.runCommand({ usersInfo: 1 })

// 检查角色权限
db.runCommand({ rolesInfo: 1 })
```

## 🛠️ 实践练习

### 练习1：用户认证配置

1. 启用MongoDB认证
2. 创建管理员用户
3. 创建应用用户和只读用户
4. 测试用户权限
5. 配置用户密码策略

### 练习2：权限管理

1. 创建自定义角色
2. 分配角色给用户
3. 测试权限控制
4. 实现最小权限原则
5. 管理用户生命周期

### 练习3：网络安全

1. 配置网络绑定
2. 设置防火墙规则
3. 配置SSL/TLS加密
4. 测试安全连接
5. 监控网络访问

## ❓ 常见问题

### Q: 如何重置MongoDB管理员密码？

A: 1. 以无认证模式启动MongoDB 2. 连接到admin数据库 3. 更新用户密码 4. 重启MongoDB启用认证

### Q: 如何实现数据库级别的权限控制？

A: 使用数据库级角色，为不同数据库创建不同的用户和角色。

### Q: SSL证书过期怎么办？

A: 1. 生成新的SSL证书 2. 更新配置文件 3. 重启MongoDB服务 4. 更新客户端连接字符串

### Q: 如何监控安全事件？

A: 启用审计日志，使用监控工具，定期检查日志文件。

### Q: 如何实现高可用性的安全配置？

A: 使用副本集，配置SSL，设置防火墙，定期备份，监控安全事件。

## ⚠️ 注意事项

1. **密码安全** - 使用强密码，定期更换
2. **权限最小化** - 只授予必要的权限
3. **网络安全** - 限制网络访问，使用SSL加密
4. **定期审计** - 定期检查用户权限和安全配置
5. **备份安全** - 保护备份数据的安全

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 配置MongoDB用户认证
- [ ] 管理用户角色和权限
- [ ] 配置网络安全设置
- [ ] 实现数据加密
- [ ] 监控安全事件

---

**下一步：** 学习 [09-performance](./09-performance.md) 性能调优
