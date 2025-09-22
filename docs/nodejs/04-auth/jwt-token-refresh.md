# JWT令牌刷新

## JWT令牌刷新概述

JWT令牌刷新机制是解决JWT令牌过期问题的一种有效方案。在基于JWT的认证系统中，为了安全起见，访问令牌（Access Token）的过期时间通常设置得比较短。当访问令牌过期时，用户可以使用一个长期有效的刷新令牌（Refresh Token）来获取新的访问令牌，而无需重新输入用户名和密码。这种机制既提高了安全性，又改善了用户体验。

## JWT令牌刷新的工作原理

JWT令牌刷新机制的工作原理如下：

1. **初始认证**：用户提供凭证（如用户名和密码）进行认证
2. **颁发令牌**：服务器验证凭证后，颁发一个短期的访问令牌和一个长期的刷新令牌
3. **访问资源**：客户端使用访问令牌访问受保护的资源
4. **令牌过期**：当访问令牌过期时，服务器拒绝客户端的请求
5. **刷新令牌**：客户端使用刷新令牌向服务器请求新的访问令牌
6. **验证刷新令牌**：服务器验证刷新令牌的有效性
7. **颁发新令牌**：验证成功后，服务器颁发新的访问令牌（可选地，也可以颁发新的刷新令牌）
8. **继续访问**：客户端使用新的访问令牌继续访问受保护的资源

## 访问令牌与刷新令牌的区别

访问令牌和刷新令牌在JWT认证系统中扮演着不同的角色：

| 特性 | 访问令牌 | 刷新令牌 |
|------|----------|----------|
| **有效期** | 短（通常为15分钟到1小时） | 长（通常为7天到30天） |
| **用途** | 访问受保护的资源 | 获取新的访问令牌 |
| **存储位置** | 通常存储在内存中 | 通常存储在安全的地方，如HTTP Only Cookie |
| **包含信息** | 用户身份、权限、作用域等 | 通常只包含用户标识和刷新令牌ID |
| **安全要求** | 中 | 高 |

## 实现JWT令牌刷新机制

### 1. 生成访问令牌和刷新令牌

首先，需要在用户认证成功后同时生成访问令牌和刷新令牌：

```javascript
const jwt = require('jsonwebtoken');

/**
 * 生成访问令牌
 * @param {Object} user - 用户信息
 * @returns {string} 访问令牌
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'access'
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m'
    }
  );
}

/**
 * 生成刷新令牌
 * @param {Object} user - 用户信息
 * @returns {string} 刷新令牌
 */
function generateRefreshToken(user) {
  // 生成一个唯一的刷新令牌ID
  const refreshTokenId = crypto.randomBytes(32).toString('hex');
  
  return jwt.sign(
    {
      id: user.id,
      refreshTokenId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

// 在用户登录时生成令牌
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // 验证用户凭证
    const user = await authenticateUser(username, password);
    
    if (!user) {
      return res.status(401).json({ message: '认证失败' });
    }
    
    // 生成访问令牌和刷新令牌
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // 存储刷新令牌（在实际应用中应存储在数据库中）
    await storeRefreshToken(user.id, refreshToken);
    
    // 设置HTTP Only Cookie存储刷新令牌
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });
    
    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});
```

### 2. 实现刷新令牌端点

接下来，需要实现一个端点，允许客户端使用刷新令牌获取新的访问令牌：

```javascript
/**
 * 刷新访问令牌
 */
app.post('/refresh', async (req, res) => {
  try {
    // 从Cookie中获取刷新令牌
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: '未提供刷新令牌' });
    }
    
    // 验证刷新令牌
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      // 清除无效的刷新令牌
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '刷新令牌已过期' });
      } else {
        return res.status(401).json({ message: '无效的刷新令牌' });
      }
    }
    
    // 确保这是一个刷新令牌
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: '无效的令牌类型' });
    }
    
    // 查找用户
    const user = await findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 验证刷新令牌是否在数据库中（防止重放攻击）
    const storedToken = await getStoredRefreshToken(user.id);
    
    if (!storedToken || storedToken !== refreshToken) {
      // 如果刷新令牌不匹配，可能表示令牌已被撤销
      return res.status(401).json({ message: '刷新令牌无效或已被撤销' });
    }
    
    // 生成新的访问令牌
    const newAccessToken = generateAccessToken(user);
    
    // 可选：生成新的刷新令牌并更新存储
    const newRefreshToken = generateRefreshToken(user);
    await updateRefreshToken(user.id, newRefreshToken);
    
    // 更新Cookie中的刷新令牌
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });
    
    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});
```

### 3. 实现退出登录功能

为了安全起见，还需要实现退出登录功能，清除客户端的刷新令牌：

```javascript
/**
 * 退出登录
 */
app.post('/logout', async (req, res) => {
  try {
    // 从Cookie中获取刷新令牌
    const refreshToken = req.cookies.refreshToken;
    
    // 如果存在刷新令牌，从数据库中删除
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await deleteRefreshToken(decoded.id);
      } catch (error) {
        // 忽略无效的刷新令牌
      }
    }
    
    // 清除Cookie中的刷新令牌
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({ message: '退出登录成功' });
  } catch (error) {
    console.error('退出登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});
```

## 刷新令牌的安全存储

刷新令牌的安全存储对于保护用户账户至关重要。以下是几种常见的刷新令牌存储方式：

### 1. HTTP Only Cookie

将刷新令牌存储在HTTP Only Cookie中是一种较为安全的方式：

```javascript
// 设置HTTP Only Cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,      // 防止JavaScript访问
  secure: true,        // 仅通过HTTPS传输
  sameSite: 'strict',  // 防止跨站请求
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7天有效期
});
```

### 2. 数据库存储

在服务器端，应该将刷新令牌存储在安全的数据库中：

```javascript
/**
 * 将刷新令牌存储在数据库中
 * @param {number} userId - 用户ID
 * @param {string} refreshToken - 刷新令牌
 */
async function storeRefreshToken(userId, refreshToken) {
  try {
    // 使用bcrypt对刷新令牌进行哈希处理
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    
    // 存储哈希后的令牌和过期时间
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [userId, hashedToken]
    );
  } catch (error) {
    console.error('存储刷新令牌错误:', error);
    throw error;
  }
}

/**
 * 验证刷新令牌是否有效
 * @param {number} userId - 用户ID
 * @param {string} refreshToken - 刷新令牌
 * @returns {boolean} - 令牌是否有效
 */
async function isValidRefreshToken(userId, refreshToken) {
  try {
    // 获取存储的令牌
    const [rows] = await db.query(
      'SELECT token FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
      [userId]
    );
    
    if (rows.length === 0) {
      return false;
    }
    
    // 比较哈希后的令牌
    return await bcrypt.compare(refreshToken, rows[0].token);
  } catch (error) {
    console.error('验证刷新令牌错误:', error);
    return false;
  }
}
```

### 3. 刷新令牌轮换

刷新令牌轮换是一种增强安全性的技术，每次使用刷新令牌获取新的访问令牌时，同时生成一个新的刷新令牌：

```javascript
/**
 * 轮换刷新令牌
 * @param {number} userId - 用户ID
 * @param {string} oldRefreshToken - 旧的刷新令牌
 * @returns {string} 新的刷新令牌
 */
async function rotateRefreshToken(userId, oldRefreshToken) {
  try {
    // 验证旧的刷新令牌
    const isValid = await isValidRefreshToken(userId, oldRefreshToken);
    
    if (!isValid) {
      throw new Error('无效的刷新令牌');
    }
    
    // 删除旧的刷新令牌
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    
    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken(userId);
    
    // 存储新的刷新令牌
    await storeRefreshToken(userId, newRefreshToken);
    
    return newRefreshToken;
  } catch (error) {
    console.error('轮换刷新令牌错误:', error);
    throw error;
  }
}
```

## 防止刷新令牌攻击的策略

刷新令牌机制虽然方便，但也带来了一些安全风险。以下是几种防止刷新令牌攻击的策略：

### 1. 限制刷新令牌的使用次数

限制每个刷新令牌的使用次数，一旦使用过就立即失效：

```javascript
// 修改storeRefreshToken函数，添加一个used字段
async function storeRefreshToken(userId, refreshToken) {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 0)',
    [userId, hashedToken]
  );
}

// 在验证刷新令牌时，检查并标记为已使用
async function validateAndMarkRefreshToken(userId, refreshToken) {
  // 开始事务
  await db.beginTransaction();
  
  try {
    // 获取未使用的令牌
    const [rows] = await db.query(
      'SELECT token FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW() AND used = 0 FOR UPDATE',
      [userId]
    );
    
    if (rows.length === 0) {
      await db.rollback();
      return false;
    }
    
    // 验证令牌
    const isValid = await bcrypt.compare(refreshToken, rows[0].token);
    
    if (!isValid) {
      await db.rollback();
      return false;
    }
    
    // 标记令牌为已使用
    await db.query(
      'UPDATE refresh_tokens SET used = 1 WHERE user_id = ?',
      [userId]
    );
    
    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
```

### 2. 实现刷新令牌黑名单

维护一个刷新令牌黑名单，将已撤销或可疑的令牌添加到黑名单中：

```javascript
// 使用Redis存储黑名单
const redis = require('redis');
const redisClient = redis.createClient();

/**
 * 将刷新令牌添加到黑名单
 * @param {string} refreshToken - 刷新令牌
 * @param {number} expiresIn - 过期时间（秒）
 */
function addRefreshTokenToBlacklist(refreshToken, expiresIn) {
  // 生成令牌的哈希值，节省存储空间
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // 将令牌添加到黑名单，设置过期时间
  redisClient.setex(tokenHash, expiresIn, 'blacklisted');
}

/**
 * 检查刷新令牌是否在黑名单中
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<boolean>} - 令牌是否在黑名单中
 */
function isRefreshTokenBlacklisted(refreshToken) {
  return new Promise((resolve, reject) => {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    redisClient.exists(tokenHash, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result === 1);
      }
    });
  });
}

// 在刷新令牌端点中添加黑名单检查
app.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  // 检查令牌是否在黑名单中
  if (await isRefreshTokenBlacklisted(refreshToken)) {
    res.clearCookie('refreshToken', cookieOptions);
    return res.status(401).json({ message: '刷新令牌已被撤销' });
  }
  
  // 其余验证逻辑...
});
```

### 3. 监控异常刷新行为

监控刷新令牌的使用情况，检测异常行为：

```javascript
/**
 * 记录刷新令牌的使用
 * @param {number} userId - 用户ID
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 */
async function logRefreshTokenUsage(userId, ipAddress, userAgent) {
  await db.query(
    'INSERT INTO refresh_token_logs (user_id, ip_address, user_agent, timestamp) VALUES (?, ?, ?, NOW())',
    [userId, ipAddress, userAgent]
  );
}

/**
 * 检测异常刷新行为
 * @param {number} userId - 用户ID
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @returns {Promise<boolean>} - 是否存在异常行为
 */
async function detectSuspiciousRefreshActivity(userId, ipAddress, userAgent) {
  // 获取最近的刷新记录
  const [recentLogs] = await db.query(
    'SELECT ip_address, user_agent FROM refresh_token_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
    [userId]
  );
  
  // 如果没有足够的历史记录，不进行检测
  if (recentLogs.length < 3) {
    return false;
  }
  
  // 检查IP地址是否发生变化
  const ipChanged = !recentLogs.every(log => log.ip_address === ipAddress);
  
  // 检查用户代理是否发生变化
  const userAgentChanged = !recentLogs.every(log => log.user_agent === userAgent);
  
  // 如果IP地址和用户代理同时发生变化，可能存在异常
  return ipChanged && userAgentChanged;
}

// 在刷新令牌端点中添加异常检测
app.post('/refresh', async (req, res) => {
  const userId = decoded.id;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  
  // 检测异常行为
  if (await detectSuspiciousRefreshActivity(userId, ipAddress, userAgent)) {
    // 记录可疑活动
    await logSuspiciousActivity(userId, 'refresh_token', ipAddress, userAgent);
    
    // 可选：撤销用户的所有令牌
    await revokeAllUserTokens(userId);
    
    res.clearCookie('refreshToken', cookieOptions);
    return res.status(403).json({ message: '检测到可疑活动，请重新登录' });
  }
  
  // 记录正常的刷新行为
  await logRefreshTokenUsage(userId, ipAddress, userAgent);
  
  // 其余逻辑...
});
```

## JWT令牌刷新的最佳实践

1. **使用不同的密钥**：为访问令牌和刷新令牌使用不同的密钥，提高安全性
2. **设置不同的过期时间**：访问令牌的过期时间应该短，刷新令牌的过期时间可以长一些
3. **安全存储刷新令牌**：
   - 在客户端，使用HTTP Only Cookie存储刷新令牌
   - 在服务器端，对刷新令牌进行哈希处理后存储
4. **实现刷新令牌轮换**：每次使用刷新令牌后，生成新的刷新令牌
5. **限制刷新令牌的使用次数**：每个刷新令牌只能使用一次
6. **监控异常行为**：监控刷新令牌的使用情况，检测可疑活动
7. **实现令牌撤销机制**：提供撤销特定刷新令牌或所有令牌的功能
8. **使用HTTPS**：始终通过HTTPS传输刷新令牌，防止中间人攻击
9. **考虑使用状态存储**：对于高安全性应用，考虑使用状态存储（如数据库）而不是纯粹的无状态JWT
10. **定期清理过期令牌**：定期从数据库中清理过期的刷新令牌，节省存储空间

## 实践项目

创建一个完整的JWT令牌刷新系统：

1. **实现认证系统**：
   - 用户注册和登录功能
   - 密码哈希和验证

2. **实现令牌生成模块**：
   - 生成访问令牌和刷新令牌
   - 使用不同的密钥和过期时间

3. **实现令牌刷新端点**：
   - 验证刷新令牌的有效性
   - 生成新的访问令牌和刷新令牌
   - 处理各种错误情况

4. **实现安全存储机制**：
   - 在客户端使用HTTP Only Cookie存储刷新令牌
   - 在服务器端对刷新令牌进行哈希处理后存储

5. **实现安全增强功能**：
   - 刷新令牌轮换
   - 刷新令牌黑名单
   - 异常行为检测
   - 令牌撤销机制

6. **创建监控和日志系统**：
   - 记录令牌生成和刷新事件
   - 监控异常活动
   - 生成安全报告

通过这个项目，您将掌握JWT令牌刷新机制的原理和实践，为构建安全、可靠的认证系统提供有力保障。
