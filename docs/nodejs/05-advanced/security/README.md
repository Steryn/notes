# 安全最佳实践

## 🎯 学习目标

- 掌握Node.js安全最佳实践
- 学会常见安全漏洞防护
- 理解认证和授权机制
- 掌握数据加密技术

## 📚 核心安全概念

### OWASP Top 10 安全风险

1. **注入攻击** - SQL注入、NoSQL注入
2. **身份验证失效** - 弱认证机制
3. **敏感数据泄露** - 数据加密不足
4. **XML外部实体** - XXE攻击
5. **访问控制失效** - 权限绕过
6. **安全配置错误** - 默认配置
7. **跨站脚本** - XSS攻击
8. **不安全的反序列化** - 代码执行
9. **使用已知漏洞组件** - 依赖漏洞
10. **日志记录和监控不足** - 安全审计

## 🛠️ 实践案例

### 1. 输入验证与清理

```javascript
// security-validator.js
const validator = require('validator');
const xss = require('xss');
const DOMPurify = require('isomorphic-dompurify');

class SecurityValidator {
  // 验证用户输入
  static validateUserInput(input, rules) {
    const errors = [];
    
    for (const [field, value] of Object.entries(input)) {
      const rule = rules[field];
      if (!rule) continue;
      
      // 必填验证
      if (rule.required && (!value || value.trim() === '')) {
        errors.push(`${field} 是必填字段`);
        continue;
      }
      
      // 类型验证
      if (value && rule.type) {
        if (!this.validateType(value, rule.type)) {
          errors.push(`${field} 类型不正确`);
        }
      }
      
      // 长度验证
      if (value && rule.length) {
        if (value.length < rule.length.min || value.length > rule.length.max) {
          errors.push(`${field} 长度必须在 ${rule.length.min}-${rule.length.max} 之间`);
        }
      }
      
      // 格式验证
      if (value && rule.format) {
        if (!this.validateFormat(value, rule.format)) {
          errors.push(`${field} 格式不正确`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // 验证数据类型
  static validateType(value, type) {
    switch (type) {
      case 'email':
        return validator.isEmail(value);
      case 'url':
        return validator.isURL(value);
      case 'number':
        return validator.isNumeric(value);
      case 'date':
        return validator.isISO8601(value);
      default:
        return true;
    }
  }
  
  // 验证格式
  static validateFormat(value, format) {
    switch (format) {
      case 'alphanumeric':
        return /^[a-zA-Z0-9]+$/.test(value);
      case 'phone':
        return /^1[3-9]\d{9}$/.test(value);
      case 'password':
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(value);
      default:
        return true;
    }
  }
  
  // 清理HTML内容
  static sanitizeHTML(html) {
    return DOMPurify.sanitize(html);
  }
  
  // 清理XSS
  static sanitizeXSS(input) {
    return xss(input);
  }
  
  // 清理SQL注入
  static sanitizeSQL(input) {
    return input.replace(/['"\\;]/g, '');
  }
}

module.exports = SecurityValidator;
```

## 📝 总结

在这一章中，我们学习了：

1. **输入验证**：防止注入攻击和XSS
2. **认证授权**：JWT令牌和权限控制
3. **数据加密**：敏感数据保护
4. **安全配置**：HTTP安全头设置

## 🔗 下一步

接下来我们将学习：

- [高级认证](./authentication.md)
- [加密与密钥管理](./encryption.md)
- [API安全](./api-security.md)

继续学习，掌握Node.js安全防护技能！🚀
