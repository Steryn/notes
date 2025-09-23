# Docker监控与日志

## 🎯 学习目标

- 深入理解Docker监控体系和日志管理
- 掌握Prometheus、Grafana等监控工具的使用
- 学会设计高效的日志收集和分析系统
- 了解告警机制和故障排除流程

## 📚 监控与日志概述

### 1. 监控体系架构

```javascript
// Docker监控体系
const dockerMonitoring = {
  metrics_layers: {
    infrastructure: {
      description: '基础设施层监控',
      targets: ['CPU使用率', '内存使用率', '磁盘I/O', '网络流量'],
      tools: ['node-exporter', 'cadvisor', 'docker stats']
    },
    
    container: {
      description: '容器层监控',
      targets: ['容器状态', '资源限制', '重启次数', '健康检查'],
      tools: ['docker metrics', 'cadvisor', 'container-exporter']
    },
    
    application: {
      description: '应用层监控',
      targets: ['响应时间', '吞吐量', '错误率', '业务指标'],
      tools: ['应用metrics', 'APM工具', '自定义监控']
    },
    
    business: {
      description: '业务层监控',
      targets: ['用户行为', '业务流程', 'SLA指标', 'KPI监控'],
      tools: ['业务监控系统', '数据分析平台']
    }
  },
  
  logging_types: {
    system_logs: '系统日志 - syslog, kern.log',
    container_logs: '容器日志 - stdout/stderr',
    application_logs: '应用日志 - 业务日志',
    audit_logs: '审计日志 - 安全和合规'
  },
  
  observability_pillars: [
    'Metrics - 指标监控',
    'Logging - 日志记录', 
    'Tracing - 链路追踪'
  ]
};

console.log('Docker监控体系:', dockerMonitoring);
```

### 2. 监控指标体系

```yaml
# monitoring-metrics.yml
metrics_categories:
  system_metrics:
    cpu:
      - cpu_usage_percent
      - cpu_load_average
      - cpu_context_switches
    memory:
      - memory_usage_bytes
      - memory_available_bytes
      - memory_cached_bytes
      - memory_swap_usage
    disk:
      - disk_usage_percent
      - disk_io_read_bytes
      - disk_io_write_bytes
      - disk_io_operations
    network:
      - network_receive_bytes
      - network_transmit_bytes
      - network_receive_packets
      - network_transmit_packets

  container_metrics:
    resources:
      - container_cpu_usage_percent
      - container_memory_usage_bytes
      - container_memory_limit_bytes
      - container_blkio_read_bytes
      - container_blkio_write_bytes
    status:
      - container_up
      - container_restart_count
      - container_exit_code
      - container_start_time

  application_metrics:
    performance:
      - http_request_duration_seconds
      - http_requests_total
      - http_request_size_bytes
      - http_response_size_bytes
    errors:
      - error_rate
      - error_count_by_type
      - timeout_count
    business:
      - user_login_count
      - order_count
      - payment_success_rate
```

## 📊 Prometheus监控系统

### 1. Prometheus配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'docker-swarm'
    environment: 'production'

# 告警规则文件
rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

# 告警管理器配置
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

# 监控目标配置
scrape_configs:
  # Prometheus自监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter - 系统指标
  - job_name: 'node-exporter'
    static_configs:
      - targets: 
        - 'node-exporter:9100'
    scrape_interval: 10s
    metrics_path: /metrics

  # cAdvisor - 容器指标
  - job_name: 'cadvisor'
    static_configs:
      - targets:
        - 'cadvisor:8080'
    scrape_interval: 10s
    metrics_path: /metrics

  # Docker daemon metrics
  - job_name: 'docker'
    static_configs:
      - targets:
        - 'docker-host:9323'
    scrape_interval: 10s

  # 应用指标 - 服务发现
  - job_name: 'myapp'
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        port: 3000
    relabel_configs:
      - source_labels: [__meta_docker_container_label_com_docker_swarm_service_name]
        regex: myapp-web
        action: keep
      - source_labels: [__meta_docker_container_label_prometheus_scrape]
        regex: true
        action: keep
      - source_labels: [__meta_docker_port_private]
        regex: 3000
        action: keep

  # 数据库监控
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis监控  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx监控
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

# 远程写入配置（可选）
remote_write:
  - url: "https://prometheus-remote-write.example.com/api/v1/write"
    basic_auth:
      username: "user"
      password: "password"
```

### 2. 告警规则配置

```yaml
# alert_rules.yml
groups:
  - name: container_alerts
    rules:
      # 容器停止运行
      - alert: ContainerDown
        expr: up{job="cadvisor"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container is down"
          description: "Container {{ $labels.instance }} has been down for more than 1 minute."

      # 容器CPU使用率过高
      - alert: ContainerHighCPU
        expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage in container"
          description: "Container {{ $labels.name }} CPU usage is above 80% for 5 minutes."

      # 容器内存使用率过高
      - alert: ContainerHighMemory
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100 > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage in container"
          description: "Container {{ $labels.name }} memory usage is above 90%."

      # 容器重启频繁
      - alert: ContainerRestartTooMuch
        expr: increase(container_start_time_seconds[1h]) > 5
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Container restarting too much"
          description: "Container {{ $labels.name }} has restarted more than 5 times in the last hour."

  - name: application_alerts
    rules:
      # HTTP错误率过高
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate"
          description: "Error rate is above 5% for 5 minutes."

      # 响应时间过长
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency"
          description: "95th percentile latency is above 1 second."

      # 数据库连接失败
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database has been down for more than 1 minute."

  - name: system_alerts
    rules:
      # 系统负载过高
      - alert: HighSystemLoad
        expr: node_load1 > node_machine_info{cores="2"} * 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High system load"
          description: "System load is above 80% of CPU cores."

      # 磁盘空间不足
      - alert: DiskSpaceLow
        expr: (1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low"
          description: "Disk space usage is above 85% on {{ $labels.device }}."

      # 内存使用率过高
      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%."
```

### 3. Grafana仪表板

```json
{
  "dashboard": {
    "id": null,
    "title": "Docker Container Monitoring",
    "tags": ["docker", "containers"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Container CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{name!=\"\"}[5m]) * 100",
            "legendFormat": "{{ name }}"
          }
        ],
        "yAxes": [
          {
            "label": "Percent",
            "max": 100,
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Container Memory Usage", 
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name!=\"\"}",
            "legendFormat": "{{ name }}"
          }
        ],
        "yAxes": [
          {
            "label": "Bytes"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ status }}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "HTTP Response Time",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

## 📝 日志管理系统

### 1. ELK Stack配置

```yaml
# elk-stack.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    networks:
      - logging

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
      - ./logstash/config:/usr/share/logstash/config:ro
    ports:
      - "5044:5044"
      - "5000:5000"
    environment:
      - "LS_JAVA_OPTS=-Xms512m -Xmx512m"
    depends_on:
      - elasticsearch
    networks:
      - logging

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - logging

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.5.0
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: filebeat -e -strict.perms=false
    depends_on:
      - logstash
    deploy:
      mode: global
    networks:
      - logging

volumes:
  elasticsearch_data:

networks:
  logging:
    external: true
```

### 2. Logstash配置

```ruby
# logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }
  
  # 直接从Docker API收集日志
  http {
    port => 5000
    codec => json
  }
}

filter {
  # 处理来自Filebeat的Docker日志
  if [fields][log_type] == "docker" {
    # 解析Docker日志元数据
    json {
      source => "message"
      target => "docker"
    }
    
    # 提取容器信息
    if [container][name] {
      mutate {
        add_field => { "container_name" => "%{[container][name]}" }
      }
    }
    
    # 解析时间戳
    date {
      match => [ "[docker][time]", "ISO8601" ]
      target => "@timestamp"
    }
    
    # 应用日志解析
    if [container_name] =~ /myapp/ {
      # 解析应用JSON日志
      if [docker][log] =~ /^\{/ {
        json {
          source => "[docker][log]"
          target => "app"
        }
        
        # 提取日志级别
        if [app][level] {
          mutate {
            add_field => { "log_level" => "%{[app][level]}" }
          }
        }
        
        # 提取请求ID
        if [app][request_id] {
          mutate {
            add_field => { "request_id" => "%{[app][request_id]}" }
          }
        }
      }
    }
    
    # Nginx日志解析
    if [container_name] =~ /nginx/ {
      grok {
        match => { "[docker][log]" => "%{COMBINEDAPACHELOG}" }
      }
      
      # 解析响应时间
      if [response] {
        mutate {
          convert => { "response" => "integer" }
        }
      }
    }
  }
  
  # 添加环境标签
  mutate {
    add_field => { "environment" => "production" }
    add_field => { "cluster" => "docker-swarm" }
  }
  
  # 移除不需要的字段
  mutate {
    remove_field => [ "agent", "ecs", "host", "input" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "docker-logs-%{+YYYY.MM.dd}"
  }
  
  # 输出错误日志到专门的索引
  if [log_level] == "error" or [response] >= 400 {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "docker-errors-%{+YYYY.MM.dd}"
    }
  }
  
  # 调试输出
  stdout { 
    codec => rubydebug 
  }
}
```

### 3. Filebeat配置

```yaml
# filebeat/filebeat.yml
filebeat.inputs:
  # Docker容器日志
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log
    processors:
      - add_docker_metadata:
          host: "unix:///var/run/docker.sock"
      - decode_json_fields:
          fields: ["message"]
          target: ""
          overwrite_keys: true
    fields:
      log_type: docker
    fields_under_root: true

  # 系统日志
  - type: log
    paths:
      - /var/log/syslog
      - /var/log/auth.log
    fields:
      log_type: system
    fields_under_root: true

# 处理器配置
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~

# 输出配置
output.logstash:
  hosts: ["logstash:5044"]

# 日志级别
logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

## 🚨 告警管理系统

### 1. Alertmanager配置

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'app_password'

# 路由配置
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    # 严重告警
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 5m
    
    # 应用告警
    - match:
        service: myapp
      receiver: 'app-team'
    
    # 基础设施告警
    - match_re:
        alertname: ^(ContainerDown|HighSystemLoad|DiskSpaceLow)$
      receiver: 'infrastructure-team'

# 接收器配置
receivers:
  # 默认接收器
  - name: 'default'
    email_configs:
      - to: 'devops@example.com'
        subject: '[ALERT] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Instance: {{ .Labels.instance }}
          Severity: {{ .Labels.severity }}
          {{ end }}

  # 严重告警接收器
  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@example.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        body: |
          CRITICAL ALERT!
          
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Instance: {{ .Labels.instance }}
          Time: {{ .StartsAt }}
          {{ end }}
    
    # Slack通知
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Instance:* {{ .Labels.instance }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
    
    # 企业微信通知
    wechat_configs:
      - api_url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send'
        corp_id: 'your_corp_id'
        api_secret: 'your_api_secret'
        to_user: '@all'
        message: |
          严重告警通知
          {{ range .Alerts }}
          告警: {{ .Annotations.summary }}
          描述: {{ .Annotations.description }}
          实例: {{ .Labels.instance }}
          {{ end }}

  # 应用团队接收器
  - name: 'app-team'
    email_configs:
      - to: 'app-team@example.com'
        subject: '[APP] {{ .GroupLabels.alertname }}'

  # 基础设施团队接收器
  - name: 'infrastructure-team'
    email_configs:
      - to: 'infra-team@example.com'
        subject: '[INFRA] {{ .GroupLabels.alertname }}'

# 抑制规则
inhibit_rules:
  # 如果实例宕机，抑制该实例的其他告警
  - source_match:
      alertname: 'InstanceDown'
    target_match_re:
      instance: '.*'
    equal: ['instance']
  
  # 如果有严重告警，抑制同一服务的警告告警
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['service']
```

### 2. 自定义告警脚本

```bash
#!/bin/bash
# alert-webhook.sh - Webhook告警处理脚本

# 接收Alertmanager的webhook数据
read -r ALERT_DATA

# 解析告警数据
ALERT_NAME=$(echo "$ALERT_DATA" | jq -r '.alerts[0].labels.alertname')
SEVERITY=$(echo "$ALERT_DATA" | jq -r '.alerts[0].labels.severity')
INSTANCE=$(echo "$ALERT_DATA" | jq -r '.alerts[0].labels.instance')
DESCRIPTION=$(echo "$ALERT_DATA" | jq -r '.alerts[0].annotations.description')
STATUS=$(echo "$ALERT_DATA" | jq -r '.status')

echo "收到告警: $ALERT_NAME ($SEVERITY) - $INSTANCE"

# 根据告警类型执行相应动作
case $ALERT_NAME in
    "ContainerDown")
        echo "容器下线告警，尝试重启..."
        # 自动重启容器
        CONTAINER_NAME=$(echo "$INSTANCE" | cut -d: -f1)
        docker service update --force $CONTAINER_NAME
        ;;
        
    "HighMemoryUsage")
        echo "内存使用率过高，收集诊断信息..."
        # 收集系统信息
        docker stats --no-stream > /tmp/container-stats-$(date +%Y%m%d-%H%M%S).log
        ;;
        
    "DiskSpaceLow")
        echo "磁盘空间不足，清理临时文件..."
        # 清理Docker系统
        docker system prune -f
        ;;
        
    *)
        echo "未知告警类型: $ALERT_NAME"
        ;;
esac

# 记录告警到日志
echo "$(date): $STATUS - $ALERT_NAME - $DESCRIPTION" >> /var/log/alerts.log

# 发送到自定义通知系统
curl -X POST "http://notification-service/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"alert\": \"$ALERT_NAME\",
        \"severity\": \"$SEVERITY\",
        \"instance\": \"$INSTANCE\",
        \"description\": \"$DESCRIPTION\",
        \"status\": \"$STATUS\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"
```

## 📊 应用性能监控(APM)

### 1. 应用指标收集

```javascript
// metrics.js - Node.js应用指标收集
const promClient = require('prom-client');
const express = require('express');

// 创建指标注册表
const register = new promClient.Registry();

// 系统指标
promClient.collectDefaultMetrics({ register });

// HTTP请求指标
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// 业务指标
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register]
});

const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register]
});

const orderValue = new promClient.Summary({
  name: 'order_value_dollars',
  help: 'Order value in dollars',
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register]
});

// 数据库连接池指标
const dbConnectionsActive = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

// 中间件：记录HTTP指标
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);
  });
  
  next();
};

// 数据库查询包装器
const instrumentedQuery = async (query, params, queryType, table) => {
  const start = Date.now();
  
  try {
    const result = await db.query(query, params);
    const duration = (Date.now() - start) / 1000;
    
    dbQueryDuration.observe({
      query_type: queryType,
      table: table
    }, duration);
    
    return result;
  } catch (error) {
    dbQueryDuration.observe({
      query_type: queryType,
      table: table
    }, (Date.now() - start) / 1000);
    throw error;
  }
};

// 暴露指标端点
const app = express();
app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  try {
    // 更新动态指标
    updateDynamicMetrics();
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// 更新动态指标
function updateDynamicMetrics() {
  // 更新活跃用户数
  const activeUserCount = getActiveUserCount();
  activeUsers.set(activeUserCount);
  
  // 更新数据库连接数
  const dbConnections = getDbConnectionCount();
  dbConnectionsActive.set(dbConnections);
}

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  userRegistrations,
  activeUsers,
  orderValue,
  instrumentedQuery,
  metricsMiddleware
};
```

### 2. 分布式链路追踪

```javascript
// tracing.js - 分布式链路追踪
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// 配置资源信息
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'myapp',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// 配置Jaeger导出器
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
});

// 初始化SDK
const sdk = new NodeSDK({
  resource: resource,
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // 禁用某些自动化instrument
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// 启动追踪
sdk.start();

// 手动创建span的工具函数
const opentelemetry = require('@opentelemetry/api');

function createSpan(name, fn) {
  const tracer = opentelemetry.trace.getTracer('myapp');
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

module.exports = {
  createSpan,
  tracer: opentelemetry.trace.getTracer('myapp')
};
```

## 🔧 监控自动化脚本

### 1. 健康检查脚本

```bash
#!/bin/bash
# health-check-monitor.sh

SERVICES=("myapp-web" "myapp-db" "myapp-cache")
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
CHECK_INTERVAL=60

echo "🏥 启动健康检查监控..."

while true; do
    echo "$(date): 执行健康检查..."
    
    for service in "${SERVICES[@]}"; do
        echo "检查服务: $service"
        
        # 检查服务状态
        service_status=$(docker service ps $service --format "{{.CurrentState}}" --filter "desired-state=running" | head -1)
        
        if [[ $service_status =~ ^Running ]]; then
            echo "✅ $service 运行正常"
            
            # 额外的健康检查
            if [[ $service == "myapp-web" ]]; then
                # HTTP健康检查
                if ! curl -f -s --max-time 10 http://localhost:3000/health >/dev/null; then
                    send_alert "⚠️ $service HTTP健康检查失败"
                fi
            elif [[ $service == "myapp-db" ]]; then
                # 数据库连接检查
                if ! docker exec $(docker ps -q -f name=$service) pg_isready -U app >/dev/null 2>&1; then
                    send_alert "⚠️ $service 数据库连接检查失败"
                fi
            fi
            
        else
            send_alert "❌ $service 状态异常: $service_status"
        fi
    done
    
    sleep $CHECK_INTERVAL
done

send_alert() {
    local message="$1"
    echo "$message"
    
    # 发送到Slack
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # 记录到系统日志
    logger "$message"
}
```

### 2. 性能监控脚本

```bash
#!/bin/bash
# performance-monitor.sh

THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=90
REPORT_INTERVAL=300  # 5分钟

echo "📊 启动性能监控..."

while true; do
    echo "$(date): 收集性能指标..."
    
    # CPU使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | tr -d ' us,')
    cpu_usage=${cpu_usage%.*}  # 取整数部分
    
    if [ "$cpu_usage" -gt "$THRESHOLD_CPU" ]; then
        echo "⚠️ CPU使用率过高: ${cpu_usage}%"
        
        # 找出CPU使用率最高的容器
        echo "CPU使用率最高的容器:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | sort -k2 -rn | head -5
    fi
    
    # 内存使用率
    memory_info=$(free | grep Mem)
    total_memory=$(echo $memory_info | awk '{print $2}')
    used_memory=$(echo $memory_info | awk '{print $3}')
    memory_usage=$(( used_memory * 100 / total_memory ))
    
    if [ "$memory_usage" -gt "$THRESHOLD_MEMORY" ]; then
        echo "⚠️ 内存使用率过高: ${memory_usage}%"
        
        # 找出内存使用最高的容器
        echo "内存使用最高的容器:"
        docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | sort -k2 -rn | head -5
    fi
    
    # 磁盘使用率
    while read output; do
        usage=$(echo $output | awk '{print $5}' | cut -d'%' -f1)
        partition=$(echo $output | awk '{print $6}')
        
        if [ "$usage" -gt "$THRESHOLD_DISK" ]; then
            echo "⚠️ 磁盘使用率过高: $partition ${usage}%"
            
            # 找出大文件
            echo "最大的文件:"
            find $partition -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh | head -5
        fi
    done < <(df -h | grep -vE '^Filesystem|tmpfs|cdrom')
    
    # Docker系统信息
    echo ""
    echo "🐳 Docker系统信息:"
    docker system df
    
    # 容器资源使用TOP 5
    echo ""
    echo "📋 资源使用TOP 5:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | sort -k2 -rn | head -6
    
    sleep $REPORT_INTERVAL
done
```

## 📝 下一步

恭喜！您已经完成了Docker学习的全部12个章节。现在您可以：

1. **实践项目** - 使用学到的知识构建完整的容器化应用
2. **深入学习** - 探索Kubernetes、服务网格等高级容器技术
3. **认证考试** - 考虑参加Docker认证考试验证您的技能

## 🎯 本章要点

- ✅ 理解Docker监控体系和日志管理架构
- ✅ 掌握Prometheus、Grafana监控工具的使用
- ✅ 学会ELK Stack日志收集和分析系统
- ✅ 了解告警机制和自动化运维脚本
- ✅ 掌握应用性能监控和分布式追踪

🎉 **恭喜您完成了完整的Docker学习之旅！**

您现在已经具备了在生产环境中部署、管理和监控Docker应用的全面技能。继续实践和探索，成为容器化技术专家！🐳
