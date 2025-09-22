# SQL查询

## SQL基础

SQL（Structured Query Language）是用于管理关系型数据库的标准语言。掌握SQL查询是数据库操作的核心技能。

## 基本查询

### SELECT语句

```sql
-- 查询所有字段
SELECT * FROM users;

-- 查询指定字段
SELECT name, age FROM users;

-- 查询去重
SELECT DISTINCT city FROM users;

-- 查询并重命名字段
SELECT name AS 用户名, age AS 年龄 FROM users;
```

### WHERE子句

```sql
-- 简单条件查询
SELECT * FROM users WHERE age > 25;

-- 多条件查询
SELECT * FROM users WHERE age > 25 AND city = '北京';

-- 范围查询
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- 集合查询
SELECT * FROM users WHERE city IN ('北京', '上海', '广州');

-- 模糊查询
SELECT * FROM users WHERE name LIKE '张%';

-- 空值查询
SELECT * FROM users WHERE email IS NULL;
```

### ORDER BY子句

```sql
-- 升序排序
SELECT * FROM users ORDER BY age ASC;

-- 降序排序
SELECT * FROM users ORDER BY age DESC;

-- 多字段排序
SELECT * FROM users ORDER BY city ASC, age DESC;
```

### LIMIT子句

```sql
-- 限制返回记录数
SELECT * FROM users LIMIT 10;

-- 分页查询
SELECT * FROM users LIMIT 10 OFFSET 20;  -- 跳过前20条，返回接下来的10条
```

## 聚合查询

### 聚合函数

```sql
-- 计数
SELECT COUNT(*) FROM users;
SELECT COUNT(email) FROM users;  -- 不包含NULL值

-- 求和
SELECT SUM(age) FROM users;

-- 平均值
SELECT AVG(age) FROM users;

-- 最大值和最小值
SELECT MAX(age), MIN(age) FROM users;
```

### GROUP BY子句

```sql
-- 按城市分组统计用户数量
SELECT city, COUNT(*) as user_count FROM users GROUP BY city;

-- 按城市分组统计平均年龄
SELECT city, AVG(age) as avg_age FROM users GROUP BY city;

-- 多字段分组
SELECT city, gender, COUNT(*) as user_count FROM users GROUP BY city, gender;
```

### HAVING子句

```sql
-- 筛选分组结果
SELECT city, COUNT(*) as user_count FROM users GROUP BY city HAVING user_count > 5;

-- 结合WHERE和HAVING
SELECT city, AVG(age) as avg_age FROM users 
WHERE age > 18 GROUP BY city HAVING avg_age > 25;
```

## 连接查询

### 内连接（INNER JOIN）

```sql
-- 查询用户及其部门信息
SELECT u.name, d.name as department_name 
FROM users u 
INNER JOIN departments d ON u.department_id = d.id;
```

### 左连接（LEFT JOIN）

```sql
-- 查询所有用户及其部门信息（包括没有部门的用户）
SELECT u.name, d.name as department_name 
FROM users u 
LEFT JOIN departments d ON u.department_id = d.id;
```

### 右连接（RIGHT JOIN）

```sql
-- 查询所有部门及其用户信息（包括没有用户的部门）
SELECT u.name, d.name as department_name 
FROM users u 
RIGHT JOIN departments d ON u.department_id = d.id;
```

### 全连接（FULL JOIN）

MySQL不直接支持FULL JOIN，但可以通过UNION实现：

```sql
-- 查询所有用户和部门信息
SELECT u.name, d.name as department_name 
FROM users u 
LEFT JOIN departments d ON u.department_id = d.id
UNION
SELECT u.name, d.name as department_name 
FROM users u 
RIGHT JOIN departments d ON u.department_id = d.id;
```

### 自连接

```sql
-- 查询员工及其经理信息
SELECT e.name as employee_name, m.name as manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## 子查询

### 标量子查询

```sql
-- 查询年龄大于平均年龄的用户
SELECT * FROM users WHERE age > (SELECT AVG(age) FROM users);
```

### 列子查询

```sql
-- 查询在指定城市工作的用户
SELECT * FROM users WHERE department_id IN 
(SELECT id FROM departments WHERE city = '北京');
```

### 行子查询

```sql
-- 查询与指定用户同部门且年龄相同的用户
SELECT * FROM users WHERE (department_id, age) = 
(SELECT department_id, age FROM users WHERE name = '张三');
```

### 表子查询

```sql
-- 使用子查询结果作为临时表
SELECT temp.name, temp.avg_age 
FROM (SELECT city, AVG(age) as avg_age FROM users GROUP BY city) temp 
WHERE temp.avg_age > 25;
```

## 高级查询

### UNION操作

```sql
-- 合并查询结果（去重）
SELECT name FROM users WHERE city = '北京'
UNION
SELECT name FROM users WHERE age > 30;

-- 合并查询结果（不去重）
SELECT name FROM users WHERE city = '北京'
UNION ALL
SELECT name FROM users WHERE age > 30;
```

### CASE表达式

```sql
-- 条件判断
SELECT name, age,
  CASE 
    WHEN age < 18 THEN '未成年'
    WHEN age < 60 THEN '成年'
    ELSE '老年'
  END as age_group
FROM users;
```

### 窗口函数

```sql
-- 排名函数
SELECT name, age, 
  ROW_NUMBER() OVER (ORDER BY age DESC) as rank_num
FROM users;

-- 分组排名
SELECT name, department_id, age,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY age DESC) as dept_rank
FROM users;

-- 累计求和
SELECT date, sales,
  SUM(sales) OVER (ORDER BY date) as cumulative_sales
FROM daily_sales;
```

## 查询优化

### 使用EXPLAIN分析查询

```sql
-- 分析查询执行计划
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 更详细的分析
EXPLAIN FORMAT=JSON SELECT u.name, d.name 
FROM users u 
INNER JOIN departments d ON u.department_id = d.id;
```

### 索引优化

```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_user_age ON users(age);
CREATE INDEX idx_user_dept_status ON users(department_id, status);

-- 复合索引字段顺序很重要
-- 如果经常按department_id查询，应该这样创建索引
CREATE INDEX idx_user_dept_status ON users(department_id, status);
-- 而不是
CREATE INDEX idx_user_status_dept ON users(status, department_id);
```

### 避免全表扫描

```sql
-- 好的查询：使用索引
SELECT * FROM users WHERE id = 100;

-- 好的查询：使用索引范围查询
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- 避免在索引字段上使用函数
-- 不好的查询：无法使用索引
SELECT * FROM users WHERE YEAR(created_at) = 2023;

-- 好的查询：可以使用索引
SELECT * FROM users WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';
```

## 实践项目

在博客系统中实现以下查询功能：

1. 查询所有文章及其作者信息
2. 查询每个用户发布的文章数量
3. 查询评论数量最多的前10篇文章
4. 查询每个标签下的文章数量
5. 实现文章分页查询功能
6. 查询最近一个月发布的文章
