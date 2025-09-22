# 表设计

## 数据库设计基础

良好的表设计是构建高性能、可维护数据库系统的基础。合理的表结构设计不仅能提高查询性能，还能确保数据的一致性和完整性。

## 设计原则

### 第一范式（1NF）

确保每列都是原子性的，不可再分：

```sql
-- 不符合1NF的设计
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_name VARCHAR(50),
  products VARCHAR(255)  -- 存储多个产品，如"产品A,产品B,产品C"
);

-- 符合1NF的设计
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_name VARCHAR(50)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  product_name VARCHAR(100),
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 第二范式（2NF）

在1NF基础上消除非主属性对主键的部分函数依赖：

```sql
-- 不符合2NF的设计
CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  customer_name VARCHAR(50),  -- 依赖于order_id，而不是整个主键
  product_name VARCHAR(100),   -- 依赖于product_id，而不是整个主键
  quantity INT,
  PRIMARY KEY (order_id, product_id)
);

-- 符合2NF的设计
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_name VARCHAR(50)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  product_name VARCHAR(100)
);

CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  quantity INT,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 第三范式（3NF）

在2NF基础上消除非主属性对主键的传递函数依赖：

```sql
-- 不符合3NF的设计
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  department_id INT,
  department_name VARCHAR(50),  -- 依赖于department_id，存在传递依赖
  manager_id INT
);

-- 符合3NF的设计
CREATE TABLE departments (
  id INT PRIMARY KEY,
  department_name VARCHAR(50)
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  department_id INT,
  manager_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

## 主键设计

### 自增主键

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);
```

### UUID主键

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);

-- 插入数据时生成UUID
INSERT INTO users (id, name, email) VALUES 
(UUID(), '张三', 'zhangsan@example.com');
```

### 复合主键

```sql
CREATE TABLE user_roles (
  user_id INT,
  role_id INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

## 外键约束

外键用于建立表与表之间的关系，确保数据的一致性和完整性：

```sql
-- 创建部门表
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- 创建员工表，包含外键约束
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- 外键约束选项说明：
-- ON DELETE CASCADE: 删除父记录时自动删除子记录
-- ON DELETE SET NULL: 删除父记录时将外键字段设为NULL
-- ON DELETE RESTRICT: 拒绝删除有子记录的父记录
-- ON UPDATE CASCADE: 更新父记录主键时自动更新子记录外键
```

## 索引设计

### 唯一索引

```sql
-- 创建唯一索引
CREATE UNIQUE INDEX idx_user_email ON users(email);

-- 或在创建表时定义
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE
);
```

### 复合索引

```sql
-- 创建复合索引
CREATE INDEX idx_user_dept_status ON employees(department_id, status);

-- 注意字段顺序，应将选择性高的字段放在前面
```

### 前缀索引

对于较长的字符串字段，可以创建前缀索引：

```sql
-- 为前10个字符创建索引
CREATE INDEX idx_user_name_prefix ON users(name(10));
```

## 字段设计

### 选择合适的数据类型

```sql
-- 选择合适的整数类型
CREATE TABLE products (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 适合较小的ID范围
  price DECIMAL(10,2) NOT NULL,  -- 精确的货币类型
  stock MEDIUMINT UNSIGNED,       -- 适合中等范围的库存数
  is_active BOOLEAN DEFAULT TRUE  -- 布尔类型
);
```

### 使用默认值

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 避免NULL值

```sql
-- 尽量使用NOT NULL约束
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL DEFAULT '',  -- 使用默认值而不是NULL
  age TINYINT UNSIGNED NOT NULL DEFAULT 0
);
```

## 表关系设计

### 一对一关系

```sql
-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE
);

-- 用户详情表
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  full_name VARCHAR(100),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

### 一对多关系

```sql
-- 部门表
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- 员工表
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

### 多对多关系

```sql
-- 学生表
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- 课程表
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);

-- 中间表
CREATE TABLE student_courses (
  student_id INT,
  course_id INT,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

## 实践项目

为博客系统设计数据库表结构：

1. 用户表（users）
2. 文章表（articles）
3. 评论表（comments）
4. 标签表（tags）
5. 文章标签关联表（article_tags）

要求：

1. 合理设计主键和外键
2. 为常用查询字段创建索引
3. 遵循数据库设计范式
4. 考虑数据完整性和一致性
