# Jenkins流水线

## 📋 概述

Jenkins是一个开源的自动化服务器，提供了强大的流水线功能来实现持续集成和持续部署。Jenkins Pipeline允许您将整个构建流程定义为代码。

## 🎯 学习目标

- 掌握Jenkins Pipeline的核心概念
- 学会编写声明式和脚本式流水线
- 了解Jenkins插件生态系统
- 实现复杂的CI/CD流水线

## 📚 核心概念

### Pipeline即代码

Jenkins Pipeline支持将构建流程定义为代码，存储在版本控制系统中。

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'npm run deploy'
            }
        }
    }
}
```

### 流水线类型

#### 1. 声明式流水线（推荐）

```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    
    environment {
        NODE_ENV = 'production'
        API_KEY = credentials('api-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'eslint.html',
                        reportName: 'ESLint Report'
                    ])
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/unit/*.xml'
                        }
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/integration/*.xml'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def deploymentResult = sh(
                        script: 'npm run deploy:production',
                        returnStatus: true
                    )
                    if (deploymentResult != 0) {
                        error("Deployment failed")
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Build ${env.BUILD_NUMBER} succeeded for ${env.JOB_NAME}"
            )
        }
        failure {
            slackSend(
                channel: '#alerts',
                color: 'danger',
                message: "❌ Build ${env.BUILD_NUMBER} failed for ${env.JOB_NAME}"
            )
        }
    }
}
```

#### 2. 脚本式流水线

```groovy
node {
    def nodeImage = docker.image('node:18-alpine')
    
    try {
        stage('Checkout') {
            checkout scm
        }
        
        nodeImage.inside {
            stage('Install Dependencies') {
                sh 'npm ci'
            }
            
            stage('Test') {
                sh 'npm test'
                publishTestResults testResultsPattern: 'test-results/*.xml'
            }
            
            stage('Build') {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**/*'
            }
        }
        
        stage('Deploy') {
            if (env.BRANCH_NAME == 'main') {
                sh 'npm run deploy:production'
            }
        }
        
    } catch (Exception e) {
        currentBuild.result = 'FAILURE'
        throw e
    } finally {
        cleanWs()
    }
}
```

## 🛠 实用流水线示例

### Node.js应用完整流水线

```groovy
// Jenkinsfile
pipeline {
    agent none
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        skipStagesAfterUnstable()
    }
    
    environment {
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = "${DOCKER_REGISTRY}/your-app"
        KUBECONFIG = credentials('kubeconfig')
    }
    
    stages {
        stage('Preparation') {
            agent any
            steps {
                script {
                    // 设置构建信息
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_VERSION = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    
                    // 通知开始构建
                    slackSend(
                        channel: '#builds',
                        color: '#36a64f',
                        message: "🚀 Starting build ${env.BUILD_VERSION} for ${env.JOB_NAME}"
                    )
                }
            }
        }
        
        stage('Code Quality') {
            agent {
                docker {
                    image "node:${NODE_VERSION}-alpine"
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            
            steps {
                sh 'npm ci'
                
                parallel(
                    'Lint': {
                        sh 'npm run lint -- --format=checkstyle --output-file=reports/eslint.xml'
                        publishCheckStyleResults pattern: 'reports/eslint.xml'
                    },
                    'Security Scan': {
                        sh 'npm audit --audit-level high'
                        sh 'npx snyk test --json > reports/snyk.json || true'
                        archiveArtifacts artifacts: 'reports/snyk.json'
                    },
                    'Type Check': {
                        sh 'npm run type-check'
                    }
                )
            }
        }
        
        stage('Test') {
            agent {
                docker {
                    image "node:${NODE_VERSION}-alpine"
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            
            steps {
                sh 'npm ci'
                
                parallel(
                    'Unit Tests': {
                        sh 'npm run test:unit -- --coverage --reporters=default --reporters=jest-junit'
                        publishTestResults testResultsPattern: 'junit.xml'
                        publishCoverageGoblinResults(
                            coberturaReportFile: 'coverage/cobertura-coverage.xml'
                        )
                    },
                    'Integration Tests': {
                        sh 'npm run test:integration'
                    },
                    'E2E Tests': {
                        script {
                            try {
                                sh 'npm run test:e2e'
                            } catch (Exception e) {
                                unstable('E2E tests failed')
                            }
                        }
                    }
                )
            }
            
            post {
                always {
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('Build') {
            agent any
            
            steps {
                script {
                    // 构建应用
                    def nodeContainer = docker.image("node:${NODE_VERSION}-alpine")
                    nodeContainer.inside {
                        sh 'npm ci --only=production'
                        sh 'npm run build'
                    }
                    
                    // 构建Docker镜像
                    def customImage = docker.build("${IMAGE_NAME}:${BUILD_VERSION}")
                    
                    // 推送到镜像仓库
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        customImage.push()
                        customImage.push('latest')
                    }
                    
                    // 清理本地镜像
                    sh "docker rmi ${IMAGE_NAME}:${BUILD_VERSION} ${IMAGE_NAME}:latest || true"
                }
            }
        }
        
        stage('Security Scan') {
            agent any
            
            steps {
                script {
                    // 扫描Docker镜像安全漏洞
                    sh """
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                        -v \$HOME/Library/Caches:/root/.cache/ \\
                        aquasec/trivy image ${IMAGE_NAME}:${BUILD_VERSION}
                    """
                }
            }
        }
        
        stage('Deploy to Staging') {
            agent any
            
            when {
                branch 'develop'
            }
            
            environment {
                ENVIRONMENT = 'staging'
                NAMESPACE = 'staging'
            }
            
            steps {
                script {
                    // 更新Kubernetes部署
                    sh """
                        kubectl set image deployment/your-app \\
                        your-app=${IMAGE_NAME}:${BUILD_VERSION} \\
                        --namespace=${NAMESPACE}
                    """
                    
                    // 等待部署完成
                    sh """
                        kubectl rollout status deployment/your-app \\
                        --namespace=${NAMESPACE} \\
                        --timeout=300s
                    """
                    
                    // 健康检查
                    sh 'npm run health-check:staging'
                }
            }
        }
        
        stage('Deploy to Production') {
            agent any
            
            when {
                branch 'main'
            }
            
            environment {
                ENVIRONMENT = 'production'
                NAMESPACE = 'production'
            }
            
            steps {
                script {
                    // 需要手动确认
                    timeout(time: 10, unit: 'MINUTES') {
                        input message: 'Deploy to Production?', 
                              ok: 'Deploy',
                              submitter: 'admin,devops'
                    }
                    
                    // 蓝绿部署
                    sh """
                        kubectl set image deployment/your-app \\
                        your-app=${IMAGE_NAME}:${BUILD_VERSION} \\
                        --namespace=${NAMESPACE}
                    """
                    
                    sh """
                        kubectl rollout status deployment/your-app \\
                        --namespace=${NAMESPACE} \\
                        --timeout=600s
                    """
                    
                    // 生产环境健康检查
                    sh 'npm run health-check:production'
                    
                    // 创建Git标签
                    sh """
                        git tag -a v${BUILD_VERSION} -m "Release version ${BUILD_VERSION}"
                        git push origin v${BUILD_VERSION}
                    """
                }
            }
        }
    }
    
    post {
        always {
            node('any') {
                // 清理工作空间
                cleanWs()
                
                // 发送构建报告
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'index.html',
                    reportName: 'Build Report'
                ])
            }
        }
        
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Build ${env.BUILD_VERSION} completed successfully!"
            )
        }
        
        failure {
            slackSend(
                channel: '#alerts',
                color: 'danger',
                message: "❌ Build ${env.BUILD_VERSION} failed! Check: ${env.BUILD_URL}"
            )
            
            // 发送邮件通知
            emailext(
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}, devops@company.com"
            )
        }
        
        unstable {
            slackSend(
                channel: '#alerts',
                color: 'warning',
                message: "⚠️ Build ${env.BUILD_VERSION} is unstable"
            )
        }
    }
}
```

### 多分支流水线配置

```groovy
// Jenkinsfile for multi-branch pipeline
pipeline {
    agent none
    
    stages {
        stage('Branch Strategy') {
            parallel {
                stage('Feature Branch') {
                    when {
                        not { anyOf { branch 'main'; branch 'develop' } }
                    }
                    agent { docker { image 'node:18-alpine' } }
                    steps {
                        sh 'npm ci'
                        sh 'npm run lint'
                        sh 'npm run test:unit'
                        sh 'npm run build'
                    }
                }
                
                stage('Develop Branch') {
                    when { branch 'develop' }
                    agent { docker { image 'node:18-alpine' } }
                    steps {
                        sh 'npm ci'
                        sh 'npm run lint'
                        sh 'npm run test'
                        sh 'npm run build'
                        sh 'npm run deploy:staging'
                    }
                }
                
                stage('Main Branch') {
                    when { branch 'main' }
                    agent { docker { image 'node:18-alpine' } }
                    steps {
                        sh 'npm ci'
                        sh 'npm run lint'
                        sh 'npm run test'
                        sh 'npm run build'
                        
                        script {
                            if (env.CHANGE_ID == null) {  // 不是PR
                                sh 'npm run deploy:production'
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## 🔧 Jenkins配置和插件

### 必备插件

```groovy
// 常用插件列表
plugins {
    // 流水线相关
    'workflow-aggregator'           // Pipeline插件套件
    'pipeline-stage-view'           // 流水线视图
    'blue-ocean'                    // Blue Ocean界面
    
    // 源代码管理
    'git'                          // Git插件
    'github'                       // GitHub集成
    'bitbucket'                    // Bitbucket集成
    
    // 构建工具
    'nodejs'                       // Node.js插件
    'docker-workflow'              // Docker流水线
    'kubernetes'                   // Kubernetes插件
    
    // 测试和质量
    'junit'                        // JUnit测试结果
    'jacoco'                       // 代码覆盖率
    'checkstyle'                   // 代码风格检查
    'sonar'                        // SonarQube集成
    
    // 通知和报告
    'slack'                        // Slack通知
    'email-ext'                    // 邮件扩展
    'htmlpublisher'                // HTML报告发布
    
    // 安全和凭据
    'credentials'                  // 凭据管理
    'role-strategy'                // 角色策略
}
```

### 全局工具配置

```groovy
// Jenkins全局工具配置
globalTools {
    nodejs {
        installations {
            nodejs18 {
                name = "Node.js 18"
                version = "18.17.0"
            }
            nodejs20 {
                name = "Node.js 20"
                version = "20.5.0"
            }
        }
    }
    
    docker {
        installations {
            docker {
                name = "Docker"
                version = "latest"
            }
        }
    }
    
    kubectl {
        installations {
            kubectl {
                name = "kubectl"
                version = "1.27.0"
            }
        }
    }
}
```

## 📊 监控和优化

### 流水线性能监控

```groovy
pipeline {
    agent any
    
    stages {
        stage('Performance Monitoring') {
            steps {
                script {
                    // 记录阶段开始时间
                    def startTime = System.currentTimeMillis()
                    
                    // 执行构建任务
                    sh 'npm run build'
                    
                    // 计算执行时间
                    def duration = System.currentTimeMillis() - startTime
                    
                    // 记录性能指标
                    writeFile file: 'performance.json', text: """
                    {
                        "stage": "build",
                        "duration": ${duration},
                        "timestamp": "${new Date()}",
                        "build_number": "${env.BUILD_NUMBER}"
                    }
                    """
                    
                    archiveArtifacts artifacts: 'performance.json'
                }
            }
        }
    }
}
```

### 资源使用优化

```groovy
pipeline {
    agent {
        kubernetes {
            yaml """
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                  - name: node
                    image: node:18-alpine
                    resources:
                      requests:
                        memory: "512Mi"
                        cpu: "500m"
                      limits:
                        memory: "1Gi"
                        cpu: "1000m"
                    command:
                    - cat
                    tty: true
            """
        }
    }
    
    stages {
        stage('Build with Resource Limits') {
            steps {
                container('node') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }
    }
}
```

## 🔍 调试和故障排除

### 调试技巧

```groovy
pipeline {
    agent any
    
    stages {
        stage('Debug Information') {
            steps {
                script {
                    // 输出环境信息
                    sh 'env | sort'
                    
                    // 输出系统信息
                    sh 'uname -a'
                    sh 'df -h'
                    sh 'free -m'
                    
                    // 输出Jenkins变量
                    echo "Job Name: ${env.JOB_NAME}"
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Workspace: ${env.WORKSPACE}"
                    echo "Git Commit: ${env.GIT_COMMIT}"
                }
            }
        }
        
        stage('Conditional Debug') {
            when {
                environment name: 'DEBUG', value: 'true'
            }
            steps {
                sh 'set -x'  // 启用shell调试模式
                sh 'npm run debug'
            }
        }
    }
}
```

### 错误处理

```groovy
pipeline {
    agent any
    
    stages {
        stage('Error Handling') {
            steps {
                script {
                    try {
                        sh 'npm run risky-command'
                    } catch (Exception e) {
                        echo "Command failed: ${e.getMessage()}"
                        
                        // 收集错误信息
                        sh 'npm run collect-logs'
                        archiveArtifacts artifacts: 'logs/**/*'
                        
                        // 标记构建为不稳定而不是失败
                        unstable('Risky command failed')
                    }
                }
            }
        }
    }
}
```

## 🚀 最佳实践

### 1. 流水线结构

```groovy
// 推荐的流水线结构
pipeline {
    agent none
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        skipStagesAfterUnstable()
        parallelsAlwaysFailFast()
    }
    
    stages {
        stage('Prepare') { /* ... */ }
        stage('Quality Gates') {
            parallel {
                stage('Lint') { /* ... */ }
                stage('Security') { /* ... */ }
                stage('Type Check') { /* ... */ }
            }
        }
        stage('Test') {
            parallel {
                stage('Unit') { /* ... */ }
                stage('Integration') { /* ... */ }
                stage('E2E') { /* ... */ }
            }
        }
        stage('Build') { /* ... */ }
        stage('Deploy') { /* ... */ }
    }
}
```

### 2. 凭据管理

```groovy
// 安全的凭据使用
environment {
    DATABASE_URL = credentials('database-url')
    API_KEY = credentials('api-key')
    DOCKER_REGISTRY = credentials('docker-registry')
}

steps {
    withCredentials([
        usernamePassword(
            credentialsId: 'docker-registry',
            usernameVariable: 'REGISTRY_USER',
            passwordVariable: 'REGISTRY_PASS'
        )
    ]) {
        sh 'docker login -u $REGISTRY_USER -p $REGISTRY_PASS'
    }
}
```

### 3. 缓存策略

```groovy
// 依赖缓存
pipeline {
    agent any
    
    stages {
        stage('Cache Dependencies') {
            steps {
                script {
                    def cacheKey = sh(
                        script: 'sha256sum package-lock.json | cut -d" " -f1',
                        returnStdout: true
                    ).trim()
                    
                    if (fileExists("cache/node_modules_${cacheKey}.tar.gz")) {
                        sh "tar -xzf cache/node_modules_${cacheKey}.tar.gz"
                    } else {
                        sh 'npm ci'
                        sh "mkdir -p cache && tar -czf cache/node_modules_${cacheKey}.tar.gz node_modules/"
                    }
                }
            }
        }
    }
}
```

## 📝 总结

Jenkins Pipeline提供了强大的CI/CD能力，通过：

- 灵活的声明式和脚本式语法
- 丰富的插件生态系统
- 强大的并行处理能力
- 完善的错误处理机制

能够构建复杂而可靠的自动化流水线，是企业级CI/CD的重要选择。

## 🔗 相关资源

- [Jenkins官方文档](https://www.jenkins.io/doc/)
- [Pipeline语法参考](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins插件索引](https://plugins.jenkins.io/)
- [Blue Ocean用户指南](https://www.jenkins.io/doc/book/blueocean/)
