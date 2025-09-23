# Docker监控与日志

## 监控基础

Docker监控是确保容器化应用稳定运行的关键。有效的监控可以帮助我们及时发现问题、优化性能、确保服务质量。

## 监控层次

### 1. 基础设施监控

- 主机资源使用情况
- 网络性能
- 存储性能

### 2. 容器监控

- 容器资源使用
- 容器健康状态
- 容器生命周期

### 3. 应用监控

- 应用性能指标
- 业务指标
- 用户体验指标

## 监控工具

### 1. Docker内置监控

```bash
# 查看容器资源使用
docker stats

# 查看容器详细信息
docker inspect container_id

# 查看容器进程
docker top container_id

# 查看容器事件
docker events

# 查看系统信息
docker system df
docker system info
```

### 2. Prometheus + Grafana

#### Prometheus配置

创建`prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'docker'
    static_configs:
      - targets: ['docker-exporter:9323']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Grafana仪表板

创建`docker-compose.monitoring.yml`：

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg

  docker-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9323:9323"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command:
      - '--collector.docker'

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
```

### 3. ELK Stack

创建`docker-compose.logging.yml`：

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.14.0
    user: root
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash

volumes:
  elasticsearch-data:
```

## 日志管理

### 1. 日志驱动

```bash
# 使用json-file驱动（默认）
docker run --log-driver=json-file nginx

# 使用syslog驱动
docker run --log-driver=syslog --log-opt syslog-address=udp://localhost:514 nginx

# 使用fluentd驱动
docker run --log-driver=fluentd --log-opt fluentd-address=localhost:24224 nginx

# 使用gelf驱动
docker run --log-driver=gelf --log-opt gelf-address=udp://localhost:12201 nginx
```

### 2. 日志配置

创建`filebeat.yml`：

```yaml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

创建`logstash.conf`：

```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  if [docker][container][name] {
    mutate {
      add_field => { "container_name" => "%{[docker][container][name]}" }
    }
  }
  
  if [docker][container][labels][com_docker_compose_service] {
    mutate {
      add_field => { "service_name" => "%{[docker][container][labels][com_docker_compose_service]}" }
    }
  }
  
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "docker-logs-%{+YYYY.MM.dd}"
  }
}
```

### 3. 日志轮转

创建`logrotate.conf`：

```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    postrotate
        docker kill -s USR1 $(docker ps -q) 2>/dev/null || true
    endscript
}
```

## 实践练习

### 练习1：基础监控设置

```bash
# 1. 启动监控服务
docker-compose -f docker-compose.monitoring.yml up -d

# 2. 查看Prometheus指标
curl http://localhost:9090/api/v1/query?query=up

# 3. 访问Grafana
# 打开 http://localhost:3000
# 用户名: admin, 密码: admin

# 4. 查看容器指标
curl http://localhost:8080/metrics
```

### 练习2：日志收集

```bash
# 1. 启动日志服务
docker-compose -f docker-compose.logging.yml up -d

# 2. 生成测试日志
docker run --rm nginx:alpine echo "测试日志消息"

# 3. 查看Elasticsearch中的日志
curl http://localhost:9200/docker-logs-*/_search?pretty

# 4. 访问Kibana
# 打开 http://localhost:5601
```

### 练习3：告警配置

创建`alert_rules.yml`：

```yaml
groups:
- name: docker_alerts
  rules:
  - alert: HighCPUUsage
    expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "容器CPU使用率过高"
      description: "容器 {{ $labels.name }} CPU使用率超过80%"

  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "容器内存使用率过高"
      description: "容器 {{ $labels.name }} 内存使用率超过80%"

  - alert: ContainerDown
    expr: up{job="docker"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "容器停止运行"
      description: "容器 {{ $labels.name }} 已停止运行"
```

创建`alertmanager.yml`：

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@example.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/'
    send_resolved: true

- name: 'email'
  email_configs:
  - to: 'admin@example.com'
    subject: 'Docker告警: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      告警: {{ .Annotations.summary }}
      描述: {{ .Annotations.description }}
      时间: {{ .StartsAt }}
      {{ end }}
```

## 监控最佳实践

### 1. 指标选择

```yaml
# 关键指标
- CPU使用率
- 内存使用率
- 磁盘I/O
- 网络I/O
- 容器健康状态
- 应用响应时间
- 错误率
```

### 2. 告警策略

```yaml
# 告警级别
- Critical: 服务不可用
- Warning: 性能下降
- Info: 状态变化

# 告警规则
- 基于阈值
- 基于趋势
- 基于异常检测
```

### 3. 仪表板设计

```yaml
# 仪表板层次
- 概览仪表板
- 服务仪表板
- 主机仪表板
- 应用仪表板
```

## 性能优化

### 1. 监控性能

```bash
# 限制监控资源使用
docker run --memory=512m --cpus=0.5 prometheus

# 优化数据保留
# prometheus.yml
global:
  storage.tsdb.retention.time: 15d
  storage.tsdb.retention.size: 10GB
```

### 2. 日志性能

```yaml
# 日志缓冲
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  scan_frequency: 10s
  harvester_buffer_size: 16384
```

## 常见问题

### 1. 监控数据不准确

```bash
# 检查时间同步
docker exec container_id date

# 检查指标收集
curl http://localhost:9090/api/v1/query?query=up
```

### 2. 日志丢失

```bash
# 检查日志驱动
docker inspect container_id | grep -A 10 "LogConfig"

# 检查磁盘空间
df -h
```

### 3. 告警不触发

```bash
# 检查告警规则
curl http://localhost:9090/api/v1/rules

# 检查告警管理器
curl http://localhost:9093/api/v1/alerts
```

## 下一步

掌握监控和日志后，您可以：

1. 学习容器编排监控
2. 探索云原生监控解决方案
3. 了解APM（应用性能监控）

## 学习检查点

完成本章学习后，您应该能够：

- [ ] 理解Docker监控的基本概念和层次
- [ ] 掌握Prometheus和Grafana的使用
- [ ] 了解ELK Stack日志管理
- [ ] 能够配置告警和仪表板
- [ ] 解决监控和日志相关问题
