# 密码策略

## 1. 什么是密码策略

密码策略是一组规则和最佳实践，用于指导用户创建安全的密码，以及系统如何管理、存储和验证这些密码。良好的密码策略是保护用户账户和敏感数据安全的第一道防线，对于防范暴力破解、字典攻击等常见的安全威胁至关重要。

## 2. 密码策略的核心要素

### 2.1 密码复杂性要求

密码复杂性要求确保密码难以被猜测或通过自动化工具破解，通常包括以下方面：

- **长度要求**：密码最小长度（如8-12个字符）和建议长度
- **字符多样性**：要求使用多种字符类型（大写字母、小写字母、数字、特殊符号）
- **禁止常见模式**：避免连续字符、重复字符、键盘序列等
- **个性化限制**：禁止使用用户名、用户ID或其他个人信息

### 2.2 密码过期策略

密码过期策略规定用户必须定期更改密码，以减少密码泄露后的风险暴露时间：

- **密码有效期**：密码的最长使用时间（如90天）
- **历史密码限制**：禁止重复使用最近使用过的密码（如最近5个密码）
- **过期通知**：在密码过期前提醒用户（如提前7天）

### 2.3 账户锁定策略

账户锁定策略可以有效防止暴力破解攻击：

- **失败尝试次数**：连续失败登录尝试的最大次数（如5次）
- **锁定持续时间**：账户锁定的时间长度（如30分钟）或直到管理员解锁
- **锁定通知**：向用户或管理员发送账户锁定通知

### 2.4 密码存储策略

密码存储策略关注如何安全地存储密码：

- **哈希算法**：使用强加密哈希算法（如bcrypt、scrypt、Argon2）
- **盐值使用**：为每个密码生成唯一的盐值
- **密钥派生函数**：使用带有适当工作因子的密钥派生函数

## 3. 密码策略的实现（Node.js）

### 3.1 使用 express-validator 实现密码复杂性验证

```javascript
const { body, validationResult } = require('express-validator');

// 密码验证中间件
const validatePassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少为8个字符')
    .matches(/[A-Z]/)
    .withMessage('密码必须包含至少一个大写字母')
    .matches(/[a-z]/)
    .withMessage('密码必须包含至少一个小写字母')
    .matches(/[0-9]/)
    .withMessage('密码必须包含至少一个数字')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('密码必须包含至少一个特殊字符'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// 在路由中使用
app.post('/users/register', validatePassword, async (req, res) => {
  // 用户注册逻辑
});
```

### 3.2 实现密码历史记录检查

```javascript
const bcrypt = require('bcrypt');
const User = require('../models/User');

// 检查新密码是否与历史密码相同
async function checkPasswordHistory(userId, newPassword) {
  const user = await User.findById(userId);
  
  // 检查新密码是否与历史密码匹配
  for (const oldHash of user.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldHash);
    if (isMatch) {
      return true; // 密码与历史密码匹配
    }
  }
  
  return false; // 密码与历史密码不匹配
}

// 更新密码并记录历史
async function updatePassword(userId, newPassword) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(newPassword, salt);
  
  const user = await User.findById(userId);
  
  // 将当前密码添加到历史记录
  user.passwordHistory.unshift(user.passwordHash);
  
  // 只保留最近5个历史密码
  if (user.passwordHistory.length > 5) {
    user.passwordHistory = user.passwordHistory.slice(0, 5);
  }
  
  // 更新当前密码和过期日期
  user.passwordHash = hash;
  user.passwordExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90天后过期
  
  await user.save();
}
```

### 3.3 实现账户锁定功能

```javascript
const User = require('../models/User');

// 处理登录尝试并实现账户锁定
async function handleLoginAttempt(username, password) {
  const user = await User.findOne({ username });
  
  // 检查账户是否被锁定
  if (user.accountLocked && user.lockExpires > new Date()) {
    const minutesLeft = Math.ceil((user.lockExpires - new Date()) / (1000 * 60));
    return {
      success: false,
      message: `账户已被锁定，请在${minutesLeft}分钟后重试`
    };
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (isPasswordValid) {
    // 登录成功，重置失败尝试次数
    user.failedLoginAttempts = 0;
    await user.save();
    return { success: true, userId: user._id };
  } else {
    // 登录失败，增加失败尝试次数
    user.failedLoginAttempts += 1;
    
    // 如果失败次数超过阈值，锁定账户
    if (user.failedLoginAttempts >= 5) {
      user.accountLocked = true;
      user.lockExpires = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
    }
    
    await user.save();
    
    const attemptsLeft = 5 - user.failedLoginAttempts;
    return {
      success: false,
      message: attemptsLeft > 0 
        ? `密码错误，还有${attemptsLeft}次尝试机会`
        : '账户已被锁定，请在30分钟后重试'
    };
  }
}
```

## 4. 密码策略的最佳实践

### 4.1 基于NIST的现代密码建议

美国国家标准与技术研究院(NIST)发布的密码指南提供了现代密码策略的最佳实践：

- 不再强制要求定期密码更改（除非有安全事件）
- 鼓励使用较长的密码短语，而不是复杂但难以记忆的密码
- 实现禁止使用常见密码的机制
- 支持使用密码管理器
- 为用户提供密码强度反馈

### 4.2 密码策略的实施建议

- **平衡安全性和可用性**：过于严格的密码策略可能导致用户采用不安全的变通方法
- **用户教育**：培训用户了解密码安全的重要性和创建强密码的方法
- **多因素认证**：结合密码使用多因素认证提供额外的安全层
- **定期审计**：定期审查密码策略的有效性和合规性
- **自动阻止暴力攻击**：实现速率限制和异常检测

### 4.3 常见错误与避免方法

- **错误**：密码复杂性要求过于严格，导致用户写下密码
  **避免方法**：优先考虑密码长度而非复杂性，提供密码短语选项

- **错误**：强制频繁更改密码，导致用户只做微小更改
  **避免方法**：仅在怀疑密码泄露时要求更改密码

- **错误**：不检查常见密码或密码列表
  **避免方法**：实施针对常见密码和泄露密码的检查

## 5. 密码策略的评估与监控

### 5.1 密码强度评估

- **密码熵**：衡量密码随机性和不可预测性的指标
- **离线破解模拟**：定期测试密码数据库对破解尝试的抵抗力
- **用户反馈**：收集用户对密码策略的反馈以改进可用性

### 5.2 安全事件监控

- **异常登录监控**：检测不寻常的登录模式（如地理位置、设备变更）
- **暴力攻击检测**：监控并阻止高频失败登录尝试
- **安全日志分析**：定期审查安全日志以识别潜在威胁

## 6. 实践项目：创建完整的密码策略管理系统

### 6.1 项目概述

创建一个Node.js应用程序，实现完整的密码策略管理系统，包括密码验证、历史记录检查、账户锁定和过期策略。

### 6.2 技术栈

- Node.js + Express
- MongoDB (使用Mongoose)
- bcrypt (密码哈希)
- express-validator (输入验证)

### 6.3 项目结构

```
password-policy-system/
├── app.js
├── models/
│   └── User.js
├── controllers/
│   └── authController.js
├── middlewares/
│   └── passwordValidator.js
├── routes/
│   └── authRoutes.js
└── config/
    └── passwordPolicy.js
```

### 6.4 核心代码实现

**1. 密码策略配置 (config/passwordPolicy.js)**

```javascript
module.exports = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  historyCount: 5,
  expirationDays: 90,
  maxFailedAttempts: 5,
  lockoutMinutes: 30,
  commonPasswords: ['password', '123456', 'qwerty'] // 简单示例，实际应使用更大的列表
};
```

**2. 用户模型 (models/User.js)**

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passwordHistory: [String],
  passwordExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

**3. 密码验证中间件 (middlewares/passwordValidator.js)**

```javascript
const { body, validationResult } = require('express-validator');
const policy = require('../config/passwordPolicy');

const passwordValidator = [
  body('password')
    .isLength({ min: policy.minLength })
    .withMessage(`密码长度至少为${policy.minLength}个字符`)
    .custom((value) => {
      if (policy.requireUppercase && !/[A-Z]/.test(value)) {
        throw new Error('密码必须包含至少一个大写字母');
      }
      if (policy.requireLowercase && !/[a-z]/.test(value)) {
        throw new Error('密码必须包含至少一个小写字母');
      }
      if (policy.requireNumbers && !/[0-9]/.test(value)) {
        throw new Error('密码必须包含至少一个数字');
      }
      if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        throw new Error('密码必须包含至少一个特殊字符');
      }
      if (policy.commonPasswords.includes(value.toLowerCase())) {
        throw new Error('密码不能使用常见密码');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = passwordValidator;
```

**4. 认证控制器 (controllers/authController.js)**

```javascript
const bcrypt = require('bcrypt');
const User = require('../models/User');
const policy = require('../config/passwordPolicy');

// 注册用户
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 密码哈希
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // 创建新用户
    const user = new User({
      username,
      passwordHash,
      passwordHistory: [],
      passwordExpires: new Date(Date.now() + policy.expirationDays * 24 * 60 * 60 * 1000)
    });
    
    await user.save();
    res.status(201).json({ message: '用户注册成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 检查账户是否被锁定
    if (user.accountLocked && user.lockExpires > new Date()) {
      const minutesLeft = Math.ceil((user.lockExpires - new Date()) / (1000 * 60));
      return res.status(401).json({ message: `账户已被锁定，请在${minutesLeft}分钟后重试` });
    }
    
    // 检查密码是否过期
    if (user.passwordExpires && user.passwordExpires < new Date()) {
      return res.status(401).json({ message: '密码已过期，请重置密码' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isPasswordValid) {
      // 登录成功，重置失败尝试次数
      user.failedLoginAttempts = 0;
      user.accountLocked = false;
      await user.save();
      
      // 生成会话或令牌（实际应用中实现）
      res.json({ message: '登录成功' });
    } else {
      // 登录失败，增加失败尝试次数
      user.failedLoginAttempts += 1;
      
      // 如果失败次数超过阈值，锁定账户
      if (user.failedLoginAttempts >= policy.maxFailedAttempts) {
        user.accountLocked = true;
        user.lockExpires = new Date(Date.now() + policy.lockoutMinutes * 60 * 1000);
      }
      
      await user.save();
      
      const attemptsLeft = policy.maxFailedAttempts - user.failedLoginAttempts;
      res.status(401).json({
        message: attemptsLeft > 0 
          ? `密码错误，还有${attemptsLeft}次尝试机会`
          : `账户已被锁定，请在${policy.lockoutMinutes}分钟后重试`
      });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: '当前密码错误' });
    }
    
    // 检查新密码是否与历史密码相同
    let isPasswordInHistory = false;
    for (const oldHash of user.passwordHistory) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        isPasswordInHistory = true;
        break;
      }
    }
    
    if (isPasswordInHistory) {
      return res.status(400).json({ message: '新密码不能与最近使用的密码相同' });
    }
    
    // 密码哈希
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    
    // 更新密码历史和当前密码
    user.passwordHistory.unshift(user.passwordHash);
    
    // 只保留指定数量的历史密码
    if (user.passwordHistory.length > policy.historyCount) {
      user.passwordHistory = user.passwordHistory.slice(0, policy.historyCount);
    }
    
    user.passwordHash = newPasswordHash;
    user.passwordExpires = new Date(Date.now() + policy.expirationDays * 24 * 60 * 60 * 1000);
    
    await user.save();
    res.json({ message: '密码重置成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
```

**5. 路由设置 (routes/authRoutes.js)**

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordValidator = require('../middlewares/passwordValidator');

router.post('/register', passwordValidator, authController.register);
router.post('/login', authController.login);
router.post('/reset-password', passwordValidator, authController.resetPassword);

module.exports = router;
```

**6. 主应用文件 (app.js)**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 连接数据库
mongoose.connect('mongodb://localhost:27017/password-policy-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 中间件
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

### 6.5 项目测试与部署

1. **安装依赖**

   ```bash
   npm install express mongoose bcrypt express-validator
   ```

2. **启动MongoDB服务**

3. **运行应用**

   ```bash
   node app.js
   ```

4. **API测试端点**
   - POST `/api/auth/register` - 用户注册
   - POST `/api/auth/login` - 用户登录
   - POST `/api/auth/reset-password` - 重置密码

### 6.6 拓展功能建议

1. 添加密码强度可视化指示器
2. 集成第三方密码检查服务（如HaveIBeenPwned API）
3. 实现密码重置邮件功能
4. 添加多因素认证支持
5. 创建管理员仪表板监控账户安全事件

## 7. 总结

密码策略是网络安全的基础组成部分，有效的密码策略可以显著提高系统的安全性。通过实施合理的密码复杂性要求、账户锁定机制、密码历史记录和过期策略，可以大大降低未经授权访问的风险。在实际应用中，还应结合用户教育、多因素认证等措施，构建多层次的安全防护体系。

现代密码策略趋势强调在安全性和可用性之间取得平衡，不再过分强调密码复杂性和频繁更改，而是更注重密码长度、避免常见密码和实现额外的安全控制措施。
