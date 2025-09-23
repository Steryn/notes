# 分布式系统

## 📖 概述

分布式系统是由多个独立的计算机节点组成，通过网络通信协同工作的系统。它能够提供更高的可用性、可扩展性和容错能力，但也带来了一致性、分区容错和复杂性等挑战。

## 🎯 学习目标

- 理解分布式系统的核心概念和理论基础
- 掌握一致性算法和分布式协议
- 学习分布式数据管理和事务处理
- 实现高可用的分布式系统架构

## 🌐 分布式系统架构

### 1. 分布式系统基础框架

```javascript
// 分布式系统核心框架
class DistributedSystemFramework {
  constructor(nodeId, config = {}) {
    this.nodeId = nodeId
    this.config = config
    this.cluster = new ClusterManager(nodeId)
    this.consensus = new ConsensusManager(nodeId)
    this.dataManager = new DistributedDataManager(nodeId)
    this.transactionManager = new DistributedTransactionManager(nodeId)
    this.communicationManager = new CommunicationManager(nodeId)
    this.failureDetector = new FailureDetector(nodeId)
    this.leaderElection = new LeaderElection(nodeId)
    this.vectorClock = new VectorClock(nodeId)
  }
  
  // 集群管理器
  class ClusterManager {
    constructor(nodeId) {
      this.nodeId = nodeId
      this.nodes = new Map()
      this.topology = new Map()
      this.status = 'disconnected'
      this.heartbeatInterval = 5000
      this.heartbeatTimer = null
    }
    
    // 加入集群
    async joinCluster(seedNodes = []) {
      try {
        console.log(`节点 ${this.nodeId} 加入集群`)
        
        this.status = 'joining'
        
        // 注册自己
        this.registerNode(this.nodeId, {
          id: this.nodeId,
          address: this.config.address || 'localhost:8080',
          roles: this.config.roles || ['worker'],
          capabilities: this.config.capabilities || [],
          joinedAt: new Date(),
          lastSeen: new Date(),
          status: 'active'
        })
        
        // 连接种子节点
        for (const seedNode of seedNodes) {
          await this.connectToNode(seedNode)
        }
        
        // 开始心跳
        this.startHeartbeat()
        
        this.status = 'active'
        console.log(`节点 ${this.nodeId} 加入集群成功`)
        
      } catch (error) {
        this.status = 'failed'
        console.error(`节点 ${this.nodeId} 加入集群失败:`, error)
        throw error
      }
    }
    
    // 离开集群
    async leaveCluster() {
      try {
        console.log(`节点 ${this.nodeId} 离开集群`)
        
        this.status = 'leaving'
        
        // 停止心跳
        this.stopHeartbeat()
        
        // 通知其他节点
        await this.broadcastLeaveMessage()
        
        // 清理资源
        this.nodes.clear()
        this.topology.clear()
        
        this.status = 'disconnected'
        console.log(`节点 ${this.nodeId} 离开集群成功`)
        
      } catch (error) {
        console.error(`节点 ${this.nodeId} 离开集群失败:`, error)
      }
    }
    
    // 注册节点
    registerNode(nodeId, nodeInfo) {
      this.nodes.set(nodeId, {
        ...nodeInfo,
        lastSeen: new Date()
      })
      
      console.log(`注册节点: ${nodeId}`)
    }
    
    // 连接到节点
    async connectToNode(nodeInfo) {
      try {
        console.log(`连接到节点: ${nodeInfo.id}`)
        
        // 模拟连接过程
        await this.delay(100)
        
        // 注册节点信息
        this.registerNode(nodeInfo.id, nodeInfo)
        
        // 建立拓扑连接
        this.addTopologyConnection(this.nodeId, nodeInfo.id)
        
        return true
        
      } catch (error) {
        console.error(`连接节点失败: ${nodeInfo.id}`, error)
        return false
      }
    }
    
    // 添加拓扑连接
    addTopologyConnection(from, to) {
      if (!this.topology.has(from)) {
        this.topology.set(from, new Set())
      }
      this.topology.get(from).add(to)
      
      if (!this.topology.has(to)) {
        this.topology.set(to, new Set())
      }
      this.topology.get(to).add(from)
    }
    
    // 开始心跳
    startHeartbeat() {
      if (this.heartbeatTimer) {
        return
      }
      
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat()
      }, this.heartbeatInterval)
      
      console.log(`节点 ${this.nodeId} 开始心跳`)
    }
    
    // 停止心跳
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
        console.log(`节点 ${this.nodeId} 停止心跳`)
      }
    }
    
    // 发送心跳
    async sendHeartbeat() {
      const heartbeatMessage = {
        type: 'heartbeat',
        from: this.nodeId,
        timestamp: Date.now(),
        status: this.status
      }
      
      // 向所有连接的节点发送心跳
      const connectedNodes = this.topology.get(this.nodeId) || new Set()
      
      for (const nodeId of connectedNodes) {
        try {
          await this.sendMessage(nodeId, heartbeatMessage)
        } catch (error) {
          console.warn(`心跳发送失败: ${nodeId}`, error.message)
          this.handleNodeFailure(nodeId)
        }
      }
    }
    
    // 处理心跳响应
    handleHeartbeatResponse(nodeId, message) {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.lastSeen = new Date()
        node.status = message.status || 'active'
      }
    }
    
    // 处理节点故障
    handleNodeFailure(nodeId) {
      console.warn(`检测到节点故障: ${nodeId}`)
      
      const node = this.nodes.get(nodeId)
      if (node) {
        node.status = 'failed'
        node.failedAt = new Date()
      }
      
      // 移除拓扑连接
      this.removeTopologyConnection(this.nodeId, nodeId)
      
      // 触发故障处理
      this.onNodeFailure(nodeId)
    }
    
    // 移除拓扑连接
    removeTopologyConnection(from, to) {
      const fromConnections = this.topology.get(from)
      if (fromConnections) {
        fromConnections.delete(to)
      }
      
      const toConnections = this.topology.get(to)
      if (toConnections) {
        toConnections.delete(from)
      }
    }
    
    // 广播离开消息
    async broadcastLeaveMessage() {
      const leaveMessage = {
        type: 'node_leave',
        from: this.nodeId,
        timestamp: Date.now()
      }
      
      await this.broadcast(leaveMessage)
    }
    
    // 广播消息
    async broadcast(message) {
      const connectedNodes = this.topology.get(this.nodeId) || new Set()
      
      const promises = Array.from(connectedNodes).map(nodeId => 
        this.sendMessage(nodeId, message)
      )
      
      await Promise.allSettled(promises)
    }
    
    // 发送消息
    async sendMessage(nodeId, message) {
      // 模拟网络通信
      await this.delay(10)
      
      // 这里应该实现实际的网络通信
      console.log(`发送消息: ${this.nodeId} -> ${nodeId}`, message.type)
    }
    
    // 节点故障回调
    onNodeFailure(nodeId) {
      // 子类可以重写此方法
      console.log(`节点故障处理: ${nodeId}`)
    }
    
    // 获取活跃节点
    getActiveNodes() {
      const activeNodes = []
      
      this.nodes.forEach((node, nodeId) => {
        if (node.status === 'active') {
          activeNodes.push(node)
        }
      })
      
      return activeNodes
    }
    
    // 获取集群状态
    getClusterStatus() {
      const nodes = Array.from(this.nodes.values())
      
      return {
        nodeId: this.nodeId,
        status: this.status,
        totalNodes: nodes.length,
        activeNodes: nodes.filter(n => n.status === 'active').length,
        failedNodes: nodes.filter(n => n.status === 'failed').length,
        topology: this.getTopologyInfo(),
        nodes: nodes
      }
    }
    
    getTopologyInfo() {
      const info = {}
      
      this.topology.forEach((connections, nodeId) => {
        info[nodeId] = Array.from(connections)
      })
      
      return info
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
  }
  
  // Raft共识算法实现
  class ConsensusManager {
    constructor(nodeId) {
      this.nodeId = nodeId
      this.state = 'follower' // 'follower', 'candidate', 'leader'
      this.currentTerm = 0
      this.votedFor = null
      this.log = []
      this.commitIndex = 0
      this.lastApplied = 0
      
      // Leader状态
      this.nextIndex = new Map()
      this.matchIndex = new Map()
      
      // 选举相关
      this.electionTimeout = this.randomElectionTimeout()
      this.electionTimer = null
      this.heartbeatInterval = 150
      this.heartbeatTimer = null
      
      this.peers = new Set()
      this.votes = new Set()
    }
    
    // 启动共识算法
    start(peers = []) {
      this.peers = new Set(peers)
      this.resetElectionTimer()
      
      console.log(`节点 ${this.nodeId} 启动Raft共识算法`)
    }
    
    // 停止共识算法
    stop() {
      this.clearElectionTimer()
      this.clearHeartbeatTimer()
      
      console.log(`节点 ${this.nodeId} 停止Raft共识算法`)
    }
    
    // 重置选举定时器
    resetElectionTimer() {
      this.clearElectionTimer()
      
      this.electionTimeout = this.randomElectionTimeout()
      this.electionTimer = setTimeout(() => {
        this.startElection()
      }, this.electionTimeout)
    }
    
    // 清除选举定时器
    clearElectionTimer() {
      if (this.electionTimer) {
        clearTimeout(this.electionTimer)
        this.electionTimer = null
      }
    }
    
    // 开始选举
    async startElection() {
      console.log(`节点 ${this.nodeId} 开始选举 (term: ${this.currentTerm + 1})`)
      
      this.state = 'candidate'
      this.currentTerm++
      this.votedFor = this.nodeId
      this.votes.clear()
      this.votes.add(this.nodeId) // 投给自己
      
      // 重置选举定时器
      this.resetElectionTimer()
      
      // 向所有节点发送投票请求
      await this.sendVoteRequests()
      
      // 检查选举结果
      this.checkElectionResult()
    }
    
    // 发送投票请求
    async sendVoteRequests() {
      const voteRequest = {
        type: 'vote_request',
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.log.length - 1,
        lastLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0
      }
      
      for (const peerId of this.peers) {
        try {
          await this.sendMessage(peerId, voteRequest)
        } catch (error) {
          console.warn(`投票请求发送失败: ${peerId}`, error.message)
        }
      }
    }
    
    // 处理投票请求
    handleVoteRequest(message) {
      const { term, candidateId, lastLogIndex, lastLogTerm } = message
      
      let voteGranted = false
      
      // 检查term
      if (term > this.currentTerm) {
        this.currentTerm = term
        this.votedFor = null
        this.state = 'follower'
      }
      
      // 决定是否投票
      if (term === this.currentTerm && 
          (this.votedFor === null || this.votedFor === candidateId) &&
          this.isLogUpToDate(lastLogIndex, lastLogTerm)) {
        
        voteGranted = true
        this.votedFor = candidateId
        this.resetElectionTimer()
      }
      
      // 发送投票响应
      const voteResponse = {
        type: 'vote_response',
        term: this.currentTerm,
        voteGranted: voteGranted,
        from: this.nodeId
      }
      
      this.sendMessage(candidateId, voteResponse)
      
      console.log(`节点 ${this.nodeId} 投票: ${candidateId} = ${voteGranted}`)
    }
    
    // 处理投票响应
    handleVoteResponse(message) {
      const { term, voteGranted, from } = message
      
      if (this.state !== 'candidate' || term !== this.currentTerm) {
        return
      }
      
      if (voteGranted) {
        this.votes.add(from)
        console.log(`节点 ${this.nodeId} 收到投票: ${from} (总计: ${this.votes.size})`)
      }
      
      this.checkElectionResult()
    }
    
    // 检查选举结果
    checkElectionResult() {
      if (this.state !== 'candidate') {
        return
      }
      
      const majorityVotes = Math.floor((this.peers.size + 1) / 2) + 1
      
      if (this.votes.size >= majorityVotes) {
        this.becomeLeader()
      }
    }
    
    // 成为领导者
    becomeLeader() {
      console.log(`节点 ${this.nodeId} 成为领导者 (term: ${this.currentTerm})`)
      
      this.state = 'leader'
      this.clearElectionTimer()
      
      // 初始化leader状态
      this.peers.forEach(peerId => {
        this.nextIndex.set(peerId, this.log.length)
        this.matchIndex.set(peerId, 0)
      })
      
      // 开始发送心跳
      this.startHeartbeat()
      
      // 发送空的AppendEntries作为心跳
      this.sendHeartbeats()
    }
    
    // 开始心跳
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeats()
      }, this.heartbeatInterval)
    }
    
    // 清除心跳定时器
    clearHeartbeatTimer() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }
    }
    
    // 发送心跳
    async sendHeartbeats() {
      if (this.state !== 'leader') {
        return
      }
      
      for (const peerId of this.peers) {
        await this.sendAppendEntries(peerId)
      }
    }
    
    // 发送AppendEntries
    async sendAppendEntries(peerId, entries = []) {
      const nextIndex = this.nextIndex.get(peerId) || this.log.length
      const prevLogIndex = nextIndex - 1
      const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex].term : 0
      
      const appendEntries = {
        type: 'append_entries',
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex: prevLogIndex,
        prevLogTerm: prevLogTerm,
        entries: entries,
        leaderCommit: this.commitIndex
      }
      
      try {
        await this.sendMessage(peerId, appendEntries)
      } catch (error) {
        console.warn(`AppendEntries发送失败: ${peerId}`, error.message)
      }
    }
    
    // 处理AppendEntries
    handleAppendEntries(message) {
      const { term, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit } = message
      
      let success = false
      
      // 检查term
      if (term > this.currentTerm) {
        this.currentTerm = term
        this.votedFor = null
      }
      
      if (term === this.currentTerm) {
        this.state = 'follower'
        this.resetElectionTimer()
        
        // 检查日志一致性
        if (prevLogIndex === -1 || 
            (prevLogIndex < this.log.length && this.log[prevLogIndex].term === prevLogTerm)) {
          
          success = true
          
          // 添加新条目
          if (entries.length > 0) {
            this.log = this.log.slice(0, prevLogIndex + 1).concat(entries)
          }
          
          // 更新commitIndex
          if (leaderCommit > this.commitIndex) {
            this.commitIndex = Math.min(leaderCommit, this.log.length - 1)
          }
        }
      }
      
      // 发送响应
      const appendResponse = {
        type: 'append_response',
        term: this.currentTerm,
        success: success,
        from: this.nodeId
      }
      
      this.sendMessage(leaderId, appendResponse)
    }
    
    // 处理AppendEntries响应
    handleAppendResponse(message) {
      const { term, success, from } = message
      
      if (this.state !== 'leader' || term !== this.currentTerm) {
        return
      }
      
      if (success) {
        this.nextIndex.set(from, this.nextIndex.get(from) + 1)
        this.matchIndex.set(from, this.nextIndex.get(from) - 1)
      } else {
        // 递减nextIndex并重试
        this.nextIndex.set(from, Math.max(1, this.nextIndex.get(from) - 1))
        this.sendAppendEntries(from)
      }
    }
    
    // 添加日志条目
    async appendEntry(command) {
      if (this.state !== 'leader') {
        throw new Error('只有领导者可以添加日志条目')
      }
      
      const entry = {
        term: this.currentTerm,
        index: this.log.length,
        command: command,
        timestamp: Date.now()
      }
      
      this.log.push(entry)
      
      console.log(`领导者 ${this.nodeId} 添加日志条目:`, entry)
      
      // 复制到其他节点
      await this.replicateEntry(entry)
      
      return entry
    }
    
    // 复制日志条目
    async replicateEntry(entry) {
      const promises = Array.from(this.peers).map(peerId => 
        this.sendAppendEntries(peerId, [entry])
      )
      
      await Promise.allSettled(promises)
    }
    
    // 检查日志是否最新
    isLogUpToDate(lastLogIndex, lastLogTerm) {
      if (this.log.length === 0) {
        return lastLogIndex === -1
      }
      
      const myLastLogTerm = this.log[this.log.length - 1].term
      const myLastLogIndex = this.log.length - 1
      
      return lastLogTerm > myLastLogTerm || 
             (lastLogTerm === myLastLogTerm && lastLogIndex >= myLastLogIndex)
    }
    
    // 随机选举超时
    randomElectionTimeout() {
      return 300 + Math.random() * 200 // 300-500ms
    }
    
    // 发送消息 (需要实现实际的网络通信)
    async sendMessage(nodeId, message) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 这里应该实现实际的网络通信
      console.log(`Raft消息: ${this.nodeId} -> ${nodeId}`, message.type)
    }
    
    // 获取共识状态
    getConsensusState() {
      return {
        nodeId: this.nodeId,
        state: this.state,
        currentTerm: this.currentTerm,
        votedFor: this.votedFor,
        logLength: this.log.length,
        commitIndex: this.commitIndex,
        lastApplied: this.lastApplied,
        isLeader: this.state === 'leader',
        peers: Array.from(this.peers)
      }
    }
  }
  
  // 分布式数据管理器
  class DistributedDataManager {
    constructor(nodeId) {
      this.nodeId = nodeId
      this.data = new Map()
      this.replicationFactor = 3
      this.consistencyLevel = 'quorum' // 'one', 'quorum', 'all'
      this.partitioner = new ConsistentHashPartitioner()
      this.versionVector = new Map()
    }
    
    // 写入数据
    async write(key, value, options = {}) {
      const writeRequest = {
        key,
        value,
        timestamp: Date.now(),
        version: this.generateVersion(key),
        nodeId: this.nodeId,
        consistencyLevel: options.consistencyLevel || this.consistencyLevel
      }
      
      console.log(`写入数据: ${key} = ${JSON.stringify(value)}`)
      
      // 确定副本节点
      const replicaNodes = this.partitioner.getReplicaNodes(key, this.replicationFactor)
      
      // 执行写入
      const writeResults = await this.executeWrite(writeRequest, replicaNodes)
      
      // 检查一致性要求
      const success = this.checkWriteConsistency(writeResults, writeRequest.consistencyLevel)
      
      if (success) {
        console.log(`写入成功: ${key}`)
        return { success: true, version: writeRequest.version }
      } else {
        throw new Error(`写入失败: 一致性要求未满足`)
      }
    }
    
    // 读取数据
    async read(key, options = {}) {
      console.log(`读取数据: ${key}`)
      
      const readRequest = {
        key,
        timestamp: Date.now(),
        consistencyLevel: options.consistencyLevel || this.consistencyLevel,
        nodeId: this.nodeId
      }
      
      // 确定副本节点
      const replicaNodes = this.partitioner.getReplicaNodes(key, this.replicationFactor)
      
      // 执行读取
      const readResults = await this.executeRead(readRequest, replicaNodes)
      
      // 解决冲突并返回最新版本
      const resolvedValue = this.resolveConflicts(readResults)
      
      console.log(`读取结果: ${key} = ${JSON.stringify(resolvedValue)}`)
      
      return resolvedValue
    }
    
    // 执行写入
    async executeWrite(writeRequest, replicaNodes) {
      const writePromises = replicaNodes.map(async nodeId => {
        try {
          if (nodeId === this.nodeId) {
            // 本地写入
            return await this.localWrite(writeRequest)
          } else {
            // 远程写入
            return await this.remoteWrite(nodeId, writeRequest)
          }
        } catch (error) {
          return { success: false, error: error.message, nodeId }
        }
      })
      
      const results = await Promise.allSettled(writePromises)
      
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      )
    }
    
    // 执行读取
    async executeRead(readRequest, replicaNodes) {
      const readPromises = replicaNodes.map(async nodeId => {
        try {
          if (nodeId === this.nodeId) {
            // 本地读取
            return await this.localRead(readRequest)
          } else {
            // 远程读取
            return await this.remoteRead(nodeId, readRequest)
          }
        } catch (error) {
          return { success: false, error: error.message, nodeId }
        }
      })
      
      const results = await Promise.allSettled(readPromises)
      
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      ).filter(result => result.success)
    }
    
    // 本地写入
    async localWrite(writeRequest) {
      const { key, value, version, timestamp } = writeRequest
      
      this.data.set(key, {
        value,
        version,
        timestamp,
        nodeId: this.nodeId
      })
      
      this.versionVector.set(key, version)
      
      return { success: true, nodeId: this.nodeId, version }
    }
    
    // 本地读取
    async localRead(readRequest) {
      const { key } = readRequest
      
      const item = this.data.get(key)
      
      if (item) {
        return {
          success: true,
          value: item.value,
          version: item.version,
          timestamp: item.timestamp,
          nodeId: this.nodeId
        }
      } else {
        return { success: false, error: 'Key not found', nodeId: this.nodeId }
      }
    }
    
    // 远程写入
    async remoteWrite(nodeId, writeRequest) {
      // 模拟远程调用
      await this.delay(20)
      
      // 这里应该实现实际的远程调用
      console.log(`远程写入: ${nodeId} <- ${writeRequest.key}`)
      
      return { success: true, nodeId, version: writeRequest.version }
    }
    
    // 远程读取
    async remoteRead(nodeId, readRequest) {
      // 模拟远程调用
      await this.delay(20)
      
      // 这里应该实现实际的远程调用
      console.log(`远程读取: ${nodeId} -> ${readRequest.key}`)
      
      // 模拟返回数据
      return {
        success: true,
        value: `remote_value_${readRequest.key}`,
        version: this.generateVersion(readRequest.key),
        timestamp: Date.now(),
        nodeId
      }
    }
    
    // 检查写入一致性
    checkWriteConsistency(writeResults, consistencyLevel) {
      const successCount = writeResults.filter(r => r.success).length
      const totalNodes = writeResults.length
      
      switch (consistencyLevel) {
        case 'one':
          return successCount >= 1
        case 'quorum':
          return successCount >= Math.floor(totalNodes / 2) + 1
        case 'all':
          return successCount === totalNodes
        default:
          return false
      }
    }
    
    // 解决读取冲突
    resolveConflicts(readResults) {
      if (readResults.length === 0) {
        return null
      }
      
      // 选择最新的版本
      const sortedResults = readResults.sort((a, b) => b.timestamp - a.timestamp)
      
      return sortedResults[0].value
    }
    
    // 生成版本号
    generateVersion(key) {
      const currentVersion = this.versionVector.get(key) || 0
      const newVersion = currentVersion + 1
      return newVersion
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    // 获取数据统计
    getDataStatistics() {
      return {
        nodeId: this.nodeId,
        totalKeys: this.data.size,
        replicationFactor: this.replicationFactor,
        consistencyLevel: this.consistencyLevel,
        keys: Array.from(this.data.keys())
      }
    }
  }
  
  // 一致性哈希分区器
  class ConsistentHashPartitioner {
    constructor() {
      this.ring = new Map()
      this.virtualNodes = 150
      this.nodes = new Set()
    }
    
    // 添加节点
    addNode(nodeId) {
      this.nodes.add(nodeId)
      
      for (let i = 0; i < this.virtualNodes; i++) {
        const virtualKey = `${nodeId}:${i}`
        const hash = this.hash(virtualKey)
        this.ring.set(hash, nodeId)
      }
      
      this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b)
    }
    
    // 移除节点
    removeNode(nodeId) {
      this.nodes.delete(nodeId)
      
      for (let i = 0; i < this.virtualNodes; i++) {
        const virtualKey = `${nodeId}:${i}`
        const hash = this.hash(virtualKey)
        this.ring.delete(hash)
      }
      
      this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b)
    }
    
    // 获取副本节点
    getReplicaNodes(key, replicationFactor) {
      if (this.nodes.size === 0) {
        return []
      }
      
      const hash = this.hash(key)
      const replicas = new Set()
      
      let index = this.findNextIndex(hash)
      
      while (replicas.size < Math.min(replicationFactor, this.nodes.size)) {
        const nodeId = this.ring.get(this.sortedKeys[index])
        replicas.add(nodeId)
        
        index = (index + 1) % this.sortedKeys.length
      }
      
      return Array.from(replicas)
    }
    
    findNextIndex(hash) {
      for (let i = 0; i < this.sortedKeys.length; i++) {
        if (this.sortedKeys[i] >= hash) {
          return i
        }
      }
      return 0 // 环形结构
    }
    
    hash(key) {
      let hash = 0
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash)
    }
  }
  
  // 启动分布式系统
  async start(config = {}) {
    try {
      console.log(`启动分布式系统节点: ${this.nodeId}`)
      
      // 启动集群管理
      await this.cluster.joinCluster(config.seedNodes || [])
      
      // 启动共识算法
      const peers = config.peers || []
      this.consensus.start(peers)
      
      // 初始化数据分区
      if (config.clusterNodes) {
        config.clusterNodes.forEach(nodeId => {
          this.dataManager.partitioner.addNode(nodeId)
        })
      }
      
      console.log(`分布式系统节点启动完成: ${this.nodeId}`)
      
    } catch (error) {
      console.error(`分布式系统节点启动失败: ${this.nodeId}`, error)
      throw error
    }
  }
  
  // 停止分布式系统
  async stop() {
    try {
      console.log(`停止分布式系统节点: ${this.nodeId}`)
      
      // 停止共识算法
      this.consensus.stop()
      
      // 离开集群
      await this.cluster.leaveCluster()
      
      console.log(`分布式系统节点停止完成: ${this.nodeId}`)
      
    } catch (error) {
      console.error(`分布式系统节点停止失败: ${this.nodeId}`, error)
    }
  }
  
  // 获取系统状态
  getSystemStatus() {
    return {
      nodeId: this.nodeId,
      cluster: this.cluster.getClusterStatus(),
      consensus: this.consensus.getConsensusState(),
      data: this.dataManager.getDataStatistics()
    }
  }
}

// 使用示例
async function demonstrateDistributedSystem() {
  console.log('=== 分布式系统演示 ===')
  
  // 创建3个节点的集群
  const node1 = new DistributedSystemFramework('node1')
  const node2 = new DistributedSystemFramework('node2')
  const node3 = new DistributedSystemFramework('node3')
  
  try {
    // 启动节点
    await node1.start({
      seedNodes: [],
      peers: ['node2', 'node3'],
      clusterNodes: ['node1', 'node2', 'node3']
    })
    
    await node2.start({
      seedNodes: [{ id: 'node1', address: 'localhost:8081' }],
      peers: ['node1', 'node3'],
      clusterNodes: ['node1', 'node2', 'node3']
    })
    
    await node3.start({
      seedNodes: [{ id: 'node1', address: 'localhost:8081' }],
      peers: ['node1', 'node2'],
      clusterNodes: ['node1', 'node2', 'node3']
    })
    
    // 等待集群稳定
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 测试分布式数据操作
    console.log('测试分布式数据操作...')
    
    // 写入数据
    await node1.dataManager.write('user:1001', { name: 'Alice', age: 30 })
    await node2.dataManager.write('user:1002', { name: 'Bob', age: 25 })
    await node3.dataManager.write('user:1003', { name: 'Charlie', age: 35 })
    
    // 读取数据
    const user1 = await node2.dataManager.read('user:1001')
    const user2 = await node3.dataManager.read('user:1002')
    const user3 = await node1.dataManager.read('user:1003')
    
    console.log('读取结果:')
    console.log('User 1:', user1)
    console.log('User 2:', user2)
    console.log('User 3:', user3)
    
    // 获取系统状态
    const status1 = node1.getSystemStatus()
    const status2 = node2.getSystemStatus()
    const status3 = node3.getSystemStatus()
    
    console.log('节点状态:')
    console.log('Node 1:', status1.consensus.state, '(term:', status1.consensus.currentTerm, ')')
    console.log('Node 2:', status2.consensus.state, '(term:', status2.consensus.currentTerm, ')')
    console.log('Node 3:', status3.consensus.state, '(term:', status3.consensus.currentTerm, ')')
    
    // 停止节点
    await Promise.all([
      node1.stop(),
      node2.stop(),
      node3.stop()
    ])
    
    console.log('分布式系统演示完成')
    
  } catch (error) {
    console.error('分布式系统演示失败:', error)
  }
}

module.exports = {
  DistributedSystemFramework
}
```

## 📚 最佳实践总结

1. **CAP定理理解**：理解一致性、可用性和分区容错性的权衡
2. **共识算法选择**：根据场景选择Raft、PBFT等共识算法
3. **数据分片策略**：合理的数据分区和副本策略
4. **故障检测机制**：实现快速准确的故障检测和恢复
5. **网络分区处理**：优雅处理网络分区和脑裂问题
6. **事务管理**：实现分布式事务的ACID特性
7. **监控和调试**：全面的分布式系统监控和问题诊断
8. **渐进式部署**：分阶段部署降低分布式系统风险

通过掌握分布式系统技术，您将能够构建高可用、可扩展的大规模分布式应用。
