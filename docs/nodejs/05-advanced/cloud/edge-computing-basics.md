# 边缘计算基础

## 📖 概述

边缘计算是一种分布式计算架构，将计算、存储和网络服务部署到更靠近数据源和用户的位置。通过在网络边缘处理数据，可以显著减少延迟、提高性能，并减轻中心服务器的负载。

## 🎯 学习目标

- 理解边缘计算的核心概念和优势
- 掌握边缘计算的架构模式
- 学习边缘节点的部署和管理
- 了解边缘计算的应用场景和最佳实践

## 🏗️ 边缘计算架构

### 1. 三层架构模型

```javascript
// 边缘计算架构管理器
class EdgeComputingArchitecture {
  constructor() {
    this.layers = {
      cloud: new CloudLayer(),
      edge: new EdgeLayer(),
      device: new DeviceLayer()
    };
    
    this.dataFlow = new DataFlowManager();
    this.loadBalancer = new EdgeLoadBalancer();
    this.syncManager = new EdgeSyncManager();
  }
  
  // 云层 - 中心化处理
  class CloudLayer {
    constructor() {
      this.services = {
        dataWarehouse: new DataWarehouse(),
        machineLearning: new MLService(),
        analytics: new AnalyticsService(),
        management: new EdgeManagementService()
      };
    }
    
    async processHeavyComputation(data) {
      console.log('云端处理重计算任务');
      
      // 大数据分析
      const analyticsResult = await this.services.analytics.analyze(data);
      
      // 机器学习推理
      const mlResult = await this.services.machineLearning.predict(data);
      
      // 存储到数据仓库
      await this.services.dataWarehouse.store(data, {
        analytics: analyticsResult,
        ml: mlResult
      });
      
      return {
        analytics: analyticsResult,
        ml: mlResult,
        processedAt: new Date()
      };
    }
    
    async manageEdgeNodes() {
      const nodes = await this.services.management.getEdgeNodes();
      
      for (const node of nodes) {
        // 检查节点健康状态
        const health = await this.checkNodeHealth(node);
        
        // 更新配置
        if (health.needsUpdate) {
          await this.updateNodeConfiguration(node);
        }
        
        // 部署新服务
        if (health.canDeploy) {
          await this.deployServices(node);
        }
      }
    }
  }
  
  // 边缘层 - 区域处理
  class EdgeLayer {
    constructor() {
      this.nodes = new Map();
      this.services = new Map();
      this.cache = new EdgeCache();
      this.compute = new EdgeCompute();
    }
    
    // 注册边缘节点
    registerNode(nodeId, capabilities) {
      this.nodes.set(nodeId, {
        id: nodeId,
        capabilities,
        status: 'active',
        lastHeartbeat: new Date(),
        workload: 0,
        services: new Set()
      });
      
      console.log(`边缘节点注册: ${nodeId}`);
    }
    
    // 处理实时请求
    async processRealTimeRequest(request, nodeId) {
      const node = this.nodes.get(nodeId);
      if (!node || node.status !== 'active') {
        throw new Error('边缘节点不可用');
      }
      
      try {
        // 检查本地缓存
        const cached = await this.cache.get(request.key);
        if (cached && !this.isCacheExpired(cached)) {
          return {
            data: cached.data,
            source: 'edge_cache',
            latency: 5 // ms
          };
        }
        
        // 边缘计算处理
        const result = await this.compute.process(request, node);
        
        // 缓存结果
        await this.cache.set(request.key, result, {
          ttl: 300000, // 5分钟
          nodeId
        });
        
        return {
          data: result,
          source: 'edge_compute',
          nodeId,
          latency: 50 // ms
        };
        
      } catch (error) {
        console.error(`边缘处理失败: ${error.message}`);
        
        // 回退到云端处理
        return await this.fallbackToCloud(request);
      }
    }
    
    // 服务发现和路由
    async routeRequest(request) {
      // 根据地理位置选择最近的节点
      const nearestNode = this.findNearestNode(request.location);
      
      // 检查节点负载
      if (nearestNode.workload > 0.8) {
        // 负载均衡到其他节点
        const alternativeNode = this.findAlternativeNode(request.location, nearestNode.id);
        return await this.processRealTimeRequest(request, alternativeNode.id);
      }
      
      return await this.processRealTimeRequest(request, nearestNode.id);
    }
    
    findNearestNode(location) {
      let nearest = null;
      let minDistance = Infinity;
      
      for (const [nodeId, node] of this.nodes) {
        if (node.status !== 'active') continue;
        
        const distance = this.calculateDistance(location, node.capabilities.location);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = node;
        }
      }
      
      return nearest;
    }
    
    calculateDistance(loc1, loc2) {
      // 简化的距离计算
      const dx = loc1.lat - loc2.lat;
      const dy = loc1.lng - loc2.lng;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }
  
  // 设备层 - 本地处理
  class DeviceLayer {
    constructor() {
      this.devices = new Map();
      this.localCache = new Map();
      this.sensors = new SensorManager();
    }
    
    // 注册设备
    registerDevice(deviceId, capabilities) {
      this.devices.set(deviceId, {
        id: deviceId,
        capabilities,
        status: 'online',
        lastSeen: new Date(),
        data: new Map()
      });
      
      console.log(`设备注册: ${deviceId}`);
    }
    
    // 本地数据处理
    async processLocalData(deviceId, sensorData) {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('设备未注册');
      }
      
      // 数据预处理
      const processedData = await this.preprocessData(sensorData);
      
      // 本地缓存
      this.localCache.set(`${deviceId}:latest`, {
        data: processedData,
        timestamp: new Date()
      });
      
      // 判断是否需要上传到边缘节点
      if (this.shouldUploadToEdge(processedData)) {
        await this.uploadToEdge(deviceId, processedData);
      }
      
      // 实时响应
      if (this.needsImmediateAction(processedData)) {
        await this.triggerImmediateAction(deviceId, processedData);
      }
      
      return processedData;
    }
    
    async preprocessData(rawData) {
      // 数据清洗
      const cleaned = this.cleanData(rawData);
      
      // 数据聚合
      const aggregated = this.aggregateData(cleaned);
      
      // 异常检测
      const anomalies = this.detectAnomalies(aggregated);
      
      return {
        raw: rawData,
        cleaned,
        aggregated,
        anomalies,
        processedAt: new Date()
      };
    }
    
    shouldUploadToEdge(data) {
      // 异常数据需要上传
      if (data.anomalies && data.anomalies.length > 0) {
        return true;
      }
      
      // 定期上传聚合数据
      const lastUpload = this.getLastUploadTime();
      const timeSinceUpload = Date.now() - lastUpload;
      
      return timeSinceUpload > 60000; // 1分钟
    }
    
    needsImmediateAction(data) {
      // 检查紧急情况
      return data.anomalies && data.anomalies.some(a => a.severity === 'critical');
    }
  }
}
```

### 2. 数据流管理

```javascript
// 数据流管理器
class DataFlowManager {
  constructor() {
    this.flows = new Map();
    this.processors = new Map();
    this.queues = new Map();
    this.metrics = new FlowMetrics();
  }
  
  // 定义数据流
  defineFlow(flowId, definition) {
    const flow = {
      id: flowId,
      source: definition.source,
      processors: definition.processors || [],
      destinations: definition.destinations,
      filters: definition.filters || [],
      transformers: definition.transformers || [],
      priority: definition.priority || 'normal',
      retryPolicy: definition.retryPolicy || { maxRetries: 3, backoff: 1000 }
    };
    
    this.flows.set(flowId, flow);
    this.setupFlowProcessing(flow);
    
    console.log(`数据流定义完成: ${flowId}`);
  }
  
  // 设置流处理
  setupFlowProcessing(flow) {
    // 创建处理队列
    const queueName = `flow_${flow.id}`;
    this.queues.set(queueName, new ProcessingQueue({
      priority: flow.priority,
      maxConcurrency: 10,
      retryPolicy: flow.retryPolicy
    }));
    
    // 注册处理器
    this.processors.set(flow.id, new FlowProcessor(flow));
  }
  
  // 处理数据
  async processData(flowId, data, context = {}) {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`数据流不存在: ${flowId}`);
    }
    
    const processor = this.processors.get(flowId);
    const queue = this.queues.get(`flow_${flowId}`);
    
    // 添加到处理队列
    return queue.add(async () => {
      return await processor.process(data, context);
    });
  }
  
  // 流处理器
  class FlowProcessor {
    constructor(flow) {
      this.flow = flow;
    }
    
    async process(data, context) {
      let currentData = data;
      const processingContext = {
        ...context,
        flowId: this.flow.id,
        startTime: Date.now()
      };
      
      try {
        // 应用过滤器
        if (!this.applyFilters(currentData, processingContext)) {
          return { filtered: true, reason: 'Data filtered out' };
        }
        
        // 应用转换器
        currentData = await this.applyTransformers(currentData, processingContext);
        
        // 执行处理器链
        for (const processorConfig of this.flow.processors) {
          currentData = await this.executeProcessor(processorConfig, currentData, processingContext);
        }
        
        // 分发到目标
        const results = await this.distributeToDestinations(currentData, processingContext);
        
        // 记录指标
        this.recordMetrics(processingContext, true);
        
        return {
          success: true,
          data: currentData,
          results,
          processingTime: Date.now() - processingContext.startTime
        };
        
      } catch (error) {
        console.error(`流处理失败 [${this.flow.id}]:`, error);
        
        // 记录错误指标
        this.recordMetrics(processingContext, false, error);
        
        throw error;
      }
    }
    
    applyFilters(data, context) {
      for (const filter of this.flow.filters) {
        if (!this.evaluateFilter(filter, data, context)) {
          return false;
        }
      }
      return true;
    }
    
    async applyTransformers(data, context) {
      let transformedData = data;
      
      for (const transformer of this.flow.transformers) {
        transformedData = await this.executeTransformer(transformer, transformedData, context);
      }
      
      return transformedData;
    }
    
    async executeProcessor(config, data, context) {
      switch (config.type) {
        case 'aggregation':
          return await this.aggregateData(data, config.params);
        case 'enrichment':
          return await this.enrichData(data, config.params);
        case 'validation':
          return await this.validateData(data, config.params);
        case 'compression':
          return await this.compressData(data, config.params);
        default:
          throw new Error(`未知处理器类型: ${config.type}`);
      }
    }
    
    async distributeToDestinations(data, context) {
      const results = [];
      
      for (const destination of this.flow.destinations) {
        try {
          const result = await this.sendToDestination(destination, data, context);
          results.push({ destination: destination.id, success: true, result });
        } catch (error) {
          console.error(`发送到目标失败 [${destination.id}]:`, error);
          results.push({ destination: destination.id, success: false, error: error.message });
        }
      }
      
      return results;
    }
    
    async sendToDestination(destination, data, context) {
      switch (destination.type) {
        case 'edge_cache':
          return await this.sendToEdgeCache(destination, data);
        case 'cloud_storage':
          return await this.sendToCloudStorage(destination, data);
        case 'message_queue':
          return await this.sendToMessageQueue(destination, data);
        case 'database':
          return await this.sendToDatabase(destination, data);
        case 'webhook':
          return await this.sendToWebhook(destination, data);
        default:
          throw new Error(`未知目标类型: ${destination.type}`);
      }
    }
  }
  
  // 处理队列
  class ProcessingQueue {
    constructor(options) {
      this.options = options;
      this.queue = [];
      this.processing = 0;
      this.maxConcurrency = options.maxConcurrency || 5;
    }
    
    async add(processor) {
      return new Promise((resolve, reject) => {
        this.queue.push({
          processor,
          resolve,
          reject,
          retries: 0,
          addedAt: Date.now()
        });
        
        this.processNext();
      });
    }
    
    async processNext() {
      if (this.processing >= this.maxConcurrency || this.queue.length === 0) {
        return;
      }
      
      const task = this.queue.shift();
      this.processing++;
      
      try {
        const result = await task.processor();
        task.resolve(result);
      } catch (error) {
        if (task.retries < this.options.retryPolicy.maxRetries) {
          // 重试
          task.retries++;
          
          setTimeout(() => {
            this.queue.unshift(task);
            this.processNext();
          }, this.options.retryPolicy.backoff * Math.pow(2, task.retries - 1));
        } else {
          task.reject(error);
        }
      } finally {
        this.processing--;
        this.processNext();
      }
    }
  }
}
```

## ⚡ 边缘优化策略

### 1. 智能缓存

```javascript
// 边缘智能缓存
class EdgeIntelligentCache {
  constructor() {
    this.cache = new Map();
    this.accessPatterns = new Map();
    this.predictor = new CachePredictor();
    this.evictionPolicy = new SmartEvictionPolicy();
    this.syncManager = new CacheSyncManager();
  }
  
  // 智能缓存策略
  async get(key, context = {}) {
    // 记录访问模式
    this.recordAccess(key, context);
    
    // 检查本地缓存
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      // 更新访问统计
      this.updateAccessStats(key, 'hit');
      return cached.data;
    }
    
    // 缓存未命中，尝试预测性加载
    const predicted = await this.predictor.shouldPreload(key, context);
    if (predicted.shouldPreload) {
      await this.preloadRelatedData(predicted.relatedKeys);
    }
    
    // 从源获取数据
    const data = await this.fetchFromSource(key, context);
    
    // 智能存储决策
    const shouldCache = await this.decideCaching(key, data, context);
    if (shouldCache.cache) {
      await this.set(key, data, shouldCache.options);
    }
    
    this.updateAccessStats(key, 'miss');
    return data;
  }
  
  async set(key, data, options = {}) {
    // 检查缓存容量
    if (this.needsEviction()) {
      await this.performSmartEviction();
    }
    
    // 计算缓存优先级
    const priority = this.calculatePriority(key, data, options);
    
    // 存储到缓存
    const cacheEntry = {
      key,
      data,
      priority,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (options.ttl || 300000)),
      accessCount: 0,
      lastAccessed: new Date(),
      size: this.calculateSize(data),
      metadata: options.metadata || {}
    };
    
    this.cache.set(key, cacheEntry);
    
    // 异步同步到其他边缘节点
    if (options.syncToOtherNodes) {
      this.syncManager.syncToNodes(key, cacheEntry);
    }
    
    console.log(`缓存存储: ${key}, 优先级: ${priority}`);
  }
  
  // 访问模式记录
  recordAccess(key, context) {
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        key,
        accessCount: 0,
        accessTimes: [],
        contexts: [],
        patterns: {
          hourly: new Array(24).fill(0),
          daily: new Array(7).fill(0),
          seasonal: {}
        }
      });
    }
    
    const pattern = this.accessPatterns.get(key);
    pattern.accessCount++;
    pattern.accessTimes.push(new Date());
    pattern.contexts.push(context);
    
    // 更新时间模式
    const now = new Date();
    pattern.patterns.hourly[now.getHours()]++;
    pattern.patterns.daily[now.getDay()]++;
    
    // 保持最近1000次访问记录
    if (pattern.accessTimes.length > 1000) {
      pattern.accessTimes = pattern.accessTimes.slice(-1000);
      pattern.contexts = pattern.contexts.slice(-1000);
    }
  }
  
  // 缓存决策
  async decideCaching(key, data, context) {
    const factors = {
      dataSize: this.calculateSize(data),
      computeCost: context.computeCost || 1,
      accessFrequency: this.getAccessFrequency(key),
      networkLatency: context.networkLatency || 100,
      dataVolatility: context.dataVolatility || 0.5
    };
    
    // 缓存价值计算
    const cacheValue = this.calculateCacheValue(factors);
    
    // 决策阈值
    const threshold = 0.6;
    
    if (cacheValue > threshold) {
      return {
        cache: true,
        options: {
          ttl: this.calculateOptimalTTL(factors),
          priority: cacheValue,
          syncToOtherNodes: cacheValue > 0.8
        }
      };
    }
    
    return { cache: false };
  }
  
  calculateCacheValue(factors) {
    const {
      dataSize,
      computeCost,
      accessFrequency,
      networkLatency,
      dataVolatility
    } = factors;
    
    // 标准化因子
    const normalizedSize = Math.min(dataSize / 1024 / 1024, 1); // MB
    const normalizedCost = Math.min(computeCost / 1000, 1); // ms
    const normalizedFreq = Math.min(accessFrequency / 100, 1); // 次/小时
    const normalizedLatency = Math.min(networkLatency / 1000, 1); // ms
    
    // 权重计算
    const value = (
      normalizedFreq * 0.3 +           // 访问频率权重最高
      normalizedCost * 0.25 +          // 计算成本
      normalizedLatency * 0.2 +        // 网络延迟
      (1 - normalizedSize) * 0.15 +    // 数据大小（越小越好）
      (1 - dataVolatility) * 0.1       // 数据稳定性
    );
    
    return Math.max(0, Math.min(1, value));
  }
  
  // 智能淘汰策略
  async performSmartEviction() {
    const entries = Array.from(this.cache.values());
    
    // 计算每个条目的淘汰分数
    const scored = entries.map(entry => ({
      entry,
      score: this.calculateEvictionScore(entry)
    }));
    
    // 按分数排序（分数越低越容易被淘汰）
    scored.sort((a, b) => a.score - b.score);
    
    // 淘汰最低分的条目
    const toEvict = scored.slice(0, Math.ceil(entries.length * 0.1)); // 淘汰10%
    
    for (const { entry } of toEvict) {
      this.cache.delete(entry.key);
      console.log(`淘汰缓存条目: ${entry.key}, 分数: ${entry.score}`);
    }
  }
  
  calculateEvictionScore(entry) {
    const now = Date.now();
    const age = now - entry.createdAt.getTime();
    const timeSinceAccess = now - entry.lastAccessed.getTime();
    
    // 分数因子
    const ageScore = Math.min(age / (24 * 60 * 60 * 1000), 1); // 年龄（天）
    const accessScore = 1 / (entry.accessCount + 1); // 访问次数倒数
    const recencyScore = Math.min(timeSinceAccess / (60 * 60 * 1000), 1); // 最近访问时间（小时）
    const priorityScore = 1 - entry.priority; // 优先级倒数
    const sizeScore = Math.min(entry.size / (1024 * 1024), 1); // 大小（MB）
    
    // 综合分数（越低越容易被淘汰）
    return (
      ageScore * 0.2 +
      accessScore * 0.3 +
      recencyScore * 0.25 +
      priorityScore * 0.15 +
      sizeScore * 0.1
    );
  }
}

// 缓存预测器
class CachePredictor {
  constructor() {
    this.patterns = new Map();
    this.correlations = new Map();
    this.mlModel = new SimplePredictionModel();
  }
  
  async shouldPreload(key, context) {
    // 基于历史模式预测
    const pattern = this.patterns.get(key);
    if (!pattern) {
      return { shouldPreload: false };
    }
    
    // 时间模式预测
    const timeBasedPrediction = this.predictByTime(pattern);
    
    // 关联模式预测
    const correlationPrediction = this.predictByCorrelation(key, context);
    
    // 机器学习预测
    const mlPrediction = await this.mlModel.predict(key, context, pattern);
    
    // 综合决策
    const confidence = (timeBasedPrediction.confidence + 
                       correlationPrediction.confidence + 
                       mlPrediction.confidence) / 3;
    
    return {
      shouldPreload: confidence > 0.7,
      confidence,
      relatedKeys: [
        ...timeBasedPrediction.relatedKeys,
        ...correlationPrediction.relatedKeys,
        ...mlPrediction.relatedKeys
      ]
    };
  }
  
  predictByTime(pattern) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // 检查历史同一时间的访问频率
    const hourlyScore = pattern.patterns.hourly[hour] / Math.max(1, pattern.accessCount);
    const dailyScore = pattern.patterns.daily[day] / Math.max(1, pattern.accessCount);
    
    const confidence = (hourlyScore + dailyScore) / 2;
    
    return {
      confidence,
      relatedKeys: confidence > 0.5 ? [pattern.key] : []
    };
  }
  
  predictByCorrelation(key, context) {
    const correlations = this.correlations.get(key) || [];
    const relatedKeys = [];
    let totalConfidence = 0;
    
    for (const correlation of correlations) {
      if (correlation.confidence > 0.6) {
        relatedKeys.push(correlation.relatedKey);
        totalConfidence += correlation.confidence;
      }
    }
    
    return {
      confidence: totalConfidence / Math.max(1, correlations.length),
      relatedKeys
    };
  }
}
```

### 2. 自适应负载均衡

```javascript
// 边缘自适应负载均衡
class EdgeAdaptiveLoadBalancer {
  constructor() {
    this.nodes = new Map();
    this.healthChecker = new NodeHealthChecker();
    this.metrics = new LoadBalancingMetrics();
    this.algorithms = {
      'round_robin': new RoundRobinBalancer(),
      'least_connections': new LeastConnectionsBalancer(),
      'weighted_response_time': new WeightedResponseTimeBalancer(),
      'geographic': new GeographicBalancer(),
      'adaptive': new AdaptiveBalancer()
    };
    this.currentAlgorithm = 'adaptive';
  }
  
  // 注册边缘节点
  registerNode(nodeId, nodeInfo) {
    this.nodes.set(nodeId, {
      id: nodeId,
      ...nodeInfo,
      status: 'active',
      currentConnections: 0,
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      lastHealthCheck: new Date(),
      capabilities: nodeInfo.capabilities || {},
      metrics: {
        cpu: 0,
        memory: 0,
        network: 0,
        storage: 0
      }
    });
    
    // 开始健康检查
    this.healthChecker.startMonitoring(nodeId);
    
    console.log(`边缘节点注册: ${nodeId}`);
  }
  
  // 选择最佳节点
  async selectNode(request) {
    const availableNodes = this.getAvailableNodes();
    if (availableNodes.length === 0) {
      throw new Error('没有可用的边缘节点');
    }
    
    const algorithm = this.algorithms[this.currentAlgorithm];
    const selectedNode = await algorithm.select(availableNodes, request);
    
    // 更新节点状态
    this.updateNodeStats(selectedNode.id, 'request_started');
    
    return selectedNode;
  }
  
  // 获取可用节点
  getAvailableNodes() {
    return Array.from(this.nodes.values()).filter(node => {
      return node.status === 'active' && 
             node.metrics.cpu < 0.9 && 
             node.metrics.memory < 0.9 &&
             node.currentConnections < node.maxConnections;
    });
  }
  
  // 自适应负载均衡算法
  class AdaptiveBalancer {
    async select(nodes, request) {
      // 计算每个节点的综合分数
      const scoredNodes = nodes.map(node => ({
        node,
        score: this.calculateNodeScore(node, request)
      }));
      
      // 按分数排序
      scoredNodes.sort((a, b) => b.score - a.score);
      
      // 使用加权随机选择
      return this.weightedRandomSelect(scoredNodes);
    }
    
    calculateNodeScore(node, request) {
      // 性能指标
      const performanceScore = this.calculatePerformanceScore(node);
      
      // 地理位置分数
      const locationScore = this.calculateLocationScore(node, request);
      
      // 负载分数
      const loadScore = this.calculateLoadScore(node);
      
      // 可靠性分数
      const reliabilityScore = this.calculateReliabilityScore(node);
      
      // 综合分数
      return (
        performanceScore * 0.3 +
        locationScore * 0.25 +
        loadScore * 0.25 +
        reliabilityScore * 0.2
      );
    }
    
    calculatePerformanceScore(node) {
      // 基于响应时间和成功率
      const responseTimeScore = Math.max(0, 1 - node.avgResponseTime / 1000);
      const successRateScore = node.totalRequests > 0 ? 
        node.successfulRequests / node.totalRequests : 1;
      
      return (responseTimeScore + successRateScore) / 2;
    }
    
    calculateLocationScore(node, request) {
      if (!request.clientLocation || !node.location) {
        return 0.5; // 默认分数
      }
      
      const distance = this.calculateDistance(request.clientLocation, node.location);
      return Math.max(0, 1 - distance / 10000); // 假设最大距离10000km
    }
    
    calculateLoadScore(node) {
      const cpuScore = 1 - node.metrics.cpu;
      const memoryScore = 1 - node.metrics.memory;
      const connectionScore = 1 - (node.currentConnections / node.maxConnections);
      
      return (cpuScore + memoryScore + connectionScore) / 3;
    }
    
    calculateReliabilityScore(node) {
      // 基于历史稳定性
      const uptimeScore = node.uptime || 1;
      const errorRateScore = 1 - (node.errorRate || 0);
      
      return (uptimeScore + errorRateScore) / 2;
    }
    
    weightedRandomSelect(scoredNodes) {
      const totalScore = scoredNodes.reduce((sum, item) => sum + item.score, 0);
      const random = Math.random() * totalScore;
      
      let currentSum = 0;
      for (const item of scoredNodes) {
        currentSum += item.score;
        if (random <= currentSum) {
          return item.node;
        }
      }
      
      return scoredNodes[0].node; // 回退选择
    }
    
    calculateDistance(loc1, loc2) {
      // 使用 Haversine 公式计算地理距离
      const R = 6371; // 地球半径（公里）
      const dLat = this.toRadians(loc2.lat - loc1.lat);
      const dLon = this.toRadians(loc2.lng - loc1.lng);
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    
    toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }
  }
  
  // 节点健康检查
  class NodeHealthChecker {
    constructor() {
      this.checkIntervals = new Map();
    }
    
    startMonitoring(nodeId) {
      const interval = setInterval(async () => {
        await this.checkNodeHealth(nodeId);
      }, 30000); // 30秒检查一次
      
      this.checkIntervals.set(nodeId, interval);
    }
    
    async checkNodeHealth(nodeId) {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      
      try {
        // 发送健康检查请求
        const healthData = await this.performHealthCheck(node);
        
        // 更新节点指标
        this.updateNodeMetrics(nodeId, healthData);
        
        // 更新节点状态
        if (node.status !== 'active' && healthData.healthy) {
          node.status = 'active';
          console.log(`节点恢复: ${nodeId}`);
        }
        
      } catch (error) {
        console.error(`节点健康检查失败 [${nodeId}]:`, error);
        
        // 标记节点为不可用
        if (node.status === 'active') {
          node.status = 'unhealthy';
          console.log(`节点下线: ${nodeId}`);
        }
      }
    }
    
    async performHealthCheck(node) {
      const response = await fetch(`${node.endpoint}/health`, {
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`健康检查失败: ${response.status}`);
      }
      
      return await response.json();
    }
    
    updateNodeMetrics(nodeId, healthData) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.metrics = {
          ...node.metrics,
          ...healthData.metrics
        };
        node.lastHealthCheck = new Date();
      }
    }
    
    stopMonitoring(nodeId) {
      const interval = this.checkIntervals.get(nodeId);
      if (interval) {
        clearInterval(interval);
        this.checkIntervals.delete(nodeId);
      }
    }
  }
  
  // 更新节点统计
  updateNodeStats(nodeId, event, data = {}) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    switch (event) {
      case 'request_started':
        node.currentConnections++;
        node.totalRequests++;
        break;
        
      case 'request_completed':
        node.currentConnections--;
        node.successfulRequests++;
        
        if (data.responseTime) {
          // 更新平均响应时间
          node.avgResponseTime = (node.avgResponseTime + data.responseTime) / 2;
        }
        break;
        
      case 'request_failed':
        node.currentConnections--;
        node.errorRate = (node.errorRate || 0) + 0.1;
        break;
    }
    
    // 记录指标
    this.metrics.record(nodeId, event, data);
  }
  
  // 动态调整算法
  async adaptLoadBalancingAlgorithm() {
    const metrics = await this.metrics.getRecentMetrics();
    
    // 分析性能指标
    const avgResponseTime = metrics.avgResponseTime;
    const errorRate = metrics.errorRate;
    const loadDistribution = metrics.loadDistribution;
    
    // 根据指标选择最佳算法
    if (errorRate > 0.05) {
      // 错误率高，使用可靠性优先
      this.currentAlgorithm = 'least_connections';
    } else if (avgResponseTime > 500) {
      // 响应时间慢，使用性能优先
      this.currentAlgorithm = 'weighted_response_time';
    } else if (loadDistribution.variance > 0.3) {
      // 负载不均，使用负载均衡
      this.currentAlgorithm = 'adaptive';
    } else {
      // 正常情况，使用地理位置优化
      this.currentAlgorithm = 'geographic';
    }
    
    console.log(`负载均衡算法调整为: ${this.currentAlgorithm}`);
  }
}
```

## 📚 最佳实践总结

1. **架构设计**：采用分层架构，合理分配计算任务
2. **缓存策略**：实现智能缓存和预测性加载
3. **负载均衡**：使用自适应负载均衡算法
4. **数据同步**：确保边缘节点间的数据一致性
5. **故障恢复**：实现自动故障检测和恢复机制
6. **性能监控**：全面监控边缘节点性能指标
7. **安全性**：确保边缘计算的安全性和隐私保护
8. **成本优化**：平衡性能和成本，优化资源使用

通过掌握这些边缘计算基础技术，您将能够构建高性能、低延迟的分布式应用系统。
