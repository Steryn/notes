# 哈希算法

## 概述

哈希算法是将任意长度的数据映射为固定长度字符串的数学函数。在Node.js应用中，哈希算法主要用于密码存储、数据完整性验证、数字签名等安全场景。

## 哈希算法特性

### 1. 确定性

- 相同输入总是产生相同输出
- 便于验证和比较

### 2. 单向性

- 从哈希值无法推导出原始数据
- 保证数据安全性

### 3. 雪崩效应

- 输入微小变化导致输出巨大变化
- 增强安全性

### 4. 固定长度

- 无论输入多长，输出长度固定
- 便于存储和处理

## 常用哈希算法

### 1. MD5

```javascript
const crypto = require('crypto');

// MD5哈希
function md5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

// 使用示例
const password = 'mypassword123';
const hash = md5Hash(password);
console.log('MD5哈希:', hash); // 输出: 482c811da5d5b4bc6d497ffa98491e38

// ❌ 注意：MD5已不安全，不推荐用于密码存储
```

### 2. SHA-1

```javascript
const crypto = require('crypto');

// SHA-1哈希
function sha1Hash(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

// 使用示例
const data = 'Hello World';
const hash = sha1Hash(data);
console.log('SHA-1哈希:', hash); // 输出: 0a0a9f2a6772942557ab5355d76af442f8f65e01

// ❌ 注意：SHA-1也已不安全，不推荐用于安全场景
```

### 3. SHA-256

```javascript
const crypto = require('crypto');

// SHA-256哈希
function sha256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// 使用示例
const message = 'Hello World';
const hash = sha256Hash(message);
console.log('SHA-256哈希:', hash);

// 带盐值的SHA-256
function sha256WithSalt(data, salt) {
  return crypto.createHash('sha256').update(data + salt).digest('hex');
}
```

### 4. SHA-512

```javascript
const crypto = require('crypto');

// SHA-512哈希
function sha512Hash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// 使用示例
const data = 'Sensitive Data';
const hash = sha512Hash(data);
console.log('SHA-512哈希:', hash);
```

## 密码专用哈希算法

### 1. bcrypt

```javascript
const bcrypt = require('bcrypt');

// bcrypt哈希
async function bcryptHash(password) {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// bcrypt验证
async function bcryptVerify(password, hash) {
  return await bcrypt.compare(password, hash);
}

// 使用示例
async function userRegistration() {
  const password = 'userpassword123';
  const hashedPassword = await bcryptHash(password);
  
  console.log('bcrypt哈希:', hashedPassword);
  // 输出类似: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.5.2
  
  // 验证密码
  const isValid = await bcryptVerify(password, hashedPassword);
  console.log('密码验证:', isValid); // true
}
```

### 2. scrypt

```javascript
const crypto = require('crypto');

// scrypt哈希
function scryptHash(password, salt) {
  const keylen = 64;
  const options = {
    N: 16384,    // CPU/内存成本参数
    r: 8,        // 块大小参数
    p: 1         // 并行化参数
  };
  
  return crypto.scryptSync(password, salt, keylen, options);
}

// 完整的scrypt实现
function scryptHashWithSalt(password) {
  const salt = crypto.randomBytes(16);
  const hash = scryptHash(password, salt);
  
  // 返回盐值+哈希值的组合
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    combined: salt.toString('hex') + ':' + hash.toString('hex')
  };
}

// scrypt验证
function scryptVerify(password, saltHex, hashHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const storedHash = Buffer.from(hashHex, 'hex');
  
  const computedHash = scryptHash(password, salt);
  return crypto.timingSafeEqual(storedHash, computedHash);
}
```

### 3. Argon2

```javascript
const argon2 = require('argon2');

// Argon2哈希
async function argon2Hash(password) {
  const options = {
    type: argon2.argon2id,  // 推荐使用argon2id
    memoryCost: 2 ** 16,    // 64 MB内存
    timeCost: 3,            // 3次迭代
    parallelism: 1,         // 1个线程
    hashLength: 32          // 32字节哈希长度
  };
  
  return await argon2.hash(password, options);
}

// Argon2验证
async function argon2Verify(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    console.error('验证失败:', err);
    return false;
  }
}

// 使用示例
async function argon2Example() {
  const password = 'securepassword123';
  
  const hash = await argon2Hash(password);
  console.log('Argon2哈希:', hash);
  
  const isValid = await argon2Verify(password, hash);
  console.log('验证结果:', isValid);
}
```

## 哈希算法比较

### 安全性对比

```javascript
// 算法安全性等级
const algorithmSecurity = {
  // ❌ 不安全，不推荐使用
  'MD5': '已破解，不推荐',
  'SHA-1': '已破解，不推荐',
  
  // ⚠️ 一般安全，需要加盐
  'SHA-256': '安全，但需要加盐和多次迭代',
  'SHA-512': '安全，但需要加盐和多次迭代',
  
  // ✅ 推荐用于密码存储
  'bcrypt': '专门为密码设计，推荐使用',
  'scrypt': '抗ASIC攻击，推荐使用',
  'Argon2': '最新标准，最推荐使用'
};
```

### 性能对比

```javascript
const crypto = require('crypto');

// 性能测试函数
function performanceTest() {
  const testData = 'testpassword123';
  const iterations = 1000;
  
  console.log('=== 哈希算法性能测试 ===');
  
  // MD5测试
  console.time('MD5');
  for (let i = 0; i < iterations; i++) {
    crypto.createHash('md5').update(testData).digest('hex');
  }
  console.timeEnd('MD5');
  
  // SHA-256测试
  console.time('SHA-256');
  for (let i = 0; i < iterations; i++) {
    crypto.createHash('sha256').update(testData).digest('hex');
  }
  console.timeEnd('SHA-256');
  
  // bcrypt测试（单次）
  console.time('bcrypt (单次)');
  bcrypt.hashSync(testData, 10);
  console.timeEnd('bcrypt (单次)');
}
```

## 实际应用场景

### 1. 密码存储

```javascript
// 用户注册
async function registerUser(username, password) {
  // 使用Argon2哈希密码
  const hashedPassword = await argon2Hash(password);
  
  const user = {
    username,
    password: hashedPassword,
    createdAt: new Date()
  };
  
  // 保存到数据库
  await User.create(user);
  console.log('用户注册成功');
}

// 用户登录
async function loginUser(username, password) {
  const user = await User.findOne({ username });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 验证密码
  const isValid = await argon2Verify(password, user.password);
  
  if (!isValid) {
    throw new Error('密码错误');
  }
  
  console.log('登录成功');
  return user;
}
```

### 2. 数据完整性验证

```javascript
// 文件完整性检查
function verifyFileIntegrity(filePath, expectedHash) {
  const fs = require('fs');
  const crypto = require('crypto');
  
  const fileBuffer = fs.readFileSync(filePath);
  const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  return actualHash === expectedHash;
}

// API数据完整性
function createDataHash(data) {
  const crypto = require('crypto');
  const dataString = JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

function verifyDataIntegrity(data, expectedHash) {
  const actualHash = createDataHash(data);
  return actualHash === expectedHash;
}
```

### 3. 数字签名

```javascript
const crypto = require('crypto');

// 生成密钥对
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// 创建数字签名
function createSignature(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

// 验证数字签名
function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}
```

## 安全最佳实践

### 1. 选择合适的算法

```javascript
// 根据用途选择算法
const algorithmSelection = {
  // 密码存储
  passwordStorage: 'argon2id', // 或 bcrypt
  
  // 数据完整性
  dataIntegrity: 'sha256',
  
  // 数字签名
  digitalSignature: 'rsa-sha256',
  
  // 快速哈希（非安全场景）
  fastHash: 'xxhash' // 需要安装xxhash包
};
```

### 2. 添加盐值

```javascript
// 生成随机盐值
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// 带盐值的哈希
function hashWithSalt(data, salt) {
  return crypto.createHash('sha256').update(data + salt).digest('hex');
}

// 使用示例
function secureHash(data) {
  const salt = generateSalt();
  const hash = hashWithSalt(data, salt);
  
  return {
    salt,
    hash,
    combined: salt + ':' + hash
  };
}
```

### 3. 防止时序攻击

```javascript
// 使用timingSafeEqual防止时序攻击
function safeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'hex'),
    Buffer.from(b, 'hex')
  );
}

// 密码验证示例
function verifyPasswordSafely(inputPassword, storedHash) {
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
  return safeCompare(inputHash, storedHash);
}
```

## 总结

选择合适的哈希算法是确保应用安全的关键：

1. **密码存储**：使用bcrypt、scrypt或Argon2
2. **数据完整性**：使用SHA-256或SHA-512
3. **数字签名**：使用RSA-SHA256或ECDSA
4. **避免使用**：MD5、SHA-1（已不安全）
5. **始终加盐**：增加安全性
6. **考虑性能**：平衡安全性和性能
7. **防止攻击**：使用timingSafeEqual防止时序攻击

通过正确选择和实现哈希算法，可以大大提升应用的安全性。
