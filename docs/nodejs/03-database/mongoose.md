# Mongoose使用

## 什么是Mongoose

Mongoose是Node.js中最流行的MongoDB对象建模工具。它提供了一个直接的、基于模式的解决方案来建模应用程序数据，包含了开箱即用的类型转换、验证、查询构建、业务逻辑钩子等开箱即用的功能。

## 安装与连接

### 安装Mongoose

```bash
npm install mongoose
```

### 连接MongoDB

```javascript
const mongoose = require('mongoose');

// 连接到MongoDB
mongoose.connect('mongodb://localhost:27017/myDatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 获取连接对象
const db = mongoose.connection;

// 连接事件处理
db.on('error', console.error.bind(console, '连接错误:'));
db.once('open', () => {
  console.log('MongoDB连接成功');
});
```

## Schema定义

Schema是Mongoose的核心概念，它定义了文档的结构、默认值、验证器等。

### 基本Schema定义

```javascript
const mongoose = require('mongoose');

// 定义用户Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建模型
const User = mongoose.model('User', userSchema);
```

### 数据类型

```javascript
const exampleSchema = new mongoose.Schema({
  // 基本类型
  name: String,
  age: Number,
  isAdult: Boolean,
  birthDate: Date,
  
  // 数组类型
  hobbies: [String],
  scores: [Number],
  
  // 嵌套文档
  address: {
    street: String,
    city: String,
    zipcode: String
  },
  
  // 嵌套文档数组
  comments: [
    {
      content: String,
      author: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  // 引用其他文档
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
```

## 模型操作

### 创建文档

```javascript
const User = require('./models/User');

// 创建单个文档
const user = new User({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 25
});

user.save()
  .then(savedUser => {
    console.log('用户保存成功:', savedUser);
  })
  .catch(err => {
    console.error('保存失败:', err);
  });

// 使用create方法
User.create({
  name: '李四',
  email: 'lisi@example.com',
  age: 30
})
.then(user => {
  console.log('用户创建成功:', user);
})
.catch(err => {
  console.error('创建失败:', err);
});

// 创建多个文档
User.create([
  { name: '王五', email: 'wangwu@example.com', age: 28 },
  { name: '赵六', email: 'zhaoliu@example.com', age: 32 }
])
.then(users => {
  console.log('用户批量创建成功:', users);
})
.catch(err => {
  console.error('批量创建失败:', err);
});
```

### 查询文档

```javascript
const User = require('./models/User');

// 查找所有文档
User.find()
  .then(users => {
    console.log('所有用户:', users);
  });

// 查找单个文档
User.findOne({ name: '张三' })
  .then(user => {
    console.log('找到用户:', user);
  });

// 通过ID查找
User.findById('someObjectId')
  .then(user => {
    console.log('通过ID找到用户:', user);
  });

// 条件查询
User.find({ age: { $gte: 18 } })
  .sort({ age: 1 })
  .limit(10)
  .then(users => {
    console.log('成年用户:', users);
  });

// 使用async/await
async function getUsers() {
  try {
    const users = await User.find({ age: { $gte: 18 } })
      .sort({ age: 1 })
      .limit(10);
    console.log('成年用户:', users);
  } catch (error) {
    console.error('查询失败:', error);
  }
}
```

### 更新文档

```javascript
const User = require('./models/User');

// 更新单个文档
User.updateOne(
  { name: '张三' },
  { $set: { age: 26 } }
)
.then(result => {
  console.log('更新结果:', result);
});

// 更新并返回更新后的文档
User.findOneAndUpdate(
  { name: '张三' },
  { $set: { age: 26 } },
  { new: true }  // 返回更新后的文档
)
.then(user => {
  console.log('更新后的用户:', user);
});

// 更新多个文档
User.updateMany(
  { age: { $lt: 18 } },
  { $set: { category: '未成年' } }
)
.then(result => {
  console.log('批量更新结果:', result);
});
```

### 删除文档

```javascript
const User = require('./models/User');

// 删除单个文档
User.deleteOne({ name: '张三' })
  .then(result => {
    console.log('删除结果:', result);
  });

// 删除并返回被删除的文档
User.findOneAndDelete({ name: '张三' })
  .then(user => {
    console.log('被删除的用户:', user);
  });

// 删除多个文档
User.deleteMany({ age: { $lt: 18 } })
  .then(result => {
    console.log('批量删除结果:', result);
  });
```

## 验证与中间件

### Schema验证

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '姓名是必填项'],
    minlength: [2, '姓名至少2个字符'],
    maxlength: [50, '姓名不能超过50个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} 不是有效的邮箱地址!`
    }
  },
  age: {
    type: Number,
    min: [0, '年龄不能为负数'],
    max: [120, '年龄不能超过120']
  }
});
```

### 中间件（钩子）

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// 保存前中间件
userSchema.pre('save', function(next) {
  // 密码加密
  if (this.isModified('password')) {
    this.password = encrypt(this.password);  // 假设encrypt是加密函数
  }
  next();
});

// 保存后中间件
userSchema.post('save', function(doc, next) {
  console.log('用户保存成功:', doc.name);
  next();
});

// 删除前中间件
userSchema.pre('remove', function(next) {
  // 清理相关数据
  // 删除用户的其他相关信息
  next();
});
```

## 关联查询

### 引用关联

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// 填充关联数据
Post.findOne({ title: '我的第一篇博客' })
  .populate('author')
  .then(post => {
    console.log('文章作者:', post.author.name);
  });

// 填充并选择特定字段
Post.findOne({ title: '我的第一篇博客' })
  .populate('author', 'name email')
  .then(post => {
    console.log('文章作者:', post.author);
  });
```

### 嵌套文档

```javascript
const commentSchema = new mongoose.Schema({
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  comments: [commentSchema]
});

const Post = mongoose.model('Post', postSchema);

// 添加评论
Post.findOneAndUpdate(
  { title: '我的第一篇博客' },
  { $push: { comments: { content: '很好的文章!', author: '读者A' } } },
  { new: true }
)
.then(post => {
  console.log('更新后的文章:', post);
});
```

## 实践项目

在博客系统中使用Mongoose实现数据模型：

1. 创建用户模型（User）
2. 创建文章模型（Post）
3. 创建评论模型（Comment）
4. 实现模型间的关联关系
5. 实现基本的CRUD操作
6. 添加数据验证和中间件
