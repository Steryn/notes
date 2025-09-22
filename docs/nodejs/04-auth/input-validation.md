# 输入验证

## 概述

输入验证是Web应用安全的第一道防线，用于确保用户输入的数据符合预期格式、类型和业务规则。有效的输入验证可以防止多种安全攻击，包括注入攻击、XSS攻击和数据篡改。

## 验证层次

### 1. 客户端验证

```javascript
// 前端表单验证
class FormValidator {
  constructor() {
    this.rules = {};
    this.errors = {};
  }
  
  addRule(field, rule) {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
  }
  
  validate(field, value) {
    const fieldRules = this.rules[field] || [];
    const errors = [];
    
    for (const rule of fieldRules) {
      const result = rule.validate(value);
      if (!result.valid) {
        errors.push(result.message);
      }
    }
    
    this.errors[field] = errors;
    return errors.length === 0;
  }
  
  validateAll(formData) {
    let isValid = true;
    
    for (const [field, value] of Object.entries(formData)) {
      if (!this.validate(field, value)) {
        isValid = false;
      }
    }
    
    return isValid;
  }
}

// 验证规则
const rules = {
  required: {
    validate: (value) => ({
      valid: value !== null && value !== undefined && value !== '',
      message: '此字段为必填项'
    })
  },
  
  email: {
    validate: (value) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '请输入有效的邮箱地址'
    })
  },
  
  minLength: (min) => ({
    validate: (value) => ({
      valid: value.length >= min,
      message: `最少需要${min}个字符`
    })
  }),
  
  maxLength: (max) => ({
    validate: (value) => ({
      valid: value.length <= max,
      message: `最多允许${max}个字符`
    })
  })
};

// 使用示例
const validator = new FormValidator();
validator.addRule('username', rules.required);
validator.addRule('username', rules.minLength(3));
validator.addRule('username', rules.maxLength(20));
validator.addRule('email', rules.required);
validator.addRule('email', rules.email);
```

### 2. 服务器端验证

```javascript
const Joi = require('joi');

// 用户注册验证模式
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少需要3个字符',
      'string.max': '用户名最多20个字符',
      'any.required': '用户名是必填项'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
    
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': '密码至少需要8个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码是必填项'
    }),
    
  age: Joi.number()
    .integer()
    .min(13)
    .max(120)
    .optional()
    .messages({
      'number.base': '年龄必须是数字',
      'number.integer': '年龄必须是整数',
      'number.min': '年龄不能小于13岁',
      'number.max': '年龄不能大于120岁'
    }),
    
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': '请输入有效的手机号码'
    })
});

// 验证中间件
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: '请求数据验证失败',
        details: errorDetails
      });
    }
    
    req.validatedData = value;
    next();
  };
}

// 使用验证中间件
app.post('/api/users', validateRequest(userRegistrationSchema), createUser);
```

## 数据类型验证

### 1. 字符串验证

```javascript
// 字符串验证规则
const stringValidation = {
  // 基础字符串验证
  basic: Joi.string().required(),
  
  // 长度限制
  withLength: Joi.string().min(1).max(100),
  
  // 模式匹配
  withPattern: Joi.string().pattern(/^[a-zA-Z0-9_]+$/),
  
  // 邮箱验证
  email: Joi.string().email(),
  
  // URL验证
  url: Joi.string().uri(),
  
  // 日期字符串
  dateString: Joi.string().isoDate(),
  
  // 自定义验证
  custom: Joi.string().custom((value, helpers) => {
    if (value.includes('script')) {
      return helpers.error('string.noScript');
    }
    return value;
  }, 'No script tags')
};

// 使用示例
const userSchema = Joi.object({
  name: stringValidation.withLength,
  username: stringValidation.withPattern,
  email: stringValidation.email,
  website: stringValidation.url.optional()
});
```

### 2. 数字验证

```javascript
// 数字验证规则
const numberValidation = {
  // 基础数字
  basic: Joi.number(),
  
  // 整数
  integer: Joi.number().integer(),
  
  // 正数
  positive: Joi.number().positive(),
  
  // 范围限制
  inRange: Joi.number().min(0).max(100),
  
  // 精度限制
  withPrecision: Joi.number().precision(2),
  
  // 货币金额
  currency: Joi.number().min(0).precision(2),
  
  // 百分比
  percentage: Joi.number().min(0).max(100).precision(2)
};

// 使用示例
const productSchema = Joi.object({
  price: numberValidation.currency,
  discount: numberValidation.percentage.optional(),
  stock: numberValidation.inRange
});
```

### 3. 数组验证

```javascript
// 数组验证规则
const arrayValidation = {
  // 基础数组
  basic: Joi.array(),
  
  // 字符串数组
  stringArray: Joi.array().items(Joi.string()),
  
  // 数字数组
  numberArray: Joi.array().items(Joi.number()),
  
  // 长度限制
  withLength: Joi.array().min(1).max(10),
  
  // 唯一值
  unique: Joi.array().unique(),
  
  // 对象数组
  objectArray: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required()
    })
  )
};

// 使用示例
const orderSchema = Joi.object({
  items: arrayValidation.objectArray.min(1),
  tags: arrayValidation.stringArray.optional()
});
```

## 业务规则验证

### 1. 自定义验证器

```javascript
// 自定义验证器类
class CustomValidator {
  // 用户名唯一性验证
  static async uniqueUsername(value, helpers) {
    const user = await User.findOne({ username: value });
    if (user) {
      return helpers.error('username.exists');
    }
    return value;
  }
  
  // 密码强度验证
  static passwordStrength(value, helpers) {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return helpers.error('password.weak');
    }
    
    return value;
  }
  
  // 年龄合理性验证
  static reasonableAge(value, helpers) {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - value;
    
    if (birthYear < 1900 || birthYear > currentYear) {
      return helpers.error('age.unreasonable');
    }
    
    return value;
  }
  
  // 文件类型验证
  static fileType(value, helpers) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(value.mimetype)) {
      return helpers.error('file.type');
    }
    return value;
  }
}

// 使用自定义验证器
const advancedUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(20)
    .custom(CustomValidator.uniqueUsername),
    
  password: Joi.string()
    .min(8)
    .custom(CustomValidator.passwordStrength),
    
  age: Joi.number()
    .integer()
    .min(13)
    .max(120)
    .custom(CustomValidator.reasonableAge),
    
  avatar: Joi.object({
    mimetype: Joi.string().custom(CustomValidator.fileType),
    size: Joi.number().max(5 * 1024 * 1024) // 5MB
  }).optional()
});
```

### 2. 条件验证

```javascript
// 条件验证
const conditionalSchema = Joi.object({
  userType: Joi.string().valid('individual', 'company').required(),
  
  // 个人用户必填字段
  firstName: Joi.string().when('userType', {
    is: 'individual',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  lastName: Joi.string().when('userType', {
    is: 'individual',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  // 公司用户必填字段
  companyName: Joi.string().when('userType', {
    is: 'company',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  taxId: Joi.string().when('userType', {
    is: 'company',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  // 根据用户类型验证邮箱域名
  email: Joi.string().email().custom((value, helpers) => {
    const userType = helpers.state.ancestors[0].userType;
    
    if (userType === 'company') {
      const domain = value.split('@')[1];
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
      
      if (commonDomains.includes(domain)) {
        return helpers.error('email.company');
      }
    }
    
    return value;
  })
});
```

## 安全验证

### 1. SQL注入防护

```javascript
// SQL注入检测
class SQLInjectionDetector {
  static patterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /create\s+table/i,
    /alter\s+table/i,
    /exec\s*\(/i,
    /script\s*>/i,
    /<script/i
  ];
  
  static detect(input) {
    if (typeof input !== 'string') {
      return false;
    }
    
    return this.patterns.some(pattern => pattern.test(input));
  }
  
  static validate(input, helpers) {
    if (this.detect(input)) {
      return helpers.error('security.sqlInjection');
    }
    return input;
  }
}

// 使用SQL注入检测
const secureSchema = Joi.object({
  search: Joi.string()
    .max(100)
    .custom(SQLInjectionDetector.validate),
    
  comment: Joi.string()
    .max(500)
    .custom(SQLInjectionDetector.validate)
});
```

### 2. XSS防护

```javascript
// XSS检测和清理
class XSSProtector {
  static patterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  static detect(input) {
    if (typeof input !== 'string') {
      return false;
    }
    
    return this.patterns.some(pattern => pattern.test(input));
  }
  
  static sanitize(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  static validate(input, helpers) {
    if (this.detect(input)) {
      return helpers.error('security.xss');
    }
    return this.sanitize(input);
  }
}

// 使用XSS防护
const xssSafeSchema = Joi.object({
  title: Joi.string()
    .max(100)
    .custom(XSSProtector.validate),
    
  content: Joi.string()
    .max(5000)
    .custom(XSSProtector.validate)
});
```

### 3. 文件上传验证

```javascript
// 文件上传验证
const multer = require('multer');
const path = require('path');

// 文件类型验证
const allowedMimeTypes = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  archive: ['application/zip', 'application/x-rar-compressed']
};

const fileValidation = {
  // 图片文件验证
  image: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(...allowedMimeTypes.image).required(),
    size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB
    buffer: Joi.binary().required()
  }),
  
  // 文档文件验证
  document: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(...allowedMimeTypes.document).required(),
    size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB
    buffer: Joi.binary().required()
  })
};

// 文件上传中间件
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [...allowedMimeTypes.image, ...allowedMimeTypes.document];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个文件
  }
});

// 文件验证中间件
function validateFileUpload(schema) {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    for (const file of req.files) {
      const { error } = schema.validate(file);
      if (error) {
        return res.status(400).json({
          error: '文件验证失败',
          details: error.details
        });
      }
    }
    
    next();
  };
}

// 使用文件验证
app.post('/api/upload/images', 
  upload.array('images', 5),
  validateFileUpload(fileValidation.image),
  uploadImages
);
```

## 验证错误处理

### 1. 统一错误格式

```javascript
// 验证错误处理类
class ValidationErrorHandler {
  static formatJoiError(error) {
    return {
      type: 'validation_error',
      message: '请求数据验证失败',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        type: detail.type
      })),
      timestamp: new Date().toISOString()
    };
  }
  
  static formatCustomError(field, message, value = null) {
    return {
      type: 'validation_error',
      message: '请求数据验证失败',
      details: [{
        field,
        message,
        value,
        type: 'custom'
      }],
      timestamp: new Date().toISOString()
    };
  }
}

// 错误处理中间件
function handleValidationError(error, req, res, next) {
  if (error.isJoi) {
    const formattedError = ValidationErrorHandler.formatJoiError(error);
    return res.status(400).json(formattedError);
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      type: 'validation_error',
      message: '数据验证失败',
      details: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    });
  }
  
  next(error);
}

app.use(handleValidationError);
```

### 2. 国际化错误消息

```javascript
// 国际化错误消息
const errorMessages = {
  en: {
    'string.empty': 'This field is required',
    'string.email': 'Please enter a valid email address',
    'string.min': 'This field must be at least {#limit} characters long',
    'string.max': 'This field must be no more than {#limit} characters long',
    'number.base': 'This field must be a number',
    'any.required': 'This field is required'
  },
  zh: {
    'string.empty': '此字段为必填项',
    'string.email': '请输入有效的邮箱地址',
    'string.min': '此字段至少需要{#limit}个字符',
    'string.max': '此字段最多允许{#limit}个字符',
    'number.base': '此字段必须是数字',
    'any.required': '此字段为必填项'
  }
};

// 国际化验证中间件
function createI18nValidator(schema, locale = 'en') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      messages: errorMessages[locale]
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: '请求数据验证失败',
        details: errorDetails
      });
    }
    
    req.validatedData = value;
    next();
  };
}

// 使用国际化验证
app.post('/api/users', createI18nValidator(userRegistrationSchema, 'zh'), createUser);
```

## 性能优化

### 1. 验证缓存

```javascript
// 验证模式缓存
class ValidationCache {
  constructor() {
    this.cache = new Map();
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  set(key, value) {
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
}

const validationCache = new ValidationCache();

// 缓存验证中间件
function cachedValidation(schemaKey, schemaFactory) {
  return (req, res, next) => {
    let schema = validationCache.get(schemaKey);
    
    if (!schema) {
      schema = schemaFactory();
      validationCache.set(schemaKey, schema);
    }
    
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: '请求数据验证失败',
        details: error.details
      });
    }
    
    req.validatedData = value;
    next();
  };
}
```

### 2. 异步验证优化

```javascript
// 异步验证优化
class AsyncValidator {
  constructor() {
    this.pendingValidations = new Map();
  }
  
  async validateUnique(field, value, model) {
    const cacheKey = `${field}:${value}`;
    
    // 检查缓存
    if (this.pendingValidations.has(cacheKey)) {
      return await this.pendingValidations.get(cacheKey);
    }
    
    // 创建验证Promise
    const validationPromise = model.findOne({ [field]: value })
      .then(result => ({
        valid: !result,
        message: result ? `${field}已存在` : null
      }))
      .catch(error => ({
        valid: false,
        message: '验证失败'
      }));
    
    // 缓存Promise
    this.pendingValidations.set(cacheKey, validationPromise);
    
    // 清理缓存
    setTimeout(() => {
      this.pendingValidations.delete(cacheKey);
    }, 5000);
    
    return await validationPromise;
  }
}

const asyncValidator = new AsyncValidator();

// 异步验证中间件
function asyncValidation(field, model) {
  return async (req, res, next) => {
    const value = req.body[field];
    
    if (value) {
      const result = await asyncValidator.validateUnique(field, value, model);
      
      if (!result.valid) {
        return res.status(400).json({
          error: '验证失败',
          details: [{
            field,
            message: result.message
          }]
        });
      }
    }
    
    next();
  };
}
```

## 总结

输入验证是Web应用安全的基础：

1. **多层验证**：客户端和服务器端双重验证
2. **类型安全**：严格的数据类型和格式验证
3. **业务规则**：自定义验证器处理复杂业务逻辑
4. **安全防护**：防止SQL注入、XSS等攻击
5. **文件验证**：安全的文件上传处理
6. **错误处理**：统一的错误格式和国际化支持
7. **性能优化**：缓存和异步验证优化

通过实施全面的输入验证策略，可以大大提升应用的安全性和可靠性。
