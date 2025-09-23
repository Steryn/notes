# 边缘函数部署

## 📖 概述

边缘函数部署是将计算逻辑部署到全球边缘节点的过程，通过多平台、多区域的部署策略，确保用户能够以最低延迟访问应用服务。本文档涵盖各种边缘平台的部署方法和最佳实践。

## 🎯 学习目标

- 掌握多平台边缘函数部署策略
- 学习自动化部署和CI/CD流程
- 了解边缘函数的监控和管理
- 掌握性能优化和故障排查

## 🚀 部署策略

### 1. 多平台部署管理器

```javascript
// 多平台边缘部署管理器
class EdgeDeploymentManager {
  constructor() {
    this.platforms = {
      cloudflare: new CloudflareDeployer(),
      aws: new AWSLambdaEdgeDeployer(),
      vercel: new VercelDeployer(),
      netlify: new NetlifyDeployer(),
      fastly: new FastlyDeployer()
    }
    
    this.deploymentConfig = new DeploymentConfig()
    this.healthChecker = new EdgeHealthChecker()
    this.rollbackManager = new RollbackManager()
  }
  
  // 统一部署接口
  async deploy(functionCode, config) {
    const deploymentPlan = await this.createDeploymentPlan(config)
    const results = []
    
    console.log(`开始多平台部署: ${config.functionName}`)
    
    for (const platform of deploymentPlan.platforms) {
      try {
        console.log(`部署到 ${platform.name}...`)
        
        const deployer = this.platforms[platform.name]
        const result = await deployer.deploy(functionCode, {
          ...config,
          ...platform.config
        })
        
        results.push({
          platform: platform.name,
          success: true,
          deploymentId: result.deploymentId,
          url: result.url,
          regions: result.regions
        })
        
        console.log(`${platform.name} 部署成功: ${result.url}`)
        
      } catch (error) {
        console.error(`${platform.name} 部署失败:`, error)
        
        results.push({
          platform: platform.name,
          success: false,
          error: error.message
        })
        
        // 根据策略决定是否继续部署
        if (config.failureStrategy === 'stop_on_error') {
          break
        }
      }
    }
    
    // 健康检查
    await this.performHealthChecks(results)
    
    // 更新路由配置
    await this.updateRouting(results, config)
    
    return {
      deploymentId: this.generateDeploymentId(),
      results,
      summary: this.generateDeploymentSummary(results)
    }
  }
  
  // 创建部署计划
  async createDeploymentPlan(config) {
    const plan = {
      platforms: [],
      strategy: config.strategy || 'parallel',
      regions: config.regions || ['global']
    }
    
    // 根据需求选择平台
    if (config.platforms) {
      plan.platforms = config.platforms.map(name => ({
        name,
        config: config.platformConfigs?.[name] || {}
      }))
    } else {
      // 自动选择最佳平台组合
      plan.platforms = await this.selectOptimalPlatforms(config)
    }
    
    return plan
  }
  
  // 选择最佳平台组合
  async selectOptimalPlatforms(config) {
    const criteria = {
      performance: config.performanceWeight || 0.4,
      cost: config.costWeight || 0.3,
      coverage: config.coverageWeight || 0.3
    }
    
    const platformScores = await Promise.all(
      Object.keys(this.platforms).map(async name => {
        const deployer = this.platforms[name]
        const score = await deployer.calculateScore(config, criteria)
        
        return { name, score, config: {} }
      })
    )
    
    // 按分数排序并选择前几个
    platformScores.sort((a, b) => b.score - a.score)
    
    const selectedCount = Math.min(
      config.maxPlatforms || 3,
      platformScores.length
    )
    
    return platformScores.slice(0, selectedCount)
  }
  
  // 健康检查
  async performHealthChecks(deploymentResults) {
    const healthChecks = deploymentResults
      .filter(result => result.success)
      .map(async result => {
        try {
          const health = await this.healthChecker.check(result.url)
          result.healthStatus = health
          return result
        } catch (error) {
          result.healthStatus = { healthy: false, error: error.message }
          return result
        }
      })
    
    await Promise.all(healthChecks)
  }
  
  // 更新路由配置
  async updateRouting(deploymentResults, config) {
    const healthyDeployments = deploymentResults.filter(
      result => result.success && result.healthStatus?.healthy
    )
    
    if (healthyDeployments.length === 0) {
      throw new Error('没有健康的部署可用于路由')
    }
    
    // 更新 DNS 或负载均衡器配置
    await this.updateDNSConfig(healthyDeployments, config)
    
    // 更新 CDN 配置
    await this.updateCDNConfig(healthyDeployments, config)
  }
  
  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  
  generateDeploymentSummary(results) {
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    return {
      total: results.length,
      successful,
      failed,
      successRate: successful / results.length,
      platforms: results.map(r => ({
        platform: r.platform,
        status: r.success ? 'deployed' : 'failed'
      }))
    }
  }
}
```

### 2. Cloudflare Workers 部署器

```javascript
// Cloudflare Workers 部署器
class CloudflareDeployer {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    this.baseURL = 'https://api.cloudflare.com/client/v4'
  }
  
  async deploy(functionCode, config) {
    try {
      // 1. 创建或更新 Worker
      const workerResult = await this.deployWorker(functionCode, config)
      
      // 2. 配置路由
      if (config.routes && config.routes.length > 0) {
        await this.configureRoutes(config.workerName, config.routes)
      }
      
      // 3. 配置环境变量
      if (config.environment) {
        await this.configureEnvironment(config.workerName, config.environment)
      }
      
      // 4. 配置 KV 命名空间
      if (config.kvNamespaces) {
        await this.configureKVNamespaces(config.workerName, config.kvNamespaces)
      }
      
      return {
        deploymentId: workerResult.id,
        url: `https://${config.workerName}.${this.accountId}.workers.dev`,
        regions: ['global'], // Cloudflare 全球部署
        platform: 'cloudflare',
        metadata: workerResult
      }
      
    } catch (error) {
      console.error('Cloudflare 部署失败:', error)
      throw new Error(`Cloudflare 部署失败: ${error.message}`)
    }
  }
  
  async deployWorker(code, config) {
    const formData = new FormData()
    
    // 主脚本
    formData.append('script', code, {
      filename: 'worker.js',
      contentType: 'application/javascript'
    })
    
    // 元数据
    const metadata = {
      main_module: 'worker.js',
      bindings: this.buildBindings(config),
      compatibility_date: config.compatibilityDate || '2023-10-30',
      compatibility_flags: config.compatibilityFlags || []
    }
    
    formData.append('metadata', JSON.stringify(metadata))
    
    const response = await fetch(
      `${this.baseURL}/accounts/${this.accountId}/workers/scripts/${config.workerName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: formData
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Worker 部署失败: ${error}`)
    }
    
    return await response.json()
  }
  
  buildBindings(config) {
    const bindings = []
    
    // KV 命名空间绑定
    if (config.kvNamespaces) {
      config.kvNamespaces.forEach(kv => {
        bindings.push({
          type: 'kv_namespace',
          name: kv.binding,
          namespace_id: kv.namespaceId
        })
      })
    }
    
    // Durable Objects 绑定
    if (config.durableObjects) {
      config.durableObjects.forEach(obj => {
        bindings.push({
          type: 'durable_object_namespace',
          name: obj.binding,
          class_name: obj.className
        })
      })
    }
    
    // R2 存储绑定
    if (config.r2Buckets) {
      config.r2Buckets.forEach(bucket => {
        bindings.push({
          type: 'r2_bucket',
          name: bucket.binding,
          bucket_name: bucket.bucketName
        })
      })
    }
    
    // 环境变量绑定
    if (config.environment) {
      Object.entries(config.environment).forEach(([key, value]) => {
        bindings.push({
          type: 'plain_text',
          name: key,
          text: value
        })
      })
    }
    
    return bindings
  }
  
  async configureRoutes(workerName, routes) {
    for (const route of routes) {
      await this.createRoute(workerName, route)
    }
  }
  
  async createRoute(workerName, route) {
    const response = await fetch(
      `${this.baseURL}/zones/${route.zoneId}/workers/routes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern: route.pattern,
          script: workerName
        })
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`路由配置失败: ${error}`)
    }
  }
  
  async calculateScore(config, criteria) {
    // 基于不同标准计算平台分数
    let score = 0
    
    // 性能分数 (Cloudflare 全球网络优秀)
    score += criteria.performance * 0.9
    
    // 成本分数 (相对便宜)
    score += criteria.cost * 0.8
    
    // 覆盖分数 (全球覆盖优秀)
    score += criteria.coverage * 0.95
    
    return score
  }
}
```

### 3. AWS Lambda@Edge 部署器

```javascript
// AWS Lambda@Edge 部署器
class AWSLambdaEdgeDeployer {
  constructor() {
    this.lambda = new AWS.Lambda({ region: 'us-east-1' }) // Lambda@Edge 必须在 us-east-1
    this.cloudfront = new AWS.CloudFront()
    this.iam = new AWS.IAM()
  }
  
  async deploy(functionCode, config) {
    try {
      // 1. 创建或更新 Lambda 函数
      const functionResult = await this.deployLambdaFunction(functionCode, config)
      
      // 2. 发布版本
      const version = await this.publishVersion(config.functionName)
      
      // 3. 更新 CloudFront 分配
      if (config.distributionId) {
        await this.updateCloudFrontDistribution(
          config.distributionId,
          config.functionName,
          version.Version,
          config.triggerType
        )
      }
      
      return {
        deploymentId: functionResult.FunctionArn,
        url: `https://${config.domainName || 'example.cloudfront.net'}`,
        regions: this.getCloudFrontRegions(),
        platform: 'aws-lambda-edge',
        version: version.Version,
        metadata: functionResult
      }
      
    } catch (error) {
      console.error('AWS Lambda@Edge 部署失败:', error)
      throw new Error(`AWS Lambda@Edge 部署失败: ${error.message}`)
    }
  }
  
  async deployLambdaFunction(code, config) {
    const functionName = config.functionName
    
    // 检查函数是否存在
    let functionExists = false
    try {
      await this.lambda.getFunction({ FunctionName: functionName }).promise()
      functionExists = true
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error
      }
    }
    
    const functionConfig = {
      FunctionName: functionName,
      Runtime: config.runtime || 'nodejs18.x',
      Handler: config.handler || 'index.handler',
      Code: {
        ZipFile: this.createZipBuffer(code, config)
      },
      Description: config.description || 'Edge function',
      Timeout: Math.min(config.timeout || 5, 30), // Lambda@Edge 限制
      MemorySize: Math.min(config.memorySize || 128, 3008),
      Role: config.roleArn || await this.createExecutionRole(functionName),
      Environment: config.environment ? {
        Variables: config.environment
      } : undefined
    }
    
    if (functionExists) {
      // 更新现有函数
      await this.lambda.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: functionConfig.Code.ZipFile
      }).promise()
      
      return await this.lambda.updateFunctionConfiguration({
        FunctionName: functionName,
        Runtime: functionConfig.Runtime,
        Handler: functionConfig.Handler,
        Description: functionConfig.Description,
        Timeout: functionConfig.Timeout,
        MemorySize: functionConfig.MemorySize,
        Environment: functionConfig.Environment
      }).promise()
    } else {
      // 创建新函数
      return await this.lambda.createFunction(functionConfig).promise()
    }
  }
  
  async publishVersion(functionName) {
    return await this.lambda.publishVersion({
      FunctionName: functionName,
      Description: `Published at ${new Date().toISOString()}`
    }).promise()
  }
  
  async updateCloudFrontDistribution(distributionId, functionName, version, triggerType) {
    // 获取当前分配配置
    const distribution = await this.cloudfront.getDistribution({
      Id: distributionId
    }).promise()
    
    const config = distribution.Distribution.DistributionConfig
    const functionArn = `arn:aws:lambda:us-east-1:${await this.getAccountId()}:function:${functionName}:${version}`
    
    // 更新 Lambda 函数关联
    const lambdaAssociation = {
      LambdaFunctionARN: functionArn,
      EventType: triggerType || 'viewer-request'
    }
    
    // 添加到默认缓存行为
    if (!config.DefaultCacheBehavior.LambdaFunctionAssociations) {
      config.DefaultCacheBehavior.LambdaFunctionAssociations = {
        Quantity: 0,
        Items: []
      }
    }
    
    // 移除现有的相同类型关联
    config.DefaultCacheBehavior.LambdaFunctionAssociations.Items = 
      config.DefaultCacheBehavior.LambdaFunctionAssociations.Items.filter(
        item => item.EventType !== triggerType
      )
    
    // 添加新关联
    config.DefaultCacheBehavior.LambdaFunctionAssociations.Items.push(lambdaAssociation)
    config.DefaultCacheBehavior.LambdaFunctionAssociations.Quantity = 
      config.DefaultCacheBehavior.LambdaFunctionAssociations.Items.length
    
    // 更新分配
    await this.cloudfront.updateDistribution({
      Id: distributionId,
      DistributionConfig: config,
      IfMatch: distribution.ETag
    }).promise()
  }
  
  createZipBuffer(code, config) {
    const JSZip = require('jszip')
    const zip = new JSZip()
    
    // 添加主文件
    zip.file('index.js', code)
    
    // 添加 package.json
    const packageJson = {
      name: config.functionName,
      version: '1.0.0',
      main: 'index.js',
      dependencies: config.dependencies || {}
    }
    zip.file('package.json', JSON.stringify(packageJson, null, 2))
    
    // 添加其他文件
    if (config.additionalFiles) {
      Object.entries(config.additionalFiles).forEach(([filename, content]) => {
        zip.file(filename, content)
      })
    }
    
    return zip.generateNodeStream({ type: 'nodebuffer', compression: 'DEFLATE' })
  }
  
  async createExecutionRole(functionName) {
    const roleName = `${functionName}-edge-role`
    
    const trustPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com']
          },
          Action: 'sts:AssumeRole'
        }
      ]
    }
    
    try {
      const role = await this.iam.createRole({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
        Description: `Execution role for ${functionName} Lambda@Edge function`
      }).promise()
      
      // 附加基本执行策略
      await this.iam.attachRolePolicy({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      }).promise()
      
      // 等待角色传播
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      return role.Role.Arn
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        const role = await this.iam.getRole({ RoleName: roleName }).promise()
        return role.Role.Arn
      }
      throw error
    }
  }
  
  getCloudFrontRegions() {
    return [
      'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
      'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
    ]
  }
  
  async getAccountId() {
    const sts = new AWS.STS()
    const identity = await sts.getCallerIdentity().promise()
    return identity.Account
  }
  
  async calculateScore(config, criteria) {
    let score = 0
    
    // 性能分数 (AWS 全球网络良好)
    score += criteria.performance * 0.85
    
    // 成本分数 (相对较贵)
    score += criteria.cost * 0.6
    
    // 覆盖分数 (全球覆盖良好)
    score += criteria.coverage * 0.9
    
    return score
  }
}
```

### 4. CI/CD 自动化部署

```javascript
// CI/CD 部署管道
class EdgeDeploymentPipeline {
  constructor() {
    this.stages = [
      new BuildStage(),
      new TestStage(),
      new DeployStage(),
      new VerifyStage(),
      new PromoteStage()
    ]
    
    this.config = new PipelineConfig()
    this.notifications = new NotificationService()
  }
  
  async execute(triggerEvent) {
    const pipelineRun = {
      id: this.generateRunId(),
      trigger: triggerEvent,
      startTime: new Date(),
      stages: [],
      status: 'running'
    }
    
    console.log(`开始 CI/CD 管道: ${pipelineRun.id}`)
    
    try {
      for (const stage of this.stages) {
        const stageResult = await this.executeStage(stage, pipelineRun)
        pipelineRun.stages.push(stageResult)
        
        if (!stageResult.success) {
          pipelineRun.status = 'failed'
          await this.handlePipelineFailure(pipelineRun, stageResult)
          break
        }
      }
      
      if (pipelineRun.status === 'running') {
        pipelineRun.status = 'success'
        await this.handlePipelineSuccess(pipelineRun)
      }
      
    } catch (error) {
      pipelineRun.status = 'error'
      pipelineRun.error = error.message
      await this.handlePipelineError(pipelineRun, error)
    } finally {
      pipelineRun.endTime = new Date()
      pipelineRun.duration = pipelineRun.endTime - pipelineRun.startTime
      await this.savePipelineRun(pipelineRun)
    }
    
    return pipelineRun
  }
  
  async executeStage(stage, pipelineRun) {
    const stageRun = {
      name: stage.name,
      startTime: new Date(),
      status: 'running',
      logs: []
    }
    
    console.log(`执行阶段: ${stage.name}`)
    
    try {
      const result = await stage.execute(pipelineRun, stageRun)
      
      stageRun.status = 'success'
      stageRun.result = result
      stageRun.success = true
      
    } catch (error) {
      stageRun.status = 'failed'
      stageRun.error = error.message
      stageRun.success = false
      
      console.error(`阶段失败: ${stage.name}`, error)
    } finally {
      stageRun.endTime = new Date()
      stageRun.duration = stageRun.endTime - stageRun.startTime
    }
    
    return stageRun
  }
}

// 构建阶段
class BuildStage {
  constructor() {
    this.name = 'build'
  }
  
  async execute(pipelineRun, stageRun) {
    stageRun.logs.push('开始构建阶段...')
    
    // 1. 检出代码
    const sourceCode = await this.checkoutCode(pipelineRun.trigger.repository)
    stageRun.logs.push('代码检出完成')
    
    // 2. 安装依赖
    await this.installDependencies(sourceCode.path)
    stageRun.logs.push('依赖安装完成')
    
    // 3. 构建函数
    const buildResult = await this.buildFunction(sourceCode.path)
    stageRun.logs.push('函数构建完成')
    
    // 4. 创建部署包
    const deploymentPackage = await this.createDeploymentPackage(buildResult)
    stageRun.logs.push('部署包创建完成')
    
    return {
      sourceCode,
      buildResult,
      deploymentPackage
    }
  }
  
  async checkoutCode(repository) {
    // 模拟代码检出
    return {
      path: '/tmp/source',
      commit: repository.commit,
      branch: repository.branch
    }
  }
  
  async installDependencies(sourcePath) {
    // 执行 npm install 或类似命令
    const { exec } = require('child_process')
    
    return new Promise((resolve, reject) => {
      exec('npm ci', { cwd: sourcePath }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`依赖安装失败: ${stderr}`))
        } else {
          resolve(stdout)
        }
      })
    })
  }
  
  async buildFunction(sourcePath) {
    // 执行构建命令
    const { exec } = require('child_process')
    
    return new Promise((resolve, reject) => {
      exec('npm run build', { cwd: sourcePath }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`构建失败: ${stderr}`))
        } else {
          resolve({
            output: stdout,
            buildPath: `${sourcePath}/dist`
          })
        }
      })
    })
  }
  
  async createDeploymentPackage(buildResult) {
    const fs = require('fs')
    const path = require('path')
    
    // 读取构建输出
    const functionCode = fs.readFileSync(
      path.join(buildResult.buildPath, 'index.js'),
      'utf8'
    )
    
    return {
      code: functionCode,
      size: Buffer.byteLength(functionCode, 'utf8'),
      checksum: require('crypto')
        .createHash('sha256')
        .update(functionCode)
        .digest('hex')
    }
  }
}

// 测试阶段
class TestStage {
  constructor() {
    this.name = 'test'
  }
  
  async execute(pipelineRun, stageRun) {
    stageRun.logs.push('开始测试阶段...')
    
    const buildResult = pipelineRun.stages
      .find(s => s.name === 'build')?.result
    
    if (!buildResult) {
      throw new Error('构建结果不存在')
    }
    
    // 1. 单元测试
    const unitTestResult = await this.runUnitTests(buildResult.sourceCode.path)
    stageRun.logs.push(`单元测试完成: ${unitTestResult.passed}/${unitTestResult.total} 通过`)
    
    // 2. 集成测试
    const integrationTestResult = await this.runIntegrationTests(buildResult.deploymentPackage)
    stageRun.logs.push(`集成测试完成: ${integrationTestResult.passed}/${integrationTestResult.total} 通过`)
    
    // 3. 安全扫描
    const securityScanResult = await this.runSecurityScan(buildResult.deploymentPackage)
    stageRun.logs.push(`安全扫描完成: ${securityScanResult.issues} 个问题`)
    
    const totalTests = unitTestResult.total + integrationTestResult.total
    const totalPassed = unitTestResult.passed + integrationTestResult.passed
    
    if (totalPassed < totalTests) {
      throw new Error(`测试失败: ${totalPassed}/${totalTests} 通过`)
    }
    
    if (securityScanResult.criticalIssues > 0) {
      throw new Error(`发现 ${securityScanResult.criticalIssues} 个严重安全问题`)
    }
    
    return {
      unitTests: unitTestResult,
      integrationTests: integrationTestResult,
      securityScan: securityScanResult
    }
  }
  
  async runUnitTests(sourcePath) {
    // 执行单元测试
    const { exec } = require('child_process')
    
    return new Promise((resolve, reject) => {
      exec('npm test', { cwd: sourcePath }, (error, stdout, stderr) => {
        // 解析测试结果
        const total = 10 // 模拟
        const passed = error ? 8 : 10
        
        resolve({ total, passed, output: stdout })
      })
    })
  }
  
  async runIntegrationTests(deploymentPackage) {
    // 执行集成测试
    return {
      total: 5,
      passed: 5,
      output: '所有集成测试通过'
    }
  }
  
  async runSecurityScan(deploymentPackage) {
    // 执行安全扫描
    return {
      issues: 0,
      criticalIssues: 0,
      warnings: 2,
      report: '无严重安全问题'
    }
  }
}
```

## 📚 最佳实践总结

1. **多平台策略**：选择合适的平台组合以获得最佳覆盖和性能
2. **自动化部署**：使用 CI/CD 管道确保部署的一致性和可靠性
3. **渐进式发布**：使用蓝绿部署或金丝雀发布降低风险
4. **监控告警**：全面监控边缘函数的性能和健康状况
5. **回滚策略**：准备快速回滚机制应对部署问题
6. **成本优化**：监控和优化边缘函数的执行成本
7. **安全防护**：实施完整的安全扫描和访问控制
8. **性能测试**：在部署前进行充分的性能和负载测试

通过掌握这些边缘函数部署技术，您将能够构建高可用、高性能的全球分布式应用系统。
