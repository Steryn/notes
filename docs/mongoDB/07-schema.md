# 07 - MongoDB数据模型设计

## 🎯 学习目标

- 理解MongoDB数据建模的基本原则
- 掌握文档结构设计的最佳实践
- 学会处理关系型数据在MongoDB中的建模
- 熟悉数据模型优化策略

## 📚 数据建模基础

### 1. MongoDB数据建模特点

MongoDB作为文档数据库，具有以下特点：

- 📄 **文档导向** - 数据以文档形式存储
- 🔄 **无模式** - 灵活的文档结构
- 🚀 **高性能** - 优化的文档存储
- 📈 **可扩展** - 水平扩展支持

### 2. 数据建模原则

**核心原则：**

- 🎯 **应用驱动** - 根据应用需求设计数据模型
- 🔍 **查询优化** - 优化常用查询模式
- 📊 **性能优先** - 考虑读写性能
- 🔄 **灵活扩展** - 支持未来需求变化

## 🏗️ 数据建模模式

### 1. 嵌入模式 (Embedding)

**适用场景：**

- 一对少关系（1:1, 1:few）
- 数据访问模式一致
- 数据更新频率低

```javascript
// 用户和地址的嵌入模式
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  address: {
    street: "朝阳区建国路88号",
    city: "北京",
    zipCode: "100000",
    country: "中国"
  },
  phone: "13800138000"
})

// 博客文章和评论的嵌入模式
db.posts.insertOne({
  _id: "post001",
  title: "MongoDB学习指南",
  content: "这是一篇关于MongoDB的学习文章...",
  author: "张三",
  createdAt: new Date(),
  comments: [
    {
      _id: "comment001",
      author: "李四",
      content: "很好的文章！",
      createdAt: new Date()
    },
    {
      _id: "comment002",
      author: "王五",
      content: "学到了很多，谢谢！",
      createdAt: new Date()
    }
  ],
  tags: ["MongoDB", "数据库", "学习"]
})
```

### 2. 引用模式 (Referencing)

**适用场景：**

- 一对多关系（1:many）
- 多对多关系（many:many）
- 数据访问模式不同
- 数据更新频率高

```javascript
// 用户集合
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com"
})

// 订单集合（引用用户）
db.orders.insertOne({
  _id: "order001",
  customerId: "user001",  // 引用用户ID
  products: [
    { productId: "product001", quantity: 2 },
    { productId: "product002", quantity: 1 }
  ],
  totalAmount: 1500,
  status: "completed",
  createdAt: new Date()
})

// 产品集合
db.products.insertOne({
  _id: "product001",
  name: "智能手机",
  price: 1000,
  category: "电子"
})
```

### 3. 混合模式 (Hybrid)

**适用场景：**

- 复杂的数据关系
- 需要平衡查询性能和存储效率
- 部分数据经常一起访问

```javascript
// 用户集合（嵌入常用信息，引用详细信息）
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  // 嵌入常用信息
  profile: {
    avatar: "avatar001.jpg",
    bio: "软件工程师",
    location: "北京"
  },
  // 引用详细信息
  profileId: "profile001",
  // 嵌入最近订单摘要
  recentOrders: [
    { orderId: "order001", amount: 1500, date: new Date() }
  ]
})

// 详细资料集合
db.profiles.insertOne({
  _id: "profile001",
  userId: "user001",
  detailedInfo: {
    education: "计算机科学学士",
    workExperience: "5年软件开发经验",
    skills: ["JavaScript", "MongoDB", "Node.js"]
  }
})
```

## 🔄 关系建模

### 1. 一对一关系

```javascript
// 方案1：嵌入模式
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  profile: {
    avatar: "avatar001.jpg",
    bio: "软件工程师",
    location: "北京"
  }
})

// 方案2：引用模式
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  profileId: "profile001"
})

db.profiles.insertOne({
  _id: "profile001",
  userId: "user001",
  avatar: "avatar001.jpg",
  bio: "软件工程师",
  location: "北京"
})
```

### 2. 一对多关系

```javascript
// 方案1：嵌入模式（适合少量子文档）
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  addresses: [
    {
      type: "home",
      street: "朝阳区建国路88号",
      city: "北京"
    },
    {
      type: "work",
      street: "海淀区中关村大街1号",
      city: "北京"
    }
  ]
})

// 方案2：引用模式（适合大量子文档）
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com"
})

db.addresses.insertMany([
  {
    _id: "addr001",
    userId: "user001",
    type: "home",
    street: "朝阳区建国路88号",
    city: "北京"
  },
  {
    _id: "addr002",
    userId: "user001",
    type: "work",
    street: "海淀区中关村大街1号",
    city: "北京"
  }
])
```

### 3. 多对多关系

```javascript
// 用户和角色的多对多关系
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  roleIds: ["role001", "role002"]  // 引用角色ID
})

db.roles.insertOne({
  _id: "role001",
  name: "管理员",
  permissions: ["read", "write", "delete"]
})

// 或者使用中间集合
db.userRoles.insertMany([
  { userId: "user001", roleId: "role001" },
  { userId: "user001", roleId: "role002" }
])
```

## 📊 数据模型优化

### 1. 查询优化

```javascript
// 根据查询模式设计数据模型
// 如果经常需要查询用户及其最近订单
db.users.insertOne({
  _id: "user001",
  name: "张三",
  email: "zhangsan@example.com",
  // 嵌入最近订单信息，避免关联查询
  recentOrders: [
    {
      orderId: "order001",
      amount: 1500,
      date: new Date(),
      status: "completed"
    }
  ]
})

// 为常用查询创建索引
db.users.createIndex({ email: 1 })
db.users.createIndex({ "recentOrders.orderId": 1 })
```

### 2. 存储优化

```javascript
// 使用短字段名减少存储空间
db.users.insertOne({
  _id: "user001",
  n: "张三",           // name -> n
  e: "zhangsan@example.com",  // email -> e
  a: {                 // address -> a
    s: "朝阳区建国路88号",    // street -> s
    c: "北京"          // city -> c
  }
})

// 使用数字代替字符串
db.users.insertOne({
  _id: "user001",
  name: "张三",
  status: 1,  // 1:active, 2:inactive, 3:suspended
  type: 1     // 1:normal, 2:vip, 3:premium
})
```

### 3. 性能优化

```javascript
// 预计算常用字段
db.orders.insertOne({
  _id: "order001",
  customerId: "user001",
  products: [
    { productId: "product001", quantity: 2, price: 1000 },
    { productId: "product002", quantity: 1, price: 500 }
  ],
  // 预计算总金额，避免实时计算
  totalAmount: 2500,
  totalQuantity: 3,
  createdAt: new Date()
})

// 使用数组长度字段
db.posts.insertOne({
  _id: "post001",
  title: "MongoDB学习指南",
  content: "这是一篇关于MongoDB的学习文章...",
  comments: [
    { author: "李四", content: "很好的文章！" },
    { author: "王五", content: "学到了很多！" }
  ],
  // 预计算评论数量
  commentCount: 2
})
```

## 🛠️ 实践练习

### 练习1：电商系统数据建模

1. 设计用户、产品、订单的数据模型
2. 考虑用户购物车、订单历史等需求
3. 优化常用查询（用户订单、产品销量等）
4. 处理数据一致性问题
5. 测试数据模型的性能

### 练习2：博客系统数据建模

1. 设计用户、文章、评论的数据模型
2. 考虑文章分类、标签等需求
3. 优化文章列表、评论显示等查询
4. 处理文章和评论的关系
5. 实现文章搜索功能

### 练习3：社交网络数据建模

1. 设计用户、好友关系、动态的数据模型
2. 考虑用户关注、点赞等需求
3. 优化时间线、好友列表等查询
4. 处理大量用户和动态数据
5. 实现推荐系统数据模型

## ❓ 常见问题

### Q: 什么时候使用嵌入模式？

A: 当子文档数量少（<100个）、数据访问模式一致、更新频率低时使用嵌入模式。

### Q: 什么时候使用引用模式？

A: 当子文档数量多、数据访问模式不同、更新频率高时使用引用模式。

### Q: 如何选择文档大小？

A: MongoDB文档最大16MB，建议单个文档不超过几MB，避免影响性能。

### Q: 如何处理数据一致性？

A: 使用事务、应用层验证、定期数据清理等方式保证数据一致性。

### Q: 如何优化查询性能？

A: 根据查询模式设计数据模型、创建合适的索引、使用投影减少数据传输。

## ⚠️ 注意事项

1. **文档大小** - 避免创建过大的文档，影响性能
2. **数据一致性** - 合理处理数据一致性问题
3. **查询模式** - 根据实际查询需求设计数据模型
4. **扩展性** - 考虑未来需求变化，保持数据模型灵活性
5. **性能监控** - 定期监控数据模型性能，及时优化

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 设计合理的MongoDB数据模型
- [ ] 选择合适的建模模式
- [ ] 优化数据模型性能
- [ ] 处理复杂的数据关系
- [ ] 应用数据建模最佳实践

---

**下一步：** 学习 [08-security](./08-security.md) 安全与权限管理
