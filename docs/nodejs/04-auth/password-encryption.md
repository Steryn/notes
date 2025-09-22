# 密码加密

## 概述

密码加密是保护用户数据安全的基础措施。在Node.js应用中，我们使用加密算法将明文密码转换为不可逆的密文，确保即使数据库被泄露，攻击者也无法直接获取用户的原始密码。

## 加密 vs 哈希

### 加密（Encryption）

- **可逆性**：可以解密回原始数据
- **用途**：保护敏感数据，需要时能够恢复
- **算法**：AES、RSA等
- **密钥**：需要密钥进行加密和解密

### 哈希（Hashing）

- **不可逆性**：无法从哈希值恢复原始数据
- **用途**：密码存储、数据完整性验证
- **算法**：bcrypt、scrypt、Argon2等
- **盐值**：增加安全性，防止彩虹表攻击

## 密码哈希算法

### 1. bcrypt

```javascript
const bcrypt = require('bcrypt');

// 生成哈希
async function hashPassword(password) {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// 验证密码
async function verifyPassword(password, hashedPassword) {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

// 使用示例
async function registerUser(username, password) {
  try {
    const hashedPassword = await hashPassword(password);
    
    // 存储到数据库
    await User.create({
      username,
      password: hashedPassword
    });
    
    console.log('用户注册成功');
  } catch (error) {
    console.error('注册失败:', error);
  }
}
```

### 2. scrypt

```javascript
const crypto = require('crypto');

function hashPasswordScrypt(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  
  // 将盐值和哈希值组合存储
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPasswordScrypt(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  
  const derivedHash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, derivedHash);
}
```

### 3. Argon2

```javascript
const argon2 = require('argon2');

async function hashPasswordArgon2(password) {
  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    });
    return hash;
  } catch (err) {
    console.error('哈希生成失败:', err);
  }
}

async function verifyPasswordArgon2(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    console.error('密码验证失败:', err);
    return false;
  }
}
```

## 密码强度验证

### 密码策略

```javascript
function validatePasswordStrength(password) {
  const errors = [];
  
  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  
  // 复杂度检查
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  // 常见密码检查
  const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('不能使用常见密码');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 使用示例
function registerUser(username, password) {
  const validation = validatePasswordStrength(password);
  
  if (!validation.isValid) {
    return {
      success: false,
      message: '密码不符合要求',
      errors: validation.errors
    };
  }
  
  // 继续注册流程
  return registerUserWithValidPassword(username, password);
}
```

## 密码加密最佳实践

### 1. 使用强哈希算法

```javascript
// 推荐配置
const hashConfig = {
  algorithm: 'bcrypt',
  saltRounds: 12, // 至少12轮
  // 或者使用Argon2
  argon2Config: {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  }
};
```

### 2. 添加盐值

```javascript
const crypto = require('crypto');

function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function hashWithSalt(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}
```

### 3. 密码重置流程

```javascript
const crypto = require('crypto');

// 生成重置令牌
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 存储重置令牌（带过期时间）
async function storeResetToken(userId, token) {
  const expiresAt = new Date(Date.now() + 3600000); // 1小时后过期
  
  await ResetToken.create({
    userId,
    token,
    expiresAt
  });
}

// 验证重置令牌
async function verifyResetToken(token) {
  const resetToken = await ResetToken.findOne({
    token,
    expiresAt: { $gt: new Date() }
  });
  
  return resetToken;
}
```

### 4. 密码历史记录

```javascript
// 防止用户重复使用最近使用过的密码
async function checkPasswordHistory(userId, newPassword) {
  const recentPasswords = await PasswordHistory.find({
    userId,
    createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // 最近一年
  }).sort({ createdAt: -1 }).limit(5);
  
  for (const passwordRecord of recentPasswords) {
    const isValid = await bcrypt.compare(newPassword, passwordRecord.hashedPassword);
    if (isValid) {
      return false; // 密码已被使用过
    }
  }
  
  return true; // 密码可以使用
}
```

## 安全注意事项

### 1. 避免明文存储

```javascript
// ❌ 错误做法
const user = {
  username: 'john',
  password: 'plaintext123' // 永远不要这样做
};

// ✅ 正确做法
const user = {
  username: 'john',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.5.2' // 哈希值
};
```

### 2. 使用安全的随机数生成器

```javascript
const crypto = require('crypto');

// ✅ 使用crypto.randomBytes
const salt = crypto.randomBytes(32);

// ❌ 避免使用Math.random()
const insecureSalt = Math.random().toString(36);
```

### 3. 定期更新哈希算法

```javascript
// 检查密码是否需要重新哈希（算法升级时）
async function needsRehash(hashedPassword) {
  // 检查是否使用了旧算法
  return !hashedPassword.startsWith('$2b$12$');
}

async function rehashPasswordIfNeeded(userId, password, hashedPassword) {
  if (await needsRehash(hashedPassword)) {
    const newHash = await bcrypt.hash(password, 12);
    await User.updateOne({ _id: userId }, { password: newHash });
    console.log('密码已重新哈希');
  }
}
```

## 性能考虑

### 1. 哈希轮数选择

```javascript
// 根据服务器性能调整轮数
const getOptimalRounds = () => {
  const start = Date.now();
  bcrypt.hashSync('test', 10);
  const end = Date.now();
  
  // 如果哈希时间超过100ms，减少轮数
  if (end - start > 100) {
    return 10;
  }
  return 12;
};
```

### 2. 异步处理

```javascript
// 使用异步哈希避免阻塞事件循环
async function hashPasswordAsync(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 12, (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
}
```

## 总结

密码加密是Web应用安全的基础，选择合适的哈希算法、添加盐值、实施密码策略是保护用户数据的关键措施。记住：

1. 永远不要存储明文密码
2. 使用强哈希算法（bcrypt、Argon2）
3. 添加随机盐值
4. 实施密码强度策略
5. 定期更新安全措施
6. 考虑性能影响

通过正确实施这些措施，可以大大降低密码泄露的风险，保护用户账户安全。
