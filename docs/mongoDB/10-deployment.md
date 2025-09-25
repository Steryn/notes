# 10 - MongoDB部署与运维

## 🎯 学习目标

- 掌握MongoDB生产环境部署策略
- 理解高可用性和可扩展性配置
- 学会备份恢复和灾难恢复
- 熟悉运维监控和故障排除

## 🏗️ 部署架构

### 1. 单机部署

**适用场景：**

- 开发测试环境
- 小规模应用
- 学习演示

```yaml
# 单机配置文件
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
```

### 2. 副本集部署

**适用场景：**

- 生产环境
- 需要高可用性
- 读写分离

```javascript
// 副本集配置
{
  "_id": "rs0",
  "members": [
    {
      "_id": 0,
      "host": "mongodb1:27017",
      "priority": 2
    },
    {
      "_id": 1,
      "host": "mongodb2:27017",
      "priority": 1
    },
    {
      "_id": 2,
      "host": "mongodb3:27017",
      "priority": 1
    }
  ]
}
```

### 3. 分片集群部署

**适用场景：**

- 大数据量
- 需要水平扩展
- 高并发访问

```javascript
// 分片集群配置
// 配置服务器
configsvr:
  _id: "configReplSet"
  members:
    - _id: 0
      host: "config1:27019"
    - _id: 1
      host: "config2:27019"
    - _id: 2
      host: "config3:27019"

// 分片服务器
shards:
  - _id: "shard1"
    members:
      - _id: 0
        host: "shard1a:27018"
      - _id: 1
        host: "shard1b:27018"
      - _id: 2
        host: "shard1c:27018"
```

## 🔄 高可用性配置

### 1. 副本集配置

```javascript
// 初始化副本集
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb1:27017" },
    { _id: 1, host: "mongodb2:27017" },
    { _id: 2, host: "mongodb3:27017" }
  ]
})

// 查看副本集状态
rs.status()

// 添加新成员
rs.add("mongodb4:27017")

// 移除成员
rs.remove("mongodb4:27017")

// 设置优先级
rs.reconfig({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb1:27017", priority: 2 },
    { _id: 1, host: "mongodb2:27017", priority: 1 },
    { _id: 2, host: "mongodb3:27017", priority: 1 }
  ]
})
```

### 2. 读写分离

```javascript
// 读取偏好设置
db.users.find().readPref("secondary")

// 连接字符串配置
mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/database?replicaSet=rs0&readPreference=secondary

// 应用程序配置
const client = new MongoClient(uri, {
  readPreference: 'secondary',
  readPreferenceTags: [{ region: 'east' }]
});
```

### 3. 故障转移

```javascript
// 自动故障转移
// MongoDB会自动检测主节点故障并选举新的主节点

// 手动故障转移
rs.stepDown()

// 查看选举状态
rs.status().members.forEach(member => {
  console.log(`${member.name}: ${member.stateStr}`)
})
```

## 📊 分片集群

### 1. 分片配置

```javascript
// 启用分片
sh.enableSharding("myapp")

// 创建分片键
sh.shardCollection("myapp.users", { userId: "hashed" })

// 查看分片状态
sh.status()

// 查看分片分布
sh.getBalancerState()
```

### 2. 分片键选择

```javascript
// 好的分片键特征
// 1. 高基数（唯一值多）
// 2. 均匀分布
// 3. 查询模式匹配

// 示例：用户ID分片
sh.shardCollection("myapp.users", { userId: "hashed" })

// 示例：复合分片键
sh.shardCollection("myapp.orders", { customerId: 1, orderDate: 1 })
```

### 3. 数据平衡

```javascript
// 查看平衡器状态
sh.getBalancerState()

// 手动触发平衡
sh.startBalancer()

// 停止平衡器
sh.stopBalancer()

// 设置平衡窗口
sh.setBalancerState(true, { activeWindow: { start: "02:00", stop: "06:00" } })
```

## 💾 备份与恢复

### 1. 备份策略

```bash
# 使用mongodump备份
mongodump --host localhost:27017 --db myapp --out /backup/$(date +%Y%m%d)

# 备份特定集合
mongodump --host localhost:27017 --db myapp --collection users --out /backup

# 压缩备份
mongodump --host localhost:27017 --db myapp --gzip --out /backup

# 备份到远程服务器
mongodump --host localhost:27017 --db myapp --out /backup | ssh user@remote "cat > backup.tar.gz"
```

### 2. 恢复数据

```bash
# 使用mongorestore恢复
mongorestore --host localhost:27017 --db myapp /backup/myapp

# 恢复特定集合
mongorestore --host localhost:27017 --db myapp --collection users /backup/myapp/users.bson

# 从压缩文件恢复
mongorestore --host localhost:27017 --db myapp --gzip /backup/myapp

# 恢复时重命名数据库
mongorestore --host localhost:27017 --db newapp /backup/myapp
```

### 3. 增量备份

```bash
# 使用oplog进行增量备份
mongodump --host localhost:27017 --oplog --out /backup/$(date +%Y%m%d)

# 恢复oplog
mongorestore --host localhost:27017 --oplogReplay /backup/20240101/oplog.bson
```

## 🔧 运维监控

### 1. 系统监控

```javascript
// 查看服务器状态
db.serverStatus()

// 查看数据库统计
db.stats()

// 查看集合统计
db.users.stats()

// 查看索引统计
db.users.aggregate([{ $indexStats: {} }])
```

### 2. 性能监控

```javascript
// 启用慢查询分析
db.setProfilingLevel(2, { slowms: 100 })

// 查看慢查询
db.system.profile.find().sort({ ts: -1 }).limit(5)

// 分析查询性能
db.users.find({ age: { $gte: 25 } }).explain("executionStats")
```

### 3. 告警配置

```yaml
# 告警规则示例
alerts:
  - name: "High CPU Usage"
    condition: "cpu_usage > 80"
    duration: "5m"
    action: "send_email"
  
  - name: "Slow Queries"
    condition: "slow_queries > 10"
    duration: "1m"
    action: "send_slack"
  
  - name: "Disk Space Low"
    condition: "disk_usage > 90"
    duration: "1m"
    action: "send_email"
```

## 🚨 故障排除

### 1. 常见问题

**连接问题：**

```bash
# 检查MongoDB服务状态
sudo systemctl status mongod

# 检查端口是否开放
netstat -tlnp | grep 27017

# 检查防火墙设置
sudo ufw status
```

**性能问题：**

```javascript
// 检查慢查询
db.system.profile.find({ millis: { $gt: 100 } })

// 检查索引使用情况
db.users.aggregate([{ $indexStats: {} }])

// 检查内存使用
db.serverStatus().mem
```

**数据一致性问题：**

```javascript
// 检查副本集状态
rs.status()

// 检查数据同步
rs.printSlaveReplicationInfo()

// 检查分片平衡
sh.status()
```

### 2. 故障恢复

**主节点故障：**

```javascript
// 检查副本集状态
rs.status()

// 手动选举主节点
rs.stepDown()

// 重新配置副本集
rs.reconfig(config)
```

**数据损坏：**

```bash
# 使用repairDatabase修复
mongod --repair --dbpath /var/lib/mongodb

# 从备份恢复
mongorestore --host localhost:27017 --db myapp /backup/myapp
```

**分片不平衡：**

```javascript
// 检查分片状态
sh.status()

// 手动触发平衡
sh.startBalancer()

// 检查平衡器状态
sh.getBalancerState()
```

## 🛠️ 实践练习

### 练习1：副本集部署

1. 部署3节点副本集
2. 配置自动故障转移
3. 测试读写分离
4. 模拟节点故障
5. 验证数据一致性

### 练习2：分片集群部署

1. 部署分片集群
2. 配置分片键
3. 测试数据分布
4. 监控集群状态
5. 优化分片性能

### 练习3：备份恢复

1. 制定备份策略
2. 执行全量备份
3. 执行增量备份
4. 测试恢复流程
5. 验证数据完整性

## ❓ 常见问题

### Q: 如何选择部署架构？

A: 根据数据量、并发量、可用性要求选择单机、副本集或分片集群。

### Q: 如何优化分片性能？

A: 1. 选择合适的分片键 2. 监控数据分布 3. 优化查询路由 4. 调整平衡器设置

### Q: 如何保证数据安全？

A: 1. 定期备份 2. 测试恢复流程 3. 监控数据一致性 4. 实施安全策略

### Q: 如何监控MongoDB性能？

A: 使用内置工具、第三方监控工具、设置告警、定期分析性能数据。

### Q: 如何处理故障？

A: 1. 建立监控告警 2. 制定故障处理流程 3. 定期演练 4. 记录故障处理经验

## ⚠️ 注意事项

1. **生产环境** - 生产环境部署前进行充分测试
2. **监控告警** - 建立完善的监控和告警机制
3. **备份策略** - 制定并执行定期备份策略
4. **安全配置** - 配置适当的安全策略
5. **文档记录** - 记录部署和运维过程

## 🎯 学习检查

完成本课后，你应该能够：

- [ ] 部署MongoDB生产环境
- [ ] 配置高可用性架构
- [ ] 实施备份恢复策略
- [ ] 监控和运维MongoDB
- [ ] 处理常见故障

---

**🎉 恭喜！你已经完成了MongoDB的完整学习！**

现在你已经掌握了MongoDB的核心概念、操作技能和最佳实践。建议你：

1. 继续实践和项目应用
2. 关注MongoDB最新发展
3. 参与社区讨论
4. 考虑获得MongoDB认证

**继续学习：** 可以深入学习其他数据库技术或开始实际项目开发。
