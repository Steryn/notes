# 01 - MongoDB基础概念

## 🎯 学习目标

- 理解MongoDB的核心概念和特点
- 掌握文档数据库的基本原理
- 了解MongoDB与传统关系型数据库的区别
- 熟悉MongoDB的数据结构

## 📚 核心概念

### 1. 什么是MongoDB？

MongoDB是一个开源的文档数据库，属于NoSQL数据库家族。它以BSON（Binary JSON）格式存储数据，具有高性能、高可用性和易扩展的特点。

**主要特点：**

- 📄 **文档导向** - 数据以文档形式存储
- 🔄 **无模式** - 灵活的文档结构
- 🚀 **高性能** - 优化的查询和索引
- 📈 **可扩展** - 水平扩展支持
- 🌐 **跨平台** - 支持多种操作系统

### 2. 核心术语对比

| 关系型数据库 | MongoDB | 说明 |
|-------------|---------|------|
| Database | Database | 数据库 |
| Table | Collection | 集合/表 |
| Row | Document | 文档/行 |
| Column | Field | 字段/列 |
| Primary Key | _id | 主键 |
| Index | Index | 索引 |

### 3. 数据结构层次

```
Database (数据库)
  └── Collection (集合)
      └── Document (文档)
          └── Field (字段)
```

**示例：**

```javascript
// 数据库: ecommerce
// 集合: users
// 文档示例:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 25,
  "address": {
    "city": "北京",
    "district": "朝阳区"
  },
  "hobbies": ["读书", "游泳", "编程"],
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

## 🔍 核心组件

### 1. Document (文档)

- MongoDB的基本数据单位
- 类似JSON对象，但支持更多数据类型
- 每个文档都有唯一的`_id`字段

### 2. Collection (集合)

- 文档的容器
- 类似关系型数据库中的表
- 不需要预定义结构

### 3. Database (数据库)

- 集合的容器
- 物理上对应一组文件

### 4. Field (字段)

- 文档中的键值对
- 支持嵌套文档和数组

## 📊 数据类型

MongoDB支持丰富的数据类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| String | 字符串 | "Hello World" |
| Integer | 整数 | 42 |
| Double | 浮点数 | 3.14 |
| Boolean | 布尔值 | true, false |
| Date | 日期 | ISODate("2024-01-15") |
| ObjectId | 对象ID | ObjectId("...") |
| Array | 数组 | [1, 2, 3] |
| Object | 嵌套对象 | {name: "张三"} |
| Null | 空值 | null |
| Binary | 二进制数据 | BinData(...) |

## 🆚 MongoDB vs 关系型数据库

### 优势

✅ **灵活的数据模型** - 无需预定义表结构  
✅ **水平扩展** - 易于分片和集群  
✅ **高性能** - 优化的文档存储  
✅ **开发效率** - 减少ORM映射  

### 劣势

❌ **事务支持** - 早期版本事务支持有限  
❌ **数据一致性** - 最终一致性模型  
❌ **复杂查询** - 某些复杂查询不如SQL直观  
❌ **存储空间** - 可能占用更多存储空间  

## 💡 使用场景

### 适合的场景

- 📱 **内容管理系统** - 灵活的文档结构
- 📊 **实时分析** - 快速查询和聚合
- 🌐 **Web应用** - JSON友好的API
- 📈 **大数据处理** - 水平扩展能力
- 🔄 **原型开发** - 快速迭代

### 不适合的场景

- 💰 **金融系统** - 需要强一致性
- 📋 **复杂报表** - 需要复杂JOIN操作
- 🔒 **高度规范化** - 需要严格的数据结构

## 🛠️ 实践练习

### 练习1：理解文档结构

分析以下文档，识别各个字段的数据类型：

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "product_name": "智能手机",
  "price": 2999.99,
  "in_stock": true,
  "specifications": {
    "screen_size": "6.1英寸",
    "storage": "128GB",
    "color": "黑色"
  },
  "tags": ["电子", "手机", "智能"],
  "release_date": ISODate("2024-01-01T00:00:00Z"),
  "reviews": [
    {
      "user": "用户A",
      "rating": 5,
      "comment": "很好用"
    }
  ]
}
```

### 练习2：设计文档结构

为以下业务场景设计MongoDB文档结构：

- 在线书店的图书信息
- 社交媒体的用户动态
- 电商平台的订单信息

## ❓ 常见问题

### Q: MongoDB是免费的吗？

A: MongoDB有免费的Community版本和付费的Enterprise版本。Community版本功能完整，适合学习和中小型项目。

### Q: MongoDB支持SQL查询吗？

A: MongoDB不支持传统SQL，但有MongoDB Query Language (MQL)和聚合管道，功能强大且灵活。

### Q: 如何选择_id字段？

A: MongoDB会自动生成ObjectId作为_id，也可以自定义_id值，但必须保证唯一性。

### Q: MongoDB的文档大小有限制吗？

A: 单个文档最大16MB，对于更大的数据可以使用GridFS。

### Q: MongoDB支持事务吗？

A: MongoDB 4.0+支持多文档事务，但建议谨慎使用，因为会影响性能。

## ⚠️ 注意事项

1. **数据建模** - 合理设计文档结构，避免过度嵌套
2. **索引策略** - 为常用查询字段创建索引
3. **数据类型** - 保持字段数据类型的一致性
4. **命名规范** - 使用有意义的集合和字段名称
5. **性能考虑** - 避免在文档中存储过大的数组

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 解释MongoDB的核心概念
- [ ] 区分MongoDB与传统关系型数据库
- [ ] 识别MongoDB支持的数据类型
- [ ] 设计简单的文档结构
- [ ] 理解MongoDB的适用场景

---

**下一步：** 学习 [02-installation](./02-installation.md) 安装和配置MongoDB
