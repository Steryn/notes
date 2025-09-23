# AWS Lambda@Edge

## 📖 概述

AWS Lambda@Edge 是 Amazon CloudFront 的扩展功能，允许您在全球边缘位置运行代码，以响应 CloudFront 事件。它能在更接近用户的位置执行计算，从而减少延迟并改善用户体验。

## 🎯 学习目标

- 掌握 Lambda@Edge 的核心概念和触发器
- 学习边缘函数的开发和部署
- 了解性能优化和限制约束
- 掌握实际应用场景和最佳实践

## 🏗️ Lambda@Edge 架构

### 1. 触发器类型

```javascript
// Viewer Request - 查看器请求
exports.viewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request
  const headers = request.headers
  
  console.log('Viewer Request 触发:', {
    uri: request.uri,
    method: request.method,
    clientIP: headers['cloudfront-viewer-address']?.[0]?.value
  })
  
  // A/B 测试路由
  if (request.uri.startsWith('/app')) {
    const testGroup = determineTestGroup(headers)
    
    if (testGroup === 'beta') {
      request.uri = '/beta' + request.uri
    }
    
    // 添加测试组头部
    request.headers['x-test-group'] = [{ key: 'X-Test-Group', value: testGroup }]
  }
  
  // 移动设备重定向
  const userAgent = headers['user-agent']?.[0]?.value || ''
  if (isMobileDevice(userAgent) && !request.uri.startsWith('/m/')) {
    const response = {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: `https://m.example.com${request.uri}`
        }]
      }
    }
    
    callback(null, response)
    return
  }
  
  // 认证检查
  const authResult = checkAuthentication(headers)
  if (!authResult.authenticated && requiresAuth(request.uri)) {
    const response = {
      status: '401',
      statusDescription: 'Unauthorized',
      body: JSON.stringify({
        error: 'Authentication required',
        loginUrl: 'https://auth.example.com/login'
      }),
      headers: {
        'content-type': [{ key: 'Content-Type', value: 'application/json' }],
        'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Bearer' }]
      }
    }
    
    callback(null, response)
    return
  }
  
  callback(null, request)
}

// Origin Request - 源请求
exports.originRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request
  
  console.log('Origin Request 触发:', {
    uri: request.uri,
    origin: request.origin
  })
  
  // 动态源选择
  if (request.uri.startsWith('/api/')) {
    // API 请求路由到 API Gateway
    request.origin = {
      custom: {
        domainName: 'api.example.com',
        port: 443,
        protocol: 'https',
        path: '/prod'
      }
    }
    
    // 移除路径前缀
    request.uri = request.uri.replace('/api', '')
    
  } else if (request.uri.startsWith('/static/')) {
    // 静态资源路由到 S3
    request.origin = {
      s3: {
        domainName: 'static-assets.s3.amazonaws.com',
        region: 'us-east-1',
        authMethod: 'origin-access-identity',
        oai: 'origin-access-identity/cloudfront/ABCDEFG1234567'
      }
    }
  }
  
  // 添加自定义头部
  request.headers['x-forwarded-host'] = [{ 
    key: 'X-Forwarded-Host', 
    value: request.headers.host[0].value 
  }]
  
  request.headers['x-edge-location'] = [{ 
    key: 'X-Edge-Location', 
    value: process.env.AWS_REGION || 'unknown' 
  }]
  
  callback(null, request)
}

// Origin Response - 源响应
exports.originResponse = (event, context, callback) => {
  const request = event.Records[0].cf.request
  const response = event.Records[0].cf.response
  
  console.log('Origin Response 触发:', {
    status: response.status,
    uri: request.uri
  })
  
  // 错误页面处理
  if (response.status === '404') {
    if (request.uri.startsWith('/app/')) {
      // SPA 路由处理 - 返回 index.html
      response.status = '200'
      response.statusDescription = 'OK'
      response.body = generateSPAIndex(request.uri)
      response.headers['content-type'] = [{ 
        key: 'Content-Type', 
        value: 'text/html' 
      }]
    } else {
      // 自定义 404 页面
      response.body = generate404Page()
      response.headers['content-type'] = [{ 
        key: 'Content-Type', 
        value: 'text/html' 
      }]
    }
  }
  
  // 安全头部注入
  response.headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }]
  
  response.headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }]
  
  response.headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }]
  
  // 缓存控制
  if (request.uri.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    response.headers['cache-control'] = [{
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable'
    }]
  }
  
  callback(null, response)
}

// Viewer Response - 查看器响应
exports.viewerResponse = (event, context, callback) => {
  const request = event.Records[0].cf.request
  const response = event.Records[0].cf.response
  
  console.log('Viewer Response 触发:', {
    status: response.status,
    uri: request.uri
  })
  
  // 响应修改
  if (response.headers['content-type']?.[0]?.value?.includes('text/html')) {
    // HTML 内容注入
    if (response.body) {
      response.body = injectAnalytics(response.body, request.headers)
    }
  }
  
  // 性能头部
  response.headers['server-timing'] = [{
    key: 'Server-Timing',
    value: `edge;dur=${Date.now() - context.startTime || 0}`
  }]
  
  // CORS 头部
  const origin = request.headers.origin?.[0]?.value
  if (isAllowedOrigin(origin)) {
    response.headers['access-control-allow-origin'] = [{
      key: 'Access-Control-Allow-Origin',
      value: origin
    }]
  }
  
  callback(null, response)
}

// 工具函数
function determineTestGroup(headers) {
  const userAgent = headers['user-agent']?.[0]?.value || ''
  const cookieHeader = headers.cookie?.[0]?.value || ''
  
  // 检查现有测试组 Cookie
  const testGroupMatch = cookieHeader.match(/testGroup=([^;]+)/)
  if (testGroupMatch) {
    return testGroupMatch[1]
  }
  
  // 基于用户代理哈希分组
  const hash = simpleHash(userAgent)
  return hash % 2 === 0 ? 'control' : 'beta'
}

function isMobileDevice(userAgent) {
  const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i
  return mobileRegex.test(userAgent)
}

function checkAuthentication(headers) {
  const authHeader = headers.authorization?.[0]?.value
  const cookieHeader = headers.cookie?.[0]?.value || ''
  
  // JWT Token 验证
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return validateJWTToken(token)
  }
  
  // Session Cookie 验证
  const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/)
  if (sessionMatch) {
    return validateSession(sessionMatch[1])
  }
  
  return { authenticated: false }
}

function requiresAuth(uri) {
  const protectedPaths = ['/dashboard', '/profile', '/admin']
  return protectedPaths.some(path => uri.startsWith(path))
}

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为 32 位整数
  }
  return Math.abs(hash)
}
```

### 2. 边缘认证系统

```javascript
// 边缘认证管理器
class EdgeAuthManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET
    this.sessionStore = new EdgeSessionStore()
  }
  
  // JWT 验证
  validateJWTToken(token) {
    try {
      // 简化的 JWT 验证（实际应用中需要完整实现）
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      const payload = JSON.parse(atob(parts[1]))
      
      // 检查过期时间
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired')
      }
      
      // 验证签名（简化版本）
      const expectedSignature = this.createSignature(parts[0] + '.' + parts[1])
      if (parts[2] !== expectedSignature) {
        throw new Error('Invalid signature')
      }
      
      return {
        authenticated: true,
        user: {
          id: payload.sub,
          email: payload.email,
          roles: payload.roles || []
        }
      }
    } catch (error) {
      console.error('JWT 验证失败:', error)
      return { authenticated: false, error: error.message }
    }
  }
  
  // Session 验证
  async validateSession(sessionId) {
    try {
      const session = await this.sessionStore.get(sessionId)
      
      if (!session) {
        return { authenticated: false, error: 'Session not found' }
      }
      
      if (session.expiresAt < Date.now()) {
        await this.sessionStore.delete(sessionId)
        return { authenticated: false, error: 'Session expired' }
      }
      
      return {
        authenticated: true,
        user: session.user,
        session: {
          id: sessionId,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt
        }
      }
    } catch (error) {
      console.error('Session 验证失败:', error)
      return { authenticated: false, error: error.message }
    }
  }
  
  // 创建认证响应
  createAuthResponse(redirectUrl = '/login') {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: redirectUrl
        }],
        'set-cookie': [{
          key: 'Set-Cookie',
          value: `redirectUrl=${encodeURIComponent(redirectUrl)}; Path=/; Secure; HttpOnly`
        }]
      }
    }
  }
  
  // 权限检查
  checkPermissions(user, requiredPermissions) {
    if (!user || !user.roles) {
      return false
    }
    
    const userPermissions = this.getRolePermissions(user.roles)
    
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  }
  
  getRolePermissions(roles) {
    const rolePermissions = {
      'admin': ['read', 'write', 'delete', 'admin'],
      'editor': ['read', 'write'],
      'viewer': ['read']
    }
    
    const permissions = new Set()
    
    roles.forEach(role => {
      const perms = rolePermissions[role] || []
      perms.forEach(perm => permissions.add(perm))
    })
    
    return Array.from(permissions)
  }
  
  createSignature(data) {
    // 简化的签名创建（实际应用中应使用 crypto 库）
    return btoa(data + this.jwtSecret).substring(0, 20)
  }
}

// 边缘会话存储
class EdgeSessionStore {
  constructor() {
    // 由于 Lambda@Edge 的限制，这里使用内存存储
    // 实际应用中应该使用外部存储如 DynamoDB
    this.sessions = new Map()
  }
  
  async get(sessionId) {
    return this.sessions.get(sessionId) || null
  }
  
  async set(sessionId, sessionData, ttl = 3600) {
    const session = {
      ...sessionData,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    }
    
    this.sessions.set(sessionId, session)
    
    // 设置清理定时器
    setTimeout(() => {
      this.sessions.delete(sessionId)
    }, ttl * 1000)
    
    return session
  }
  
  async delete(sessionId) {
    return this.sessions.delete(sessionId)
  }
  
  async cleanup() {
    const now = Date.now()
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId)
      }
    }
  }
}
```

### 3. 动态内容生成

```javascript
// 动态内容生成器
class EdgeContentGenerator {
  constructor() {
    this.templates = new Map()
    this.cache = new Map()
  }
  
  // 生成个性化页面
  generatePersonalizedPage(request, userContext) {
    const uri = request.uri
    const userAgent = request.headers['user-agent']?.[0]?.value || ''
    const acceptLanguage = request.headers['accept-language']?.[0]?.value || 'en-US'
    
    // 检测设备类型
    const deviceType = this.detectDeviceType(userAgent)
    
    // 检测语言偏好
    const preferredLanguage = this.detectLanguage(acceptLanguage)
    
    // 生成页面内容
    const pageContent = this.buildPageContent({
      uri,
      deviceType,
      language: preferredLanguage,
      user: userContext?.user,
      timestamp: new Date().toISOString()
    })
    
    return {
      status: '200',
      statusDescription: 'OK',
      body: pageContent,
      headers: {
        'content-type': [{
          key: 'Content-Type',
          value: 'text/html; charset=utf-8'
        }],
        'cache-control': [{
          key: 'Cache-Control',
          value: 'private, no-cache, no-store, must-revalidate'
        }],
        'vary': [{
          key: 'Vary',
          value: 'User-Agent, Accept-Language, Authorization'
        }]
      }
    }
  }
  
  // 构建页面内容
  buildPageContent(context) {
    const { uri, deviceType, language, user } = context
    
    let template = this.getTemplate(uri, deviceType)
    
    // 个性化替换
    template = template.replace(/\{\{user\.name\}\}/g, user?.name || 'Guest')
    template = template.replace(/\{\{user\.email\}\}/g, user?.email || '')
    template = template.replace(/\{\{device\.type\}\}/g, deviceType)
    template = template.replace(/\{\{page\.language\}\}/g, language)
    
    // 注入动态内容
    template = this.injectDynamicContent(template, context)
    
    // 注入分析代码
    template = this.injectAnalytics(template, context)
    
    return template
  }
  
  getTemplate(uri, deviceType) {
    const templateKey = `${uri}-${deviceType}`
    
    if (this.templates.has(templateKey)) {
      return this.templates.get(templateKey)
    }
    
    // 基础模板
    let template = `
<!DOCTYPE html>
<html lang="{{page.language}}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{page.title}}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            ${deviceType === 'mobile' ? 'font-size: 16px;' : 'font-size: 14px;'}
        }
        .container { 
            max-width: ${deviceType === 'mobile' ? '100%' : '1200px'}; 
            margin: 0 auto; 
        }
        .user-info { 
            background: #f0f0f0; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="user-info">
            <h2>Welcome, {{user.name}}!</h2>
            <p>Device: {{device.type}}</p>
            <p>Language: {{page.language}}</p>
        </div>
        <main>
            {{dynamic.content}}
        </main>
    </div>
    {{analytics.code}}
</body>
</html>`
    
    this.templates.set(templateKey, template)
    return template
  }
  
  injectDynamicContent(template, context) {
    // 根据 URI 生成不同的动态内容
    let dynamicContent = '<h1>Welcome to Our Site</h1>'
    
    if (context.uri.startsWith('/dashboard')) {
      dynamicContent = this.generateDashboardContent(context.user)
    } else if (context.uri.startsWith('/products')) {
      dynamicContent = this.generateProductContent(context)
    } else if (context.uri.startsWith('/news')) {
      dynamicContent = this.generateNewsContent(context)
    }
    
    return template.replace('{{dynamic.content}}', dynamicContent)
  }
  
  generateDashboardContent(user) {
    if (!user) {
      return '<p>Please log in to view your dashboard.</p>'
    }
    
    return `
      <h1>Dashboard</h1>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Profile</h3>
          <p>Email: ${user.email}</p>
          <p>Roles: ${user.roles?.join(', ') || 'None'}</p>
        </div>
        <div class="stat-card">
          <h3>Activity</h3>
          <p>Last login: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `
  }
  
  generateProductContent(context) {
    const products = [
      { id: 1, name: 'Product A', price: '$99' },
      { id: 2, name: 'Product B', price: '$149' },
      { id: 3, name: 'Product C', price: '$199' }
    ]
    
    const productCards = products.map(product => `
      <div class="product-card">
        <h3>${product.name}</h3>
        <p>Price: ${product.price}</p>
        <button onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
    `).join('')
    
    return `
      <h1>Our Products</h1>
      <div class="products-grid">
        ${productCards}
      </div>
      <script>
        function addToCart(productId) {
          console.log('Added product', productId, 'to cart');
          // 这里可以调用 API 或触发其他事件
        }
      </script>
    `
  }
  
  injectAnalytics(template, context) {
    const analyticsCode = `
    <script>
      // 简化的分析代码
      (function() {
        const analytics = {
          track: function(event, properties) {
            console.log('Analytics:', event, properties);
            // 发送到分析服务
          }
        };
        
        // 页面加载事件
        analytics.track('page_view', {
          url: '${context.uri}',
          device: '${context.deviceType}',
          language: '${context.language}',
          user_id: '${context.user?.id || 'anonymous'}',
          timestamp: '${context.timestamp}'
        });
        
        window.analytics = analytics;
      })();
    </script>`
    
    return template.replace('{{analytics.code}}', analyticsCode)
  }
  
  detectDeviceType(userAgent) {
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)) {
      return 'mobile'
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }
  
  detectLanguage(acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const parts = lang.trim().split(';')
      const code = parts[0]
      const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0
      return { code, quality }
    })
    
    // 按质量排序
    languages.sort((a, b) => b.quality - a.quality)
    
    // 支持的语言
    const supportedLanguages = ['en-US', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE']
    
    for (const lang of languages) {
      if (supportedLanguages.includes(lang.code)) {
        return lang.code
      }
      
      // 检查语言代码前缀
      const prefix = lang.code.split('-')[0]
      const match = supportedLanguages.find(supported => 
        supported.startsWith(prefix)
      )
      
      if (match) {
        return match
      }
    }
    
    return 'en-US' // 默认语言
  }
}
```

### 4. 部署配置

```javascript
// serverless.yml 配置
const serverlessConfig = `
service: lambda-edge-functions

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1  # Lambda@Edge 必须部署在 us-east-1
  stage: \${opt:stage, 'dev'}

functions:
  viewerRequest:
    handler: src/viewer-request.handler
    timeout: 5  # Lambda@Edge 最大 5 秒
    memorySize: 128  # 最大 512MB
    
  originRequest:
    handler: src/origin-request.handler
    timeout: 30  # Origin 请求最大 30 秒
    memorySize: 512
    
  originResponse:
    handler: src/origin-response.handler
    timeout: 30
    memorySize: 256
    
  viewerResponse:
    handler: src/viewer-response.handler
    timeout: 5
    memorySize: 128

resources:
  Resources:
    # CloudFront Distribution
    CloudFrontDistribution:
      Type: AWS::CloudFront::Distribution
      Properties:
        DistributionConfig:
          Enabled: true
          Comment: Lambda@Edge Example Distribution
          
          DefaultCacheBehavior:
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
            
            LambdaFunctionAssociations:
              - EventType: viewer-request
                LambdaFunctionARN: !GetAtt ViewerRequestLambdaFunction.Arn
              - EventType: origin-request
                LambdaFunctionARN: !GetAtt OriginRequestLambdaFunction.Arn
              - EventType: origin-response
                LambdaFunctionARN: !GetAtt OriginResponseLambdaFunction.Arn
              - EventType: viewer-response
                LambdaFunctionARN: !GetAtt ViewerResponseLambdaFunction.Arn
          
          CacheBehaviors:
            - PathPattern: "/api/*"
              TargetOriginId: APIOrigin
              ViewerProtocolPolicy: https-only
              CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
              
              LambdaFunctionAssociations:
                - EventType: viewer-request
                  LambdaFunctionARN: !GetAtt ViewerRequestLambdaFunction.Arn
                - EventType: origin-request
                  LambdaFunctionARN: !GetAtt OriginRequestLambdaFunction.Arn
          
          Origins:
            - Id: S3Origin
              DomainName: my-static-website.s3.amazonaws.com
              S3OriginConfig:
                OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/\${CloudFrontOriginAccessIdentity}"
            
            - Id: APIOrigin
              DomainName: api.example.com
              CustomOriginConfig:
                HTTPPort: 443
                OriginProtocolPolicy: https-only
          
          DefaultRootObject: index.html
          
          CustomErrorResponses:
            - ErrorCode: 404
              ResponseCode: 404
              ResponsePagePath: /404.html
              ErrorCachingMinTTL: 300
            
            - ErrorCode: 500
              ResponseCode: 500
              ResponsePagePath: /500.html
              ErrorCachingMinTTL: 0

    # Origin Access Identity
    CloudFrontOriginAccessIdentity:
      Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
      Properties:
        CloudFrontOriginAccessIdentityConfig:
          Comment: !Sub "\${AWS::StackName} OAI"

plugins:
  - serverless-plugin-lambda-edge
`

// 部署脚本
const deploymentScript = `
#!/bin/bash

echo "开始部署 Lambda@Edge 函数..."

# 1. 安装依赖
npm install

# 2. 运行测试
npm test

# 3. 构建函数
npm run build

# 4. 部署到 us-east-1
export AWS_REGION=us-east-1
serverless deploy --stage production

# 5. 获取函数 ARN
VIEWER_REQUEST_ARN=$(aws lambda get-function --function-name lambda-edge-functions-production-viewerRequest --query 'Configuration.FunctionArn' --output text)
ORIGIN_REQUEST_ARN=$(aws lambda get-function --function-name lambda-edge-functions-production-originRequest --query 'Configuration.FunctionArn' --output text)

echo "部署完成!"
echo "Viewer Request ARN: $VIEWER_REQUEST_ARN"
echo "Origin Request ARN: $ORIGIN_REQUEST_ARN"

# 6. 更新 CloudFront 分配
echo "更新 CloudFront 分配..."
aws cloudformation update-stack --stack-name lambda-edge-stack --template-body file://cloudformation.yml --parameters ParameterKey=ViewerRequestArn,ParameterValue=$VIEWER_REQUEST_ARN

echo "部署流程完成!"
`
```

## 📚 最佳实践总结

1. **性能优化**：保持函数轻量，避免复杂计算
2. **错误处理**：实现完善的错误处理和回退机制
3. **缓存策略**：合理使用缓存减少函数执行次数
4. **安全考虑**：验证输入，保护敏感数据
5. **监控日志**：使用 CloudWatch 监控函数性能
6. **版本管理**：使用版本控制管理函数更新
7. **测试验证**：充分测试边缘函数行为
8. **成本控制**：监控执行次数和成本

通过掌握这些 AWS Lambda@Edge 技术，您将能够构建高性能的全球分布式边缘应用。
