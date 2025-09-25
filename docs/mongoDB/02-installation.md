# 02 - MongoDB安装与配置

## 🎯 学习目标

- 掌握MongoDB在不同平台的安装方法
- 了解MongoDB的配置选项
- 学会启动和停止MongoDB服务
- 熟悉MongoDB的基本配置管理

## 🖥️ 安装方法

### 方法一：官方安装包（推荐）

#### Windows安装

1. **下载安装包**
   - 访问 [MongoDB官网](https://www.mongodb.com/try/download/community)
   - 选择Windows版本下载

2. **运行安装程序**

   ```bash
   # 下载完成后运行.msi文件
   # 选择"Complete"完整安装
   # 勾选"Install MongoDB as a Service"
   ```

3. **验证安装**

   ```bash
   # 打开命令提示符
   mongod --version
   mongo --version  # 或 mongosh --version (新版本)
   ```

#### macOS安装

1. **使用Homebrew（推荐）**

   ```bash
   # 安装Homebrew（如果未安装）
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # 安装MongoDB
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **手动安装**

   ```bash
   # 下载.tar.gz文件
   # 解压到/usr/local/mongodb
   sudo tar -zxvf mongodb-macos-x86_64-7.0.4.tgz -C /usr/local/mongodb
   
   # 添加到PATH
   echo 'export PATH="/usr/local/mongodb/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

#### Linux安装

1. **Ubuntu/Debian**

   ```bash
   # 导入公钥
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   
   # 添加软件源
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # 更新包列表并安装
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **CentOS/RHEL**

   ```bash
   # 创建repo文件
   sudo vi /etc/yum.repos.d/mongodb-org-7.0.repo
   
   # 添加以下内容：
   [mongodb-org-7.0]
   name=MongoDB Repository
   baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
   gpgcheck=1
   enabled=1
   gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
   
   # 安装MongoDB
   sudo yum install -y mongodb-org
   ```

### 方法二：Docker安装（开发环境）

```bash
# 拉取MongoDB镜像
docker pull mongo:7.0

# 运行MongoDB容器
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0

# 进入容器
docker exec -it mongodb mongosh
```

### 方法三：MongoDB Atlas（云服务）

1. **注册账号**
   - 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 创建免费账号

2. **创建集群**
   - 选择免费套餐（M0）
   - 选择云服务商和区域
   - 配置集群名称

3. **获取连接字符串**

   ```javascript
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```

## ⚙️ 配置管理

### 1. 配置文件位置

| 平台 | 默认配置文件位置 |
|------|-----------------|
| Windows | `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg` |
| macOS | `/usr/local/etc/mongod.conf` |
| Linux | `/etc/mongod.conf` |

### 2. 基本配置选项

```yaml
# /etc/mongod.conf
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled  # 启用认证
```

### 3. 重要配置说明

#### 存储配置

```yaml
storage:
  dbPath: /data/db          # 数据目录
  journal:
    enabled: true           # 启用日志
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1        # 缓存大小
```

#### 网络配置

```yaml
net:
  port: 27017              # 端口号
  bindIp: 0.0.0.0          # 绑定IP（0.0.0.0表示所有IP）
  maxIncomingConnections: 100  # 最大连接数
```

#### 安全配置

```yaml
security:
  authorization: enabled    # 启用认证
  keyFile: /path/to/keyfile # 副本集密钥文件
```

## 🚀 服务管理

### Windows服务管理

```bash
# 启动服务
net start MongoDB

# 停止服务
net stop MongoDB

# 重启服务
net stop MongoDB && net start MongoDB
```

### macOS/Linux服务管理

```bash
# 启动服务
sudo systemctl start mongod

# 停止服务
sudo systemctl stop mongod

# 重启服务
sudo systemctl restart mongod

# 设置开机自启
sudo systemctl enable mongod

# 查看服务状态
sudo systemctl status mongod
```

### 手动启动

```bash
# 使用默认配置启动
mongod

# 指定配置文件启动
mongod --config /etc/mongod.conf

# 指定数据目录启动
mongod --dbpath /data/db --port 27017

# 后台运行
mongod --fork --logpath /var/log/mongodb/mongod.log
```

## 🔧 连接工具

### 1. MongoDB Shell (mongosh)

```bash
# 连接到本地MongoDB
mongosh

# 连接到远程MongoDB
mongosh "mongodb://username:password@host:port/database"

# 连接到MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/"
```

### 2. MongoDB Compass

- 官方图形界面工具
- 下载地址：<https://www.mongodb.com/products/compass>
- 支持数据浏览、查询、索引管理等功能

### 3. 第三方工具

- **Robo 3T** - 轻量级GUI工具
- **Studio 3T** - 专业版GUI工具
- **NoSQLBooster** - 功能丰富的GUI工具

## 🛠️ 实践练习

### 练习1：安装验证

1. 安装MongoDB到你的系统
2. 启动MongoDB服务
3. 使用mongosh连接到数据库
4. 运行`db.runCommand({hello: 1})`验证连接

### 练习2：配置管理

1. 修改MongoDB配置文件
2. 更改默认端口为27018
3. 重启服务并验证新端口
4. 恢复默认配置

### 练习3：Docker部署

1. 使用Docker运行MongoDB
2. 创建数据卷持久化数据
3. 配置网络访问
4. 使用GUI工具连接

## ❓ 常见问题

### Q: 安装后无法启动MongoDB？

A: 检查以下几点：

- 数据目录权限是否正确
- 端口27017是否被占用
- 配置文件语法是否正确
- 系统资源是否充足

### Q: 如何更改MongoDB端口？

A: 修改配置文件中的`net.port`选项，或使用`--port`参数启动。

### Q: MongoDB占用内存过多怎么办？

A: 调整`storage.wiredTiger.engineConfig.cacheSizeGB`配置，限制缓存大小。

### Q: 如何备份MongoDB数据？

A: 使用`mongodump`命令或直接复制数据目录文件。

### Q: 忘记MongoDB密码怎么办？

A: 以无认证模式启动MongoDB，重新设置用户密码。

## ⚠️ 注意事项

1. **权限管理** - 确保MongoDB进程有足够的数据目录权限
2. **端口安全** - 生产环境不要绑定到0.0.0.0
3. **日志管理** - 定期清理日志文件，避免磁盘空间不足
4. **版本兼容** - 注意客户端驱动与服务器版本兼容性
5. **资源监控** - 监控内存、CPU、磁盘使用情况

## 🔍 故障排除

### 常见错误及解决方案

#### 错误1：端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr :27017  # Windows
lsof -i :27017                 # macOS/Linux

# 杀死进程
taskkill /PID <PID> /F          # Windows
kill -9 <PID>                   # macOS/Linux
```

#### 错误2：权限不足

```bash
# 修改数据目录权限
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chmod 755 /var/lib/mongodb
```

#### 错误3：配置文件错误

```bash
# 验证配置文件语法
mongod --config /etc/mongod.conf --configExpand rest
```

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 在不同平台安装MongoDB
- [ ] 配置MongoDB基本参数
- [ ] 管理MongoDB服务
- [ ] 使用各种连接工具
- [ ] 解决常见安装问题

---

**下一步：** 学习 [03-crud](./03-crud.md) 基本CRUD操作
