# 连接池监控

## 概述

连接池监控是确保数据库应用稳定运行的关键环节。通过实时监控连接池的各项指标，可以及时发现性能瓶颈、资源泄漏和异常情况，为系统优化和故障排查提供数据支持。

## 核心监控指标

### 1. 连接数指标
```javascript
// 连接数相关指标
class ConnectionMetrics {
  constructor() {
    this.metrics = {
      // 连接数指标
      totalConnections: 0,      // 总连接数
      activeConnections: 0,     // 活跃连接数
      idleConnections: 0,       // 空闲连接数
      acquiringConnections: 0,  // 正在获取的连接数
      
      // 连接池利用率
      utilizationRate: 0,       // 利用率百分比
      
      // 连接生命周期
      connectionsCreated: 0,    // 已创建连接数
      connectionsDestroyed: 0,  // 已销毁连接数
      connectionsReused: 0,     // 连接复用次数
      
      // 连接质量
      healthyConnections: 0,    // 健康连接数
      errorConnections: 0       // 错误连接数
    };
  }
  
  // 更新连接指标
  updateConnectionMetrics(pool) {
    this.metrics.totalConnections = pool._allConnections?.length || 0;
    this.metrics.idleConnections = pool._freeConnections?.length || 0;
    this.metrics.activeConnections = this.metrics.totalConnections - this.metrics.idleConnections;
    this.metrics.acquiringConnections = pool._acquiringConnections?.length || 0;
    
    // 计算利用率
    if (this.metrics.totalConnections > 0) {
      this.metrics.utilizationRate = (this.metrics.activeConnections / this.metrics.totalConnections) * 100;
    }
  }
  
  // 获取连接指标快照
  getSnapshot() {
    return { ...this.metrics, timestamp: new Date() };
  }
}
```

### 2. 性能指标
```javascript
// 性能相关指标
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      // 时间指标
      acquireTime: [],          // 连接获取时间历史
      queryTime: [],            // 查询执行时间历史
      connectionLifetime: [],   // 连接生命周期历史
      
      // 吞吐量指标
      requestsPerSecond: 0,     // 每秒请求数
      queriesPerSecond: 0,      // 每秒查询数
      
      // 错误指标
      timeoutCount: 0,          // 超时次数
      errorCount: 0,            // 错误次数
      retryCount: 0,            // 重试次数
      
      // 队列指标
      queueLength: 0,           // 等待队列长度
      queueWaitTime: [],        // 队列等待时间历史
      
      // 资源指标
      memoryUsage: 0,           // 内存使用量
      cpuUsage: 0               // CPU使用率
    };
  }
  
  // 记录连接获取时间
  recordAcquireTime(time) {
    this.metrics.acquireTime.push({
      time: time,
      timestamp: Date.now()
    });
    
    // 保持最近1000条记录
    if (this.metrics.acquireTime.length > 1000) {
      this.metrics.acquireTime.shift();
    }
  }
  
  // 记录查询执行时间
  recordQueryTime(time) {
    this.metrics.queryTime.push({
      time: time,
      timestamp: Date.now()
    });
    
    if (this.metrics.queryTime.length > 1000) {
      this.metrics.queryTime.shift();
    }
  }
  
  // 计算平均指标
  getAverages() {
    return {
      avgAcquireTime: this.calculateAverage(this.metrics.acquireTime),
      avgQueryTime: this.calculateAverage(this.metrics.queryTime),
      avgQueueWaitTime: this.calculateAverage(this.metrics.queueWaitTime)
    };
  }
  
  calculateAverage(timeArray) {
    if (timeArray.length === 0) return 0;
    const sum = timeArray.reduce((acc, item) => acc + item.time, 0);
    return sum / timeArray.length;
  }
}
```

## 实时监控系统

### 1. 监控代理
```javascript
// 连接池监控代理
class PoolMonitor {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.options = {
      interval: options.interval || 5000,    // 监控间隔
      alertThresholds: options.alertThresholds || {
        utilizationRate: 80,
        acquireTime: 1000,
        queueLength: 10,
        errorRate: 5
      },
      enableAlerts: options.enableAlerts !== false,
      enableMetrics: options.enableMetrics !== false
    };
    
    this.connectionMetrics = new ConnectionMetrics();
    this.performanceMetrics = new PerformanceMetrics();
    this.alerts = [];
    this.isMonitoring = false;
  }
  
  // 启动监控
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('连接池监控已启动');
    
    // 设置定时监控
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, this.options.interval);
    
    // 监听连接池事件
    this.setupEventListeners();
  }
  
  // 停止监控
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    console.log('连接池监控已停止');
  }
  
  // 收集指标
  collectMetrics() {
    this.connectionMetrics.updateConnectionMetrics(this.pool);
    this.updatePerformanceMetrics();
    
    // 发送指标到监控系统
    if (this.options.enableMetrics) {
      this.sendMetrics();
    }
  }
  
  // 更新性能指标
  updatePerformanceMetrics() {
    const queueLength = this.pool._connectionQueue?.length || 0;
    this.performanceMetrics.metrics.queueLength = queueLength;
    
    // 更新资源使用情况
    const memUsage = process.memoryUsage();
    this.performanceMetrics.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
  }
  
  // 检查告警条件
  checkAlerts() {
    if (!this.options.enableAlerts) return;
    
    const thresholds = this.options.alertThresholds;
    const connectionMetrics = this.connectionMetrics.metrics;
    const performanceMetrics = this.performanceMetrics.metrics;
    const averages = this.performanceMetrics.getAverages();
    
    // 检查利用率告警
    if (connectionMetrics.utilizationRate > thresholds.utilizationRate) {
      this.triggerAlert('HIGH_UTILIZATION', {
        current: connectionMetrics.utilizationRate,
        threshold: thresholds.utilizationRate
      });
    }
    
    // 检查连接获取时间告警
    if (averages.avgAcquireTime > thresholds.acquireTime) {
      this.triggerAlert('SLOW_ACQUIRE', {
        current: averages.avgAcquireTime,
        threshold: thresholds.acquireTime
      });
    }
    
    // 检查队列长度告警
    if (performanceMetrics.queueLength > thresholds.queueLength) {
      this.triggerAlert('LONG_QUEUE', {
        current: performanceMetrics.queueLength,
        threshold: thresholds.queueLength
      });
    }
  }
  
  // 触发告警
  triggerAlert(type, data) {
    const alert = {
      type: type,
      data: data,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    console.warn('连接池告警:', alert);
    
    // 发送告警通知
    this.sendAlert(alert);
    
    // 保持最近100条告警记录
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }
  
  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_UTILIZATION': 'warning',
      'SLOW_ACQUIRE': 'warning',
      'LONG_QUEUE': 'critical',
      'CONNECTION_ERROR': 'critical',
      'POOL_EXHAUSTED': 'critical'
    };
    return severityMap[type] || 'info';
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // MySQL连接池事件
    if (this.pool.on) {
      this.pool.on('connection', (connection) => {
        this.connectionMetrics.metrics.connectionsCreated++;
        console.log('新连接创建:', connection.threadId);
      });
      
      this.pool.on('error', (error) => {
        this.performanceMetrics.metrics.errorCount++;
        this.triggerAlert('CONNECTION_ERROR', { error: error.message });
      });
    }
  }
  
  // 发送指标到监控系统
  sendMetrics() {
    const metrics = {
      connection: this.connectionMetrics.getSnapshot(),
      performance: {
        ...this.performanceMetrics.metrics,
        averages: this.performanceMetrics.getAverages()
      }
    };
    
    // 这里可以集成到各种监控系统
    // 例如：Prometheus, DataDog, CloudWatch等
    this.sendToPrometheus(metrics);
  }
  
  // 发送告警通知
  sendAlert(alert) {
    // 这里可以集成到各种告警系统
    // 例如：Slack, Email, PagerDuty等
    console.log('发送告警通知:', alert);
  }
  
  // 获取监控报告
  getReport() {
    return {
      connection: this.connectionMetrics.getSnapshot(),
      performance: {
        ...this.performanceMetrics.metrics,
        averages: this.performanceMetrics.getAverages()
      },
      alerts: this.alerts.slice(-10), // 最近10条告警
      status: this.getOverallStatus()
    };
  }
  
  getOverallStatus() {
    const criticalAlerts = this.alerts.filter(alert => 
      alert.severity === 'critical' && 
      Date.now() - alert.timestamp.getTime() < 300000 // 5分钟内
    );
    
    if (criticalAlerts.length > 0) return 'critical';
    
    const warningAlerts = this.alerts.filter(alert => 
      alert.severity === 'warning' && 
      Date.now() - alert.timestamp.getTime() < 300000
    );
    
    if (warningAlerts.length > 0) return 'warning';
    
    return 'healthy';
  }
}
```

### 2. Prometheus集成
```javascript
// Prometheus指标集成
const client = require('prom-client');

class PrometheusPoolMonitor {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.register = options.register || client.register;
    
    // 创建Prometheus指标
    this.createMetrics();
  }
  
  createMetrics() {
    // 连接数指标
    this.totalConnectionsGauge = new client.Gauge({
      name: 'db_pool_connections_total',
      help: '数据库连接池总连接数',
      registers: [this.register]
    });
    
    this.activeConnectionsGauge = new client.Gauge({
      name: 'db_pool_connections_active',
      help: '数据库连接池活跃连接数',
      registers: [this.register]
    });
    
    this.idleConnectionsGauge = new client.Gauge({
      name: 'db_pool_connections_idle',
      help: '数据库连接池空闲连接数',
      registers: [this.register]
    });
    
    // 性能指标
    this.acquireTimeHistogram = new client.Histogram({
      name: 'db_pool_acquire_duration_seconds',
      help: '连接获取时间分布',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register]
    });
    
    this.queryTimeHistogram = new client.Histogram({
      name: 'db_pool_query_duration_seconds',
      help: '查询执行时间分布',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register]
    });
    
    // 错误指标
    this.errorsCounter = new client.Counter({
      name: 'db_pool_errors_total',
      help: '数据库连接池错误总数',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    // 队列指标
    this.queueLengthGauge = new client.Gauge({
      name: 'db_pool_queue_length',
      help: '连接池等待队列长度',
      registers: [this.register]
    });
    
    // 利用率指标
    this.utilizationGauge = new client.Gauge({
      name: 'db_pool_utilization_ratio',
      help: '连接池利用率',
      registers: [this.register]
    });
  }
  
  // 更新Prometheus指标
  updateMetrics(connectionMetrics, performanceMetrics) {
    // 更新连接数指标
    this.totalConnectionsGauge.set(connectionMetrics.totalConnections);
    this.activeConnectionsGauge.set(connectionMetrics.activeConnections);
    this.idleConnectionsGauge.set(connectionMetrics.idleConnections);
    
    // 更新队列指标
    this.queueLengthGauge.set(performanceMetrics.queueLength);
    
    // 更新利用率指标
    this.utilizationGauge.set(connectionMetrics.utilizationRate / 100);
  }
  
  // 记录连接获取时间
  recordAcquireTime(duration) {
    this.acquireTimeHistogram.observe(duration / 1000); // 转换为秒
  }
  
  // 记录查询执行时间
  recordQueryTime(duration) {
    this.queryTimeHistogram.observe(duration / 1000);
  }
  
  // 记录错误
  recordError(errorType) {
    this.errorsCounter.inc({ type: errorType });
  }
  
  // 获取指标端点
  getMetrics() {
    return this.register.metrics();
  }
}

// 使用示例
const poolMonitor = new PrometheusPoolMonitor(pool);

// 在Express应用中暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await poolMonitor.getMetrics());
});
```

### 3. 健康检查端点
```javascript
// 健康检查端点
class HealthCheckEndpoint {
  constructor(poolMonitor) {
    this.poolMonitor = poolMonitor;
  }
  
  // 基础健康检查
  async basicHealthCheck() {
    const report = this.poolMonitor.getReport();
    const status = report.status;
    
    return {
      status: status,
      healthy: status !== 'critical',
      timestamp: new Date(),
      details: {
        connections: {
          total: report.connection.totalConnections,
          active: report.connection.activeConnections,
          idle: report.connection.idleConnections,
          utilization: report.connection.utilizationRate
        },
        performance: {
          avgAcquireTime: report.performance.averages.avgAcquireTime,
          avgQueryTime: report.performance.averages.avgQueryTime,
          queueLength: report.performance.queueLength
        }
      }
    };
  }
  
  // 详细健康检查
  async detailedHealthCheck() {
    const basicCheck = await this.basicHealthCheck();
    const report = this.poolMonitor.getReport();
    
    return {
      ...basicCheck,
      alerts: report.alerts,
      metrics: {
        connection: report.connection,
        performance: report.performance
      },
      recommendations: this.getRecommendations(report)
    };
  }
  
  // 数据库连通性测试
  async connectivityCheck() {
    const startTime = Date.now();
    
    try {
      const connection = await this.poolMonitor.pool.getConnection();
      const acquireTime = Date.now() - startTime;
      
      const queryStartTime = Date.now();
      await connection.execute('SELECT 1 as test');
      const queryTime = Date.now() - queryStartTime;
      
      connection.release();
      
      return {
        status: 'healthy',
        connectivity: true,
        acquireTime: acquireTime,
        queryTime: queryTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connectivity: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
  
  // 获取优化建议
  getRecommendations(report) {
    const recommendations = [];
    
    if (report.connection.utilizationRate > 80) {
      recommendations.push('连接池利用率过高，建议增加最大连接数');
    }
    
    if (report.performance.averages.avgAcquireTime > 1000) {
      recommendations.push('连接获取时间过长，检查连接池配置和数据库性能');
    }
    
    if (report.performance.queueLength > 5) {
      recommendations.push('等待队列过长，考虑增加连接池大小或优化查询性能');
    }
    
    if (report.connection.idleConnections > report.connection.totalConnections * 0.5) {
      recommendations.push('空闲连接过多，可以适当减少最小连接数');
    }
    
    return recommendations;
  }
}

// 在Express应用中集成健康检查
const healthCheck = new HealthCheckEndpoint(poolMonitor);

app.get('/health', async (req, res) => {
  const health = await healthCheck.basicHealthCheck();
  const statusCode = health.healthy ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/health/detailed', async (req, res) => {
  const health = await healthCheck.detailedHealthCheck();
  const statusCode = health.healthy ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/health/connectivity', async (req, res) => {
  const connectivity = await healthCheck.connectivityCheck();
  const statusCode = connectivity.connectivity ? 200 : 503;
  res.status(statusCode).json(connectivity);
});
```

## 可视化监控面板

### 1. 实时监控面板
```javascript
// WebSocket实时监控面板
const WebSocket = require('ws');

class MonitoringDashboard {
  constructor(poolMonitor, port = 8080) {
    this.poolMonitor = poolMonitor;
    this.port = port;
    this.clients = new Set();
    
    this.setupWebSocketServer();
    this.startBroadcasting();
  }
  
  setupWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      console.log('新的监控客户端连接');
      this.clients.add(ws);
      
      // 发送当前状态
      const report = this.poolMonitor.getReport();
      ws.send(JSON.stringify({
        type: 'initial',
        data: report
      }));
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('监控客户端断开连接');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  startBroadcasting() {
    // 每5秒广播一次监控数据
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);
  }
  
  broadcastMetrics() {
    if (this.clients.size === 0) return;
    
    const report = this.poolMonitor.getReport();
    const message = JSON.stringify({
      type: 'update',
      data: report,
      timestamp: Date.now()
    });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        this.clients.delete(client);
      }
    });
  }
  
  broadcastAlert(alert) {
    const message = JSON.stringify({
      type: 'alert',
      data: alert,
      timestamp: Date.now()
    });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// 启动监控面板
const dashboard = new MonitoringDashboard(poolMonitor, 8080);
console.log('监控面板已启动: ws://localhost:8080');
```

### 2. HTML监控页面
```html
<!-- monitoring-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>数据库连接池监控</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert.warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .alert.critical { background-color: #f8d7da; border-color: #f5c6cb; }
        .status.healthy { color: green; }
        .status.warning { color: orange; }
        .status.critical { color: red; }
    </style>
</head>
<body>
    <h1>数据库连接池监控</h1>
    
    <div id="status" class="status">连接中...</div>
    
    <div class="metrics-grid">
        <div class="metric-card">
            <h3>连接池状态</h3>
            <div>总连接数: <span id="totalConnections" class="metric-value">0</span></div>
            <div>活跃连接: <span id="activeConnections" class="metric-value">0</span></div>
            <div>空闲连接: <span id="idleConnections" class="metric-value">0</span></div>
            <div>利用率: <span id="utilization" class="metric-value">0%</span></div>
        </div>
        
        <div class="metric-card">
            <h3>性能指标</h3>
            <div>平均获取时间: <span id="avgAcquireTime" class="metric-value">0ms</span></div>
            <div>平均查询时间: <span id="avgQueryTime" class="metric-value">0ms</span></div>
            <div>队列长度: <span id="queueLength" class="metric-value">0</span></div>
        </div>
        
        <div class="metric-card">
            <h3>连接时间趋势</h3>
            <canvas id="timeChart" width="400" height="200"></canvas>
        </div>
        
        <div class="metric-card">
            <h3>连接数趋势</h3>
            <canvas id="connectionChart" width="400" height="200"></canvas>
        </div>
    </div>
    
    <div id="alerts">
        <h3>告警信息</h3>
        <div id="alertsList"></div>
    </div>

    <script>
        // WebSocket连接
        const ws = new WebSocket('ws://localhost:8080');
        
        // 图表初始化
        const timeChart = new Chart(document.getElementById('timeChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '获取时间',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        
        const connectionChart = new Chart(document.getElementById('connectionChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '总连接数',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }, {
                    label: '活跃连接数',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        
        // WebSocket事件处理
        ws.onopen = function() {
            document.getElementById('status').textContent = '已连接';
            document.getElementById('status').className = 'status healthy';
        };
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            
            if (message.type === 'update' || message.type === 'initial') {
                updateMetrics(message.data);
                updateCharts(message.data);
            } else if (message.type === 'alert') {
                showAlert(message.data);
            }
        };
        
        ws.onclose = function() {
            document.getElementById('status').textContent = '连接断开';
            document.getElementById('status').className = 'status critical';
        };
        
        // 更新指标显示
        function updateMetrics(data) {
            document.getElementById('totalConnections').textContent = data.connection.totalConnections;
            document.getElementById('activeConnections').textContent = data.connection.activeConnections;
            document.getElementById('idleConnections').textContent = data.connection.idleConnections;
            document.getElementById('utilization').textContent = data.connection.utilizationRate.toFixed(1) + '%';
            document.getElementById('avgAcquireTime').textContent = data.performance.averages.avgAcquireTime.toFixed(0) + 'ms';
            document.getElementById('avgQueryTime').textContent = data.performance.averages.avgQueryTime.toFixed(0) + 'ms';
            document.getElementById('queueLength').textContent = data.performance.queueLength;
            
            // 更新整体状态
            const statusElement = document.getElementById('status');
            statusElement.textContent = '状态: ' + data.status;
            statusElement.className = 'status ' + data.status;
        }
        
        // 更新图表
        function updateCharts(data) {
            const now = new Date().toLocaleTimeString();
            
            // 更新时间图表
            timeChart.data.labels.push(now);
            timeChart.data.datasets[0].data.push(data.performance.averages.avgAcquireTime);
            
            if (timeChart.data.labels.length > 20) {
                timeChart.data.labels.shift();
                timeChart.data.datasets[0].data.shift();
            }
            
            timeChart.update('none');
            
            // 更新连接数图表
            connectionChart.data.labels.push(now);
            connectionChart.data.datasets[0].data.push(data.connection.totalConnections);
            connectionChart.data.datasets[1].data.push(data.connection.activeConnections);
            
            if (connectionChart.data.labels.length > 20) {
                connectionChart.data.labels.shift();
                connectionChart.data.datasets[0].data.shift();
                connectionChart.data.datasets[1].data.shift();
            }
            
            connectionChart.update('none');
        }
        
        // 显示告警
        function showAlert(alert) {
            const alertsList = document.getElementById('alertsList');
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert ' + alert.severity;
            alertDiv.innerHTML = `
                <strong>${alert.type}</strong>: ${JSON.stringify(alert.data)}
                <small style="float: right;">${new Date(alert.timestamp).toLocaleString()}</small>
            `;
            alertsList.insertBefore(alertDiv, alertsList.firstChild);
            
            // 只保留最近10条告警
            while (alertsList.children.length > 10) {
                alertsList.removeChild(alertsList.lastChild);
            }
        }
    </script>
</body>
</html>
```

## 日志和审计

### 1. 结构化日志
```javascript
// 结构化监控日志
const winston = require('winston');

class PoolLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'pool-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'pool-combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }
  
  logConnectionEvent(event, data) {
    this.logger.info('Connection Event', {
      event: event,
      data: data,
      timestamp: new Date()
    });
  }
  
  logPerformanceMetrics(metrics) {
    this.logger.info('Performance Metrics', {
      metrics: metrics,
      timestamp: new Date()
    });
  }
  
  logAlert(alert) {
    this.logger.warn('Pool Alert', {
      alert: alert,
      timestamp: new Date()
    });
  }
  
  logError(error, context) {
    this.logger.error('Pool Error', {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date()
    });
  }
}
```

### 2. 审计追踪
```javascript
// 连接池审计追踪
class PoolAuditor {
  constructor() {
    this.auditLog = [];
    this.maxLogSize = 10000;
  }
  
  logConnectionAcquire(connectionId, requestId, metadata) {
    this.addAuditEntry('CONNECTION_ACQUIRE', {
      connectionId: connectionId,
      requestId: requestId,
      metadata: metadata
    });
  }
  
  logConnectionRelease(connectionId, requestId, duration) {
    this.addAuditEntry('CONNECTION_RELEASE', {
      connectionId: connectionId,
      requestId: requestId,
      duration: duration
    });
  }
  
  logQueryExecution(connectionId, query, duration, result) {
    this.addAuditEntry('QUERY_EXECUTION', {
      connectionId: connectionId,
      query: this.sanitizeQuery(query),
      duration: duration,
      rowsAffected: result?.affectedRows || 0
    });
  }
  
  addAuditEntry(action, data) {
    const entry = {
      action: action,
      data: data,
      timestamp: new Date(),
      id: this.generateId()
    };
    
    this.auditLog.push(entry);
    
    // 保持日志大小限制
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.shift();
    }
  }
  
  sanitizeQuery(query) {
    // 移除敏感信息
    return query.replace(/password\s*=\s*'[^']*'/gi, "password='***'");
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  getAuditReport(startTime, endTime) {
    return this.auditLog.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }
}
```

## 总结

连接池监控的关键要点：

1. **全面指标收集**：连接数、性能、错误、队列等多维度指标
2. **实时监控告警**：基于阈值的自动告警和通知机制
3. **可视化面板**：直观的实时监控界面和趋势图表
4. **健康检查**：定期的连接池健康状态检查
5. **集成监控系统**：与Prometheus、Grafana等监控平台集成
6. **日志审计**：详细的操作日志和审计追踪
7. **性能分析**：基于监控数据的性能分析和优化建议

有效的连接池监控可以帮助及时发现问题，优化性能，确保系统稳定运行。
