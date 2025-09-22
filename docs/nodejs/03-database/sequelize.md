# Sequelize使用

## 什么是Sequelize

Sequelize是一个基于Promise的Node.js ORM（对象关系映射）工具，支持多种数据库包括PostgreSQL、MySQL、MariaDB、SQLite和Microsoft SQL Server。它提供了强大的功能如关联查询、事务、读取复制等。

## 安装与配置

### 安装Sequelize

```bash
# 安装Sequelize
npm install sequelize

# 安装数据库驱动（以MySQL为例）
npm install mysql2
```

### 连接数据库

```javascript
const { Sequelize } = require('sequelize');

// 创建Sequelize实例
const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: false,  // 禁用SQL日志
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 测试连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

testConnection();
```

## 模型定义

### 基本模型定义

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// 定义用户模型
const User = sequelize.define('User', {
  // 模型属性
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  age: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 120
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  // 模型选项
  tableName: 'users',
  timestamps: true,  // 启用时间戳
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
```

### 数据类型映射

```javascript
const { DataTypes } = require('sequelize');

const exampleSchema = {
  // 字符串类型
  stringField: DataTypes.STRING,        // VARCHAR(255)
  textFiled: DataTypes.TEXT,            // TEXT
  charField: DataTypes.CHAR(10),        // CHAR(10)
  
  // 数值类型
  integerField: DataTypes.INTEGER,      // INTEGER
  bigIntField: DataTypes.BIGINT,        // BIGINT
  floatField: DataTypes.FLOAT,          // FLOAT
  doubleField: DataTypes.DOUBLE,        // DOUBLE
  decimalField: DataTypes.DECIMAL(10, 2), // DECIMAL(10,2)
  
  // 布尔类型
  booleanField: DataTypes.BOOLEAN,      // BOOLEAN
  
  // 日期时间类型
  dateField: DataTypes.DATE,            // DATETIME
  dateOnlyField: DataTypes.DATEONLY,    // DATE (仅日期)
  
  // 其他类型
  jsonField: DataTypes.JSON,            // JSON
  enumField: DataTypes.ENUM('a', 'b', 'c'), // ENUM
  
  // UUID
  uuidField: DataTypes.UUID             // UUID
};
```

## 模型同步

```javascript
const sequelize = require('./database');
const User = require('./models/User');
const Post = require('./models/Post');

// 同步单个模型
User.sync({ alter: true })  // alter: true 会修改表结构以匹配模型
  .then(() => {
    console.log('用户表同步完成');
  });

// 同步所有模型
sequelize.sync({ alter: true })
  .then(() => {
    console.log('所有表同步完成');
  });

// 强制同步（删除并重新创建表）
sequelize.sync({ force: true })
  .then(() => {
    console.log('所有表强制同步完成');
  });
```

## 基本操作

### 创建记录

```javascript
const User = require('./models/User');

// 创建单个记录
async function createUser() {
  try {
    const user = await User.create({
      name: '张三',
      email: 'zhangsan@example.com',
      age: 25
    });
    console.log('用户创建成功:', user.toJSON());
  } catch (error) {
    console.error('创建失败:', error);
  }
}

// 批量创建记录
async function createUsers() {
  try {
    const users = await User.bulkCreate([
      { name: '李四', email: 'lisi@example.com', age: 30 },
      { name: '王五', email: 'wangwu@example.com', age: 28 }
    ]);
    console.log('用户批量创建成功:', users.length);
  } catch (error) {
    console.error('批量创建失败:', error);
  }
}
```

### 查询记录

```javascript
const User = require('./models/User');

// 查找所有记录
async function findAllUsers() {
  try {
    const users = await User.findAll();
    console.log('所有用户:', users.map(u => u.toJSON()));
  } catch (error) {
    console.error('查询失败:', error);
  }
}

// 条件查询
async function findUsers() {
  try {
    // 简单条件
    const users = await User.findAll({
      where: {
        age: {
          [Sequelize.Op.gt]: 18
        }
      },
      order: [['age', 'ASC']],
      limit: 10
    });
    
    // 复杂条件
    const complexUsers = await User.findAll({
      where: {
        [Sequelize.Op.or]: [
          { name: '张三' },
          { age: { [Sequelize.Op.gt]: 25 } }
        ]
      }
    });
    
    console.log('条件查询结果:', users.map(u => u.toJSON()));
  } catch (error) {
    console.error('条件查询失败:', error);
  }
}

// 查找单个记录
async function findUser() {
  try {
    const user = await User.findOne({
      where: { name: '张三' }
    });
    
    if (user) {
      console.log('找到用户:', user.toJSON());
    } else {
      console.log('未找到用户');
    }
  } catch (error) {
    console.error('查找失败:', error);
  }
}
```

### 更新记录

```javascript
const User = require('./models/User');

// 更新记录
async function updateUser() {
  try {
    const [updatedRowsCount] = await User.update(
      { age: 26 },
      { where: { name: '张三' } }
    );
    
    console.log('更新记录数:', updatedRowsCount);
  } catch (error) {
    console.error('更新失败:', error);
  }
}

// 查找并更新
async function findAndUpdateUser() {
  try {
    const user = await User.findOne({ where: { name: '张三' } });
    
    if (user) {
      user.age = 26;
      await user.save();
      console.log('用户更新成功:', user.toJSON());
    }
  } catch (error) {
    console.error('查找并更新失败:', error);
  }
}
```

### 删除记录

```javascript
const User = require('./models/User');

// 删除记录
async function deleteUser() {
  try {
    const deletedRowsCount = await User.destroy({
      where: { name: '张三' }
    });
    
    console.log('删除记录数:', deletedRowsCount);
  } catch (error) {
    console.error('删除失败:', error);
  }
}

// 查找并删除
async function findAndDeleteUser() {
  try {
    const user = await User.findOne({ where: { name: '张三' } });
    
    if (user) {
      await user.destroy();
      console.log('用户删除成功');
    }
  } catch (error) {
    console.error('查找并删除失败:', error);
  }
}
```

## 关联关系

### 一对一关联

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// 用户模型
const User = sequelize.define('User', {
  name: DataTypes.STRING
});

// 用户详情模型
const UserProfile = sequelize.define('UserProfile', {
  bio: DataTypes.TEXT,
  avatar: DataTypes.STRING
});

// 建立一对一关联
User.hasOne(UserProfile);
UserProfile.belongsTo(User);

// 使用关联
async function createUserWithProfile() {
  try {
    const user = await User.create({
      name: '张三',
      UserProfile: {
        bio: '这是我的简介',
        avatar: 'avatar.jpg'
      }
    }, {
      include: [UserProfile]
    });
    
    console.log('用户及详情创建成功:', user.toJSON());
  } catch (error) {
    console.error('创建失败:', error);
  }
}
```

### 一对多关联

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// 用户模型
const User = sequelize.define('User', {
  name: DataTypes.STRING
});

// 文章模型
const Post = sequelize.define('Post', {
  title: DataTypes.STRING,
  content: DataTypes.TEXT
});

// 建立一对多关联
User.hasMany(Post);
Post.belongsTo(User);

// 使用关联
async function getUserWithPosts() {
  try {
    const user = await User.findByPk(1, {
      include: [Post]
    });
    
    console.log('用户及其文章:', user.toJSON());
  } catch (error) {
    console.error('查询失败:', error);
  }
}
```

### 多对多关联

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// 学生模型
const Student = sequelize.define('Student', {
  name: DataTypes.STRING
});

// 课程模型
const Course = sequelize.define('Course', {
  title: DataTypes.STRING
});

// 建立多对多关联
Student.belongsToMany(Course, { through: 'StudentCourses' });
Course.belongsToMany(Student, { through: 'StudentCourses' });

// 使用关联
async function enrollStudent() {
  try {
    const student = await Student.findByPk(1);
    const course = await Course.findByPk(1);
    
    await student.addCourse(course);
    console.log('学生选课成功');
  } catch (error) {
    console.error('选课失败:', error);
  }
}
```

## 实践项目

在博客系统中使用Sequelize实现数据模型：

1. 创建用户模型（User）
2. 创建文章模型（Post）
3. 创建评论模型（Comment）
4. 实现模型间的关联关系
5. 实现基本的CRUD操作
6. 添加数据验证
