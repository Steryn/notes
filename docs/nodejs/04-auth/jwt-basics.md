# JWT基础

## 什么是JWT

JWT（JSON Web Token）是一种用于安全地传输信息的标准，它使用JSON对象作为数据交换的载体。JWT通常用于身份验证和授权系统，允许在各方之间安全地传输信息，因为这些信息经过了数字签名，可以被验证和信任。

## JWT的结构

一个完整的JWT由三部分组成，它们之间用点（.）分隔：

```
xxxxx.yyyyy.zzzzz
```

这三部分分别是：

1. **Header（头部）**：包含令牌类型和使用的签名算法
2. **Payload（负载）**：包含声明（claims），即要传输的信息
3. **Signature（签名）**：用于验证令牌的真实性和完整性

### 1. Header

头部通常包含两部分信息：令牌类型（typ）和使用的签名算法（alg）。

```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

然后，这个JSON对象会被Base64Url编码，形成JWT的第一部分。

### 2. Payload

负载包含声明（claims），声明是关于实体（通常是用户）和其他数据的声明。JWT定义了三种类型的声明：

- **Registered claims（注册声明）**：预定义的声明，不是强制性的，但推荐使用
- **Public claims（公共声明）**：可以由使用JWT的人随意定义，但为了避免冲突，应该在IANA JSON Web Token Registry中定义，或者使用包含命名空间的URI
- **Private claims（私有声明）**：为特定应用程序创建的自定义声明，这些声明不会与其他方共享

一个典型的payload可能如下所示：

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

这个JSON对象也会被Base64Url编码，形成JWT的第二部分。

### 3. Signature

签名用于验证消息在传输过程中没有被篡改，并且，对于使用私钥签名的令牌，可以验证消息的发送者是否为其声称的发送者。

要创建签名，需要获取编码后的头部、编码后的负载、一个密钥，然后使用头部中指定的算法进行签名。

例如，使用HMAC SHA256算法的签名创建过程如下：

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

然后，这个签名会被添加到JWT的第三部分。

## JWT的工作流程

JWT的典型工作流程如下：

1. **用户登录**：用户提供其凭证（如用户名和密码）
2. **服务器验证**：服务器验证用户凭证的有效性
3. **生成JWT**：验证成功后，服务器生成一个JWT并返回给客户端
4. **客户端存储JWT**：客户端存储JWT（通常存储在localStorage、sessionStorage或cookie中）
5. **发送请求**：客户端在后续请求中通过Authorization头部或其他方式发送JWT
6. **服务器验证JWT**：服务器验证JWT的有效性
7. **处理请求**：验证成功后，服务器处理请求并返回相应的资源

## JWT的优缺点

### 优点

1. **无状态**：服务器不需要存储会话信息，减轻了服务器的负担
2. **可扩展性**：易于在分布式系统中实现
3. **安全性**：可以通过签名来验证令牌的真实性和完整性
4. **跨语言支持**：几乎所有主流编程语言都支持JWT
5. **自包含**：令牌中包含了所有必要的信息，减少了数据库查询
6. **适合移动应用**：易于在移动应用中实现认证

### 缺点

1. **令牌无法撤销**：一旦令牌颁发，在过期前难以撤销
2. **令牌大小**：令牌可能包含较多信息，导致HTTP请求头变大
3. **安全存储**：客户端需要安全地存储令牌，防止XSS和CSRF攻击
4. **敏感信息**：不应该在令牌中存储敏感信息，因为payload是可解码的

## JWT的使用场景

### 1. 认证

JWT最常见的用途是用于认证。一旦用户登录，后续的每个请求都将包含JWT，允许用户访问该令牌允许的路由、服务和资源。

### 2. 授权

JWT也可以用于授权。例如，根据令牌中包含的权限信息，可以决定用户是否有权限访问特定的资源。

### 3. 信息交换

JWT可以安全地在各方之间传输信息，因为JWT可以被签名，所以接收者可以验证消息的来源和完整性。

## 使用Node.js实现JWT

在Node.js应用中，我们可以使用jsonwebtoken库来实现JWT的生成和验证。

### 安装依赖

```bash
npm install jsonwebtoken
```

### 生成JWT

```javascript
const jwt = require('jsonwebtoken');

// 用户信息
const user = {
  id: '1234567890',
  username: 'johndoe',
  role: 'user'
};

// 密钥（在生产环境中应该存储在环境变量中）
const secretKey = 'your-secret-key';

// 生成JWT
const token = jwt.sign(user, secretKey, {
  expiresIn: '1h' // 令牌过期时间
});

console.log('生成的JWT:', token);
```

### 验证JWT

```javascript
const jwt = require('jsonwebtoken');

// 要验证的JWT
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 密钥
const secretKey = 'your-secret-key';

// 验证JWT
try {
  const decoded = jwt.verify(token, secretKey);
  console.log('验证成功，解码后的信息:', decoded);
} catch (error) {
  console.error('验证失败:', error.message);
}
```

### 在Express中使用JWT

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// 密钥
const secretKey = 'your-secret-key';

// 模拟用户数据库
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user', password: 'user123', role: 'user' }
];

// 登录路由
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 查找用户
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: '认证失败' });
  }
  
  // 生成JWT
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secretKey,
    { expiresIn: '1h' }
  );
  
  res.json({ token });
});

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供令牌' });
  }
  
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的令牌' });
    }
    
    req.user = user;
    next();
  });
}

// 受保护的路由
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: '访问受保护的资源成功', user: req.user });
});

// 管理员路由
app.get('/admin', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }
  
  res.json({ message: '访问管理员资源成功', user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在端口3000');
});
```

## JWT安全最佳实践

1. **使用强密钥**：使用长且随机的密钥，并将其存储在安全的地方（如环境变量）
2. **设置适当的过期时间**：为令牌设置适当的过期时间，避免令牌长时间有效
3. **使用HTTPS**：始终通过HTTPS传输JWT，防止中间人攻击
4. **不要存储敏感信息**：不要在JWT中存储密码、信用卡号等敏感信息
5. **签名算法选择**：使用安全的签名算法，如HS256、RS256等
6. **防止令牌泄露**：客户端应安全存储令牌，避免XSS攻击
7. **实现令牌撤销机制**：尽管JWT本身无法撤销，但可以通过其他方式实现令牌撤销，如黑名单、令牌版本控制等
8. **验证所有声明**：在验证令牌时，验证所有重要的声明，如exp、nbf、iss等
9. **使用短令牌标识符**：对于需要存储在cookie中的令牌，考虑使用短令牌标识符，而不是整个令牌
10. **定期轮换密钥**：定期轮换签名密钥，提高安全性

## 实践项目

创建一个基于JWT的认证系统：

1. 实现用户注册和登录功能
2. 生成包含用户信息和权限的JWT
3. 在Express应用中实现JWT验证中间件
4. 创建不同权限级别的受保护路由
5. 实现令牌刷新机制
6. 添加令牌黑名单功能
7. 实施安全的令牌存储策略
8. 创建基本的前端页面，演示JWT的使用流程

通过这个项目，您将掌握JWT的基本原理和在Node.js应用中的实际应用，为构建安全的认证系统打下基础。
