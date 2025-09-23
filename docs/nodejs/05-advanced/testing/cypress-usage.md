# Cypress使用指南

## 🎯 学习目标

- 掌握Cypress的基本概念和架构
- 学会安装和配置Cypress
- 理解Cypress的测试编写方式
- 掌握Cypress的高级功能和最佳实践
- 学会调试和优化Cypress测试

## 📚 目录

1. [Cypress简介](#cypress简介)
2. [安装与配置](#安装与配置)
3. [基础测试编写](#基础测试编写)
4. [元素定位与操作](#元素定位与操作)
5. [断言与验证](#断言与验证)
6. [页面对象模式](#页面对象模式)
7. [数据驱动测试](#数据驱动测试)
8. [API测试](#api测试)
9. [自定义命令](#自定义命令)
10. [测试配置与环境](#测试配置与环境)
11. [调试技巧](#调试技巧)
12. [最佳实践](#最佳实践)
13. [常见问题解决](#常见问题解决)

## Cypress简介

### 什么是Cypress

Cypress是一个现代化的端到端测试框架，专为现代Web应用设计。它提供了：

- **实时重载**：测试运行时可以看到浏览器中的操作
- **时间旅行**：可以回放测试执行的每一步
- **自动等待**：智能等待元素出现和网络请求完成
- **网络拦截**：可以模拟和拦截网络请求
- **调试友好**：提供丰富的调试工具

### Cypress架构

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Runner   │    │   Cypress App    │    │   Browser       │
│                 │    │                 │    │                 │
│ - 执行测试      │◄──►│ - 管理测试      │◄──►│ - 渲染页面      │
│ - 收集结果      │    │ - 提供API       │    │ - 执行操作      │
│ - 生成报告      │    │ - 处理命令      │    │ - 返回结果      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 与其他测试框架对比

| 特性 | Cypress | Selenium | Playwright |
|------|---------|----------|------------|
| 安装复杂度 | 简单 | 复杂 | 中等 |
| 执行速度 | 快 | 慢 | 快 |
| 调试体验 | 优秀 | 一般 | 良好 |
| 浏览器支持 | Chrome/Firefox/Edge | 全支持 | 全支持 |
| API测试 | 支持 | 不支持 | 支持 |

## 安装与配置

### 安装Cypress

```bash
# 使用npm安装
npm install --save-dev cypress

# 使用yarn安装
yarn add -D cypress

# 使用pnpm安装
pnpm add -D cypress
```

### 初始化项目

```bash
# 打开Cypress测试运行器
npx cypress open

# 或使用命令行运行
npx cypress run
```

### 项目结构

```text
cypress/
├── e2e/                    # 端到端测试文件
│   ├── login.cy.js
│   ├── user-management.cy.js
│   └── api-tests.cy.js
├── fixtures/               # 测试数据
│   ├── users.json
│   └── products.json
├── support/                # 支持文件
│   ├── commands.js         # 自定义命令
│   ├── e2e.js             # 全局配置
│   └── page-objects/      # 页面对象
├── downloads/              # 下载文件存储
├── screenshots/            # 失败测试截图
└── videos/                 # 测试录制视频
```

### 基础配置

```javascript
// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // 插件配置
    },
  },
  env: {
    // 环境变量
    apiUrl: 'http://localhost:3001/api',
    adminEmail: 'admin@example.com',
    adminPassword: 'password123'
  }
})
```

## 基础测试编写

### 测试文件结构

```javascript
// cypress/e2e/login.cy.js
describe('用户登录功能', () => {
  beforeEach(() => {
    // 每个测试前的准备工作
    cy.visit('/login')
  })

  it('应该能够成功登录', () => {
    // 测试步骤
    cy.get('[data-cy=email]').type('user@example.com')
    cy.get('[data-cy=password]').type('password123')
    cy.get('[data-cy=login-button]').click()
    
    // 验证结果
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-menu]').should('contain', 'user@example.com')
  })

  it('应该显示错误信息当密码错误', () => {
    cy.get('[data-cy=email]').type('user@example.com')
    cy.get('[data-cy=password]').type('wrongpassword')
    cy.get('[data-cy=login-button]').click()
    
    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', '密码错误')
  })
})
```

### 测试生命周期钩子

```javascript
describe('测试生命周期', () => {
  before(() => {
    // 整个测试套件执行前运行一次
    cy.log('开始执行测试套件')
  })

  beforeEach(() => {
    // 每个测试用例执行前运行
    cy.visit('/')
  })

  afterEach(() => {
    // 每个测试用例执行后运行
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  after(() => {
    // 整个测试套件执行后运行一次
    cy.log('测试套件执行完成')
  })
})
```

## 元素定位与操作

### 元素选择器

```javascript
describe('元素定位', () => {
  it('使用不同的选择器定位元素', () => {
    cy.visit('/')

    // 1. 使用data-cy属性（推荐）
    cy.get('[data-cy=submit-button]')

    // 2. 使用CSS选择器
    cy.get('.btn-primary')
    cy.get('#login-form')
    cy.get('input[type="email"]')

    // 3. 使用文本内容
    cy.contains('登录')
    cy.contains('button', '提交')

    // 4. 使用XPath（需要插件）
    cy.xpath('//button[@class="btn-primary"]')

    // 5. 使用标签名
    cy.get('form')
    cy.get('input')
  })
})
```

### 元素操作

```javascript
describe('元素操作', () => {
  beforeEach(() => {
    cy.visit('/form')
  })

  it('表单输入操作', () => {
    // 文本输入
    cy.get('[data-cy=name]').type('张三')
    cy.get('[data-cy=email]').type('zhangsan@example.com')

    // 清空输入
    cy.get('[data-cy=name]').clear()
    cy.get('[data-cy=name]').type('李四')

    // 选择下拉框
    cy.get('[data-cy=country]').select('中国')

    // 复选框操作
    cy.get('[data-cy=agree-terms]').check()
    cy.get('[data-cy=newsletter]').uncheck()

    // 单选框操作
    cy.get('[data-cy=gender-male]').check()

    // 文件上传
    cy.get('[data-cy=file-upload]').selectFile('cypress/fixtures/test-file.txt')

    // 鼠标操作
    cy.get('[data-cy=button]').click()
    cy.get('[data-cy=menu-item]').rightclick()
    cy.get('[data-cy=draggable]').drag('[data-cy=dropzone]')

    // 键盘操作
    cy.get('[data-cy=input]').type('{enter}')
    cy.get('[data-cy=input]').type('{ctrl+a}')
    cy.get('[data-cy=input]').type('{backspace}')
  })
})
```

### 等待和重试

```javascript
describe('等待和重试', () => {
  it('智能等待元素', () => {
    cy.visit('/dynamic-content')

    // Cypress会自动等待元素出现
    cy.get('[data-cy=loading]').should('not.exist')
    cy.get('[data-cy=content]').should('be.visible')

    // 等待特定时间
    cy.wait(2000)

    // 等待网络请求
    cy.intercept('GET', '/api/data').as('getData')
    cy.get('[data-cy=load-data]').click()
    cy.wait('@getData')

    // 等待元素状态变化
    cy.get('[data-cy=status]').should('contain', '加载中')
    cy.get('[data-cy=status]').should('contain', '完成')
  })
})
```

## 断言与验证

### 内置断言

```javascript
describe('断言验证', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('元素存在性断言', () => {
    // 元素应该存在
    cy.get('[data-cy=header]').should('exist')
    
    // 元素应该可见
    cy.get('[data-cy=main-content]').should('be.visible')
    
    // 元素应该不存在
    cy.get('[data-cy=hidden-element]').should('not.exist')
    
    // 元素应该不可见
    cy.get('[data-cy=invisible-element]').should('not.be.visible')
  })

  it('文本内容断言', () => {
    cy.get('[data-cy=title]').should('contain', '欢迎')
    cy.get('[data-cy=title]').should('have.text', '欢迎来到我们的网站')
    cy.get('[data-cy=price]').should('match', /\d+\.\d{2}/)
  })

  it('属性断言', () => {
    cy.get('[data-cy=link]').should('have.attr', 'href', '/about')
    cy.get('[data-cy=image]').should('have.attr', 'alt', '产品图片')
    cy.get('[data-cy=button]').should('have.class', 'btn-primary')
  })

  it('表单状态断言', () => {
    cy.get('[data-cy=email-input]').should('be.enabled')
    cy.get('[data-cy=submit-button]').should('be.disabled')
    cy.get('[data-cy=checkbox]').should('be.checked')
  })
})
```

### 自定义断言

```javascript
describe('自定义断言', () => {
  it('使用should回调函数', () => {
    cy.get('[data-cy=price]').should(($price) => {
      const price = parseFloat($price.text())
      expect(price).to.be.greaterThan(0)
      expect(price).to.be.lessThan(1000)
    })
  })

  it('使用then进行复杂验证', () => {
    cy.get('[data-cy=product-list]').then(($list) => {
      const products = $list.find('[data-cy=product-item]')
      expect(products).to.have.length.at.least(1)
      
      products.each((index, product) => {
        const $product = Cypress.$(product)
        expect($product.find('[data-cy=product-name]')).to.exist
        expect($product.find('[data-cy=product-price]')).to.exist
      })
    })
  })
})
```

### URL和页面断言

```javascript
describe('URL和页面断言', () => {
  it('URL验证', () => {
    cy.visit('/login')
    cy.url().should('include', '/login')
    cy.url().should('eq', 'http://localhost:3000/login')
    
    cy.get('[data-cy=login-button]').click()
    cy.url().should('not.include', '/login')
    cy.url().should('include', '/dashboard')
  })

  it('页面标题验证', () => {
    cy.visit('/')
    cy.title().should('eq', '我的网站')
    cy.title().should('contain', '网站')
  })

  it('页面元数据验证', () => {
    cy.visit('/')
    cy.get('meta[name="description"]')
      .should('have.attr', 'content')
      .and('contain', '网站描述')
  })
})
```

## 页面对象模式

### 基础页面对象

```javascript
// cypress/support/page-objects/LoginPage.js
class LoginPage {
  constructor() {
    this.emailInput = '[data-cy=email]'
    this.passwordInput = '[data-cy=password]'
    this.loginButton = '[data-cy=login-button]'
    this.errorMessage = '[data-cy=error-message]'
    this.forgotPasswordLink = '[data-cy=forgot-password]'
  }

  visit() {
    cy.visit('/login')
    return this
  }

  fillEmail(email) {
    cy.get(this.emailInput).type(email)
    return this
  }

  fillPassword(password) {
    cy.get(this.passwordInput).type(password)
    return this
  }

  clickLogin() {
    cy.get(this.loginButton).click()
    return this
  }

  login(email, password) {
    this.fillEmail(email)
    this.fillPassword(password)
    this.clickLogin()
    return this
  }

  getErrorMessage() {
    return cy.get(this.errorMessage)
  }

  clickForgotPassword() {
    cy.get(this.forgotPasswordLink).click()
    return this
  }
}

export default LoginPage
```

### 使用页面对象

```javascript
// cypress/e2e/login-with-page-object.cy.js
import LoginPage from '../support/page-objects/LoginPage'

describe('使用页面对象的登录测试', () => {
  let loginPage

  beforeEach(() => {
    loginPage = new LoginPage()
    loginPage.visit()
  })

  it('应该能够成功登录', () => {
    loginPage
      .fillEmail('user@example.com')
      .fillPassword('password123')
      .clickLogin()

    cy.url().should('include', '/dashboard')
  })

  it('应该显示错误信息', () => {
    loginPage.login('user@example.com', 'wrongpassword')
    
    loginPage.getErrorMessage()
      .should('be.visible')
      .and('contain', '密码错误')
  })
})
```

### 复杂页面对象

```javascript
// cypress/support/page-objects/DashboardPage.js
class DashboardPage {
  constructor() {
    this.userMenu = '[data-cy=user-menu]'
    this.logoutButton = '[data-cy=logout-button]'
    this.sidebar = '[data-cy=sidebar]'
    this.mainContent = '[data-cy=main-content]'
    this.notificationBell = '[data-cy=notification-bell]'
  }

  visit() {
    cy.visit('/dashboard')
    return this
  }

  isLoggedIn() {
    cy.get(this.userMenu).should('be.visible')
    return this
  }

  logout() {
    cy.get(this.userMenu).click()
    cy.get(this.logoutButton).click()
    return this
  }

  navigateTo(section) {
    cy.get(this.sidebar)
      .contains(section)
      .click()
    return this
  }

  getNotificationCount() {
    return cy.get(this.notificationBell)
      .find('[data-cy=notification-count]')
      .invoke('text')
      .then(parseInt)
  }

  waitForContentLoad() {
    cy.get(this.mainContent).should('be.visible')
    cy.get('[data-cy=loading]').should('not.exist')
    return this
  }
}

export default DashboardPage
```

## 数据驱动测试

### 使用Fixtures

```json
// cypress/fixtures/users.json
{
  "validUsers": [
    {
      "email": "admin@example.com",
      "password": "admin123",
      "role": "admin",
      "expectedUrl": "/admin/dashboard"
    },
    {
      "email": "user@example.com",
      "password": "user123",
      "role": "user",
      "expectedUrl": "/user/dashboard"
    }
  ],
  "invalidUsers": [
    {
      "email": "invalid@example.com",
      "password": "wrongpassword",
      "expectedError": "用户名或密码错误"
    },
    {
      "email": "test@example.com",
      "password": "",
      "expectedError": "密码不能为空"
    }
  ]
}
```

### 数据驱动测试实现

```javascript
// cypress/e2e/data-driven-login.cy.js
describe('数据驱动登录测试', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('有效用户登录测试', () => {
    cy.fixture('users').then((users) => {
      users.validUsers.forEach((user) => {
        cy.get('[data-cy=email]').clear().type(user.email)
        cy.get('[data-cy=password]').clear().type(user.password)
        cy.get('[data-cy=login-button]').click()
        
        cy.url().should('include', user.expectedUrl)
        cy.get('[data-cy=user-role]').should('contain', user.role)
        
        // 返回登录页面进行下一个测试
        cy.visit('/login')
      })
    })
  })

  it('无效用户登录测试', () => {
    cy.fixture('users').then((users) => {
      users.invalidUsers.forEach((user) => {
        cy.get('[data-cy=email]').clear().type(user.email)
        cy.get('[data-cy=password]').clear().type(user.password)
        cy.get('[data-cy=login-button]').click()
        
        cy.get('[data-cy=error-message]')
          .should('be.visible')
          .and('contain', user.expectedError)
      })
    })
  })
})
```

### 使用each进行数据驱动

```javascript
describe('使用each的数据驱动测试', () => {
  const testData = [
    { name: '产品A', price: 100, category: '电子产品' },
    { name: '产品B', price: 200, category: '服装' },
    { name: '产品C', price: 300, category: '家居' }
  ]

  testData.forEach((product) => {
    it(`应该能够添加产品: ${product.name}`, () => {
      cy.visit('/admin/products')
      
      cy.get('[data-cy=add-product-button]').click()
      cy.get('[data-cy=product-name]').type(product.name)
      cy.get('[data-cy=product-price]').type(product.price.toString())
      cy.get('[data-cy=product-category]').select(product.category)
      cy.get('[data-cy=save-button]').click()
      
      cy.get('[data-cy=product-list]')
        .should('contain', product.name)
        .and('contain', product.price)
    })
  })
})
```

## API测试

### 基础API测试

```javascript
describe('API测试', () => {
  beforeEach(() => {
    // 设置基础URL
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      window.localStorage.setItem('token', response.body.token)
    })
  })

  it('应该能够获取用户列表', () => {
    cy.request({
      method: 'GET',
      url: '/api/users',
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('token')}`
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('users')
      expect(response.body.users).to.be.an('array')
      expect(response.body.users).to.have.length.greaterThan(0)
    })
  })

  it('应该能够创建新用户', () => {
    const newUser = {
      name: '新用户',
      email: 'newuser@example.com',
      role: 'user'
    }

    cy.request({
      method: 'POST',
      url: '/api/users',
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: newUser
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('id')
      expect(response.body.name).to.eq(newUser.name)
      expect(response.body.email).to.eq(newUser.email)
    })
  })
})
```

### 网络拦截和模拟

```javascript
describe('网络拦截测试', () => {
  it('应该拦截API请求', () => {
    // 拦截GET请求
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: {
        products: [
          { id: 1, name: '产品A', price: 100 },
          { id: 2, name: '产品B', price: 200 }
        ]
      }
    }).as('getProducts')

    cy.visit('/products')
    cy.wait('@getProducts')

    cy.get('[data-cy=product-list]').should('be.visible')
    cy.get('[data-cy=product-item]').should('have.length', 2)
  })

  it('应该模拟网络错误', () => {
    cy.intercept('GET', '/api/products', {
      statusCode: 500,
      body: { error: '服务器内部错误' }
    }).as('getProductsError')

    cy.visit('/products')
    cy.wait('@getProductsError')

    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', '加载失败')
  })

  it('应该模拟网络延迟', () => {
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: { products: [] },
      delay: 2000
    }).as('getProductsSlow')

    cy.visit('/products')
    cy.get('[data-cy=loading]').should('be.visible')
    cy.wait('@getProductsSlow')
    cy.get('[data-cy=loading]').should('not.exist')
  })
})
```

### API和UI结合测试

```javascript
describe('API和UI结合测试', () => {
  it('应该通过API创建数据并在UI中验证', () => {
    // 通过API创建用户
    cy.request({
      method: 'POST',
      url: '/api/users',
      body: {
        name: '测试用户',
        email: 'testuser@example.com',
        role: 'user'
      }
    }).then((response) => {
      const userId = response.body.id
      
      // 在UI中验证用户存在
      cy.visit('/admin/users')
      cy.get('[data-cy=user-list]')
        .should('contain', '测试用户')
        .and('contain', 'testuser@example.com')
      
      // 通过API删除用户
      cy.request({
        method: 'DELETE',
        url: `/api/users/${userId}`
      })
    })
  })
})
```

## 自定义命令

### 创建自定义命令

```javascript
// cypress/support/commands.js

// 登录命令
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type(email)
    cy.get('[data-cy=password]').type(password)
    cy.get('[data-cy=login-button]').click()
    cy.url().should('include', '/dashboard')
  })
})

// 数据清理命令
Cypress.Commands.add('cleanupTestData', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test-data',
    headers: {
      'Authorization': `Bearer ${Cypress.env('adminToken')}`
    }
  })
})

// 等待元素加载完成
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loading]').should('not.exist')
  cy.get('[data-cy=main-content]').should('be.visible')
})

// 文件上传命令
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath, { force: true })
})

// 表格操作命令
Cypress.Commands.add('getTableRow', (tableSelector, rowIndex) => {
  return cy.get(`${tableSelector} tbody tr`).eq(rowIndex)
})

Cypress.Commands.add('getTableColumn', (tableSelector, columnIndex) => {
  return cy.get(`${tableSelector} tbody tr td`).eq(columnIndex)
})
```

### 使用自定义命令

```javascript
// cypress/e2e/custom-commands.cy.js
describe('使用自定义命令', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'admin123')
    cy.visit('/admin')
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  it('应该能够使用自定义命令', () => {
    cy.waitForPageLoad()
    
    // 上传文件
    cy.uploadFile('[data-cy=file-input]', 'cypress/fixtures/test-file.txt')
    
    // 操作表格
    cy.getTableRow('[data-cy=user-table]', 0)
      .should('contain', 'admin@example.com')
    
    cy.getTableColumn('[data-cy=user-table]', 1)
      .should('contain', '管理员')
  })
})
```

### 带参数的自定义命令

```javascript
// cypress/support/commands.js

// 带选项的命令
Cypress.Commands.add('loginAs', (userType, options = {}) => {
  const users = {
    admin: { email: 'admin@example.com', password: 'admin123' },
    user: { email: 'user@example.com', password: 'user123' },
    guest: { email: 'guest@example.com', password: 'guest123' }
  }
  
  const user = users[userType]
  if (!user) {
    throw new Error(`未知用户类型: ${userType}`)
  }
  
  cy.session([userType, options], () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type(user.email)
    cy.get('[data-cy=password]').type(user.password)
    cy.get('[data-cy=login-button]').click()
    
    if (options.redirect) {
      cy.url().should('include', options.redirect)
    } else {
      cy.url().should('include', '/dashboard')
    }
  })
})

// 数据库操作命令
Cypress.Commands.add('createTestUser', (userData) => {
  cy.request({
    method: 'POST',
    url: '/api/users',
    body: userData
  }).then((response) => {
    Cypress.env('testUserId', response.body.id)
    return response.body
  })
})

Cypress.Commands.add('deleteTestUser', () => {
  const userId = Cypress.env('testUserId')
  if (userId) {
    cy.request({
      method: 'DELETE',
      url: `/api/users/${userId}`
    })
    Cypress.env('testUserId', null)
  }
})
```

## 测试配置与环境

### 环境配置

```javascript
// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // 环境变量
    env: {
      apiUrl: 'http://localhost:3001/api',
      adminEmail: 'admin@example.com',
      adminPassword: 'admin123',
      userEmail: 'user@example.com',
      userPassword: 'user123'
    },
    
    // 设置钩子
    setupNodeEvents(on, config) {
      // 任务定义
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        
        // 数据库清理任务
        clearDatabase() {
          // 实现数据库清理逻辑
          return null
        },
        
        // 文件操作任务
        readFile(filePath) {
          const fs = require('fs')
          return fs.readFileSync(filePath, 'utf8')
        }
      })
      
      // 插件配置
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-web-security')
          launchOptions.args.push('--disable-features=VizDisplayCompositor')
        }
        return launchOptions
      })
      
      return config
    }
  }
})
```

### 多环境配置

```javascript
// cypress.config.js
const { defineConfig } = require('cypress')

const environments = {
  development: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001/api'
  },
  staging: {
    baseUrl: 'https://staging.example.com',
    apiUrl: 'https://staging-api.example.com/api'
  },
  production: {
    baseUrl: 'https://example.com',
    apiUrl: 'https://api.example.com/api'
  }
}

module.exports = defineConfig({
  e2e: {
    ...environments[process.env.CYPRESS_ENV || 'development'],
    
    setupNodeEvents(on, config) {
      // 根据环境设置配置
      const env = process.env.CYPRESS_ENV || 'development'
      config.env = { ...config.env, ...environments[env] }
      
      return config
    }
  }
})
```

### 测试分组和标签

```javascript
// cypress/e2e/smoke-tests.cy.js
describe('冒烟测试', { tags: '@smoke' }, () => {
  it('应该能够访问首页', () => {
    cy.visit('/')
    cy.get('[data-cy=header]').should('be.visible')
  })
  
  it('应该能够登录', () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type('admin@example.com')
    cy.get('[data-cy=password]').type('admin123')
    cy.get('[data-cy=login-button]').click()
    cy.url().should('include', '/dashboard')
  })
})

// cypress/e2e/regression-tests.cy.js
describe('回归测试', { tags: '@regression' }, () => {
  it('应该能够完成完整的用户流程', () => {
    // 复杂的端到端测试
  })
})
```

## 调试技巧

### 调试工具

```javascript
describe('调试技巧', () => {
  it('使用调试命令', () => {
    cy.visit('/')
    
    // 暂停执行
    cy.get('[data-cy=button]').click()
    cy.debug() // 暂停并打开开发者工具
    
    // 打印调试信息
    cy.get('[data-cy=element]').then(($el) => {
      cy.log('元素文本:', $el.text())
      cy.log('元素属性:', $el.attr('class'))
    })
    
    // 截图调试
    cy.screenshot('debug-screenshot')
    
    // 等待调试
    cy.get('[data-cy=loading]').should('be.visible')
    cy.pause() // 暂停执行
    cy.get('[data-cy=content]').should('be.visible')
  })
})
```

### 错误处理调试

```javascript
describe('错误处理调试', () => {
  it('处理元素不存在的情况', () => {
    cy.visit('/')
    
    // 安全地检查元素是否存在
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=optional-element]').length > 0) {
        cy.get('[data-cy=optional-element]').click()
      } else {
        cy.log('可选元素不存在，跳过操作')
      }
    })
  })
  
  it('处理网络请求失败', () => {
    cy.intercept('GET', '/api/data', { forceNetworkError: true })
    
    cy.visit('/data-page')
    
    // 检查错误处理
    cy.get('[data-cy=error-message]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', '网络错误')
  })
})
```

### 性能调试

```javascript
describe('性能调试', () => {
  it('测量页面加载时间', () => {
    const startTime = Date.now()
    
    cy.visit('/')
    cy.get('[data-cy=main-content]').should('be.visible')
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      cy.log(`页面加载时间: ${loadTime}ms`)
      expect(loadTime).to.be.lessThan(3000)
    })
  })
  
  it('检查网络请求性能', () => {
    cy.intercept('GET', '/api/data').as('getData')
    
    cy.visit('/data-page')
    cy.wait('@getData').then((interception) => {
      const responseTime = interception.response.duration
      cy.log(`API响应时间: ${responseTime}ms`)
      expect(responseTime).to.be.lessThan(1000)
    })
  })
})
```

## 最佳实践

### 测试组织

```javascript
// 1. 使用描述性的测试名称
describe('用户管理功能', () => {
  describe('用户创建', () => {
    it('应该能够创建新用户并验证信息', () => {
      // 测试实现
    })
  })
  
  describe('用户编辑', () => {
    it('应该能够编辑现有用户信息', () => {
      // 测试实现
    })
  })
})

// 2. 使用beforeEach进行测试隔离
describe('测试隔离', () => {
  beforeEach(() => {
    // 每个测试前清理状态
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit('/')
  })
  
  it('测试1', () => {
    // 独立的测试
  })
  
  it('测试2', () => {
    // 独立的测试
  })
})
```

### 选择器最佳实践

```javascript
describe('选择器最佳实践', () => {
  it('使用稳定的选择器', () => {
    // ❌ 避免使用不稳定的选择器
    // cy.get('.btn-primary') // 样式类可能变化
    // cy.get('#submit') // ID可能重复
    
    // ✅ 使用data-cy属性
    cy.get('[data-cy=submit-button]')
    
    // ✅ 使用语义化的选择器
    cy.get('button[type="submit"]')
    cy.get('input[name="email"]')
    
    // ✅ 使用文本内容（谨慎使用）
    cy.contains('button', '提交')
  })
})
```

### 测试数据管理

```javascript
describe('测试数据管理', () => {
  // 使用fixtures管理测试数据
  beforeEach(() => {
    cy.fixture('test-users').then((users) => {
      this.testUsers = users
    })
  })
  
  it('使用测试数据', () => {
    const user = this.testUsers.valid[0]
    cy.get('[data-cy=email]').type(user.email)
    cy.get('[data-cy=password]').type(user.password)
  })
  
  // 动态生成测试数据
  it('生成动态测试数据', () => {
    const timestamp = Date.now()
    const testEmail = `test${timestamp}@example.com`
    
    cy.get('[data-cy=email]').type(testEmail)
    // 使用动态数据
  })
})
```

### 错误处理

```javascript
describe('错误处理最佳实践', () => {
  it('优雅地处理错误', () => {
    // 使用should进行软断言
    cy.get('[data-cy=optional-element]')
      .should('exist')
      .and('be.visible')
    
    // 使用then进行条件检查
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=error-message]').length > 0) {
        cy.get('[data-cy=error-message]').should('contain', '错误')
      }
    })
  })
})
```

## 常见问题解决

### 元素定位问题

```javascript
describe('元素定位问题解决', () => {
  it('处理动态内容', () => {
    // 等待内容加载完成
    cy.get('[data-cy=loading]').should('not.exist')
    cy.get('[data-cy=content]').should('be.visible')
    
    // 使用更具体的选择器
    cy.get('[data-cy=user-list] [data-cy=user-item]:first')
  })
  
  it('处理iframe内容', () => {
    cy.get('[data-cy=iframe]').then(($iframe) => {
      const $body = $iframe.contents().find('body')
      cy.wrap($body).find('[data-cy=iframe-button]').click()
    })
  })
  
  it('处理Shadow DOM', () => {
    cy.get('[data-cy=shadow-host]')
      .shadow()
      .find('[data-cy=shadow-button]')
      .click()
  })
})
```

### 时间相关问题

```javascript
describe('时间相关问题解决', () => {
  it('处理异步操作', () => {
    // 使用cy.intercept等待网络请求
    cy.intercept('POST', '/api/save').as('saveData')
    cy.get('[data-cy=save-button]').click()
    cy.wait('@saveData')
    
    // 使用should等待状态变化
    cy.get('[data-cy=status]').should('contain', '已保存')
  })
  
  it('处理动画和过渡', () => {
    // 等待动画完成
    cy.get('[data-cy=animated-element]')
      .should('have.css', 'transition-duration')
      .and('not.equal', '0s')
    
    // 等待动画结束
    cy.get('[data-cy=animated-element]')
      .should('not.have.css', 'transform')
  })
})
```

### 跨域问题

```javascript
describe('跨域问题解决', () => {
  it('处理跨域请求', () => {
    // 在cypress.config.js中设置
    // chromeWebSecurity: false
    
    // 或者使用cy.request进行API测试
    cy.request({
      method: 'GET',
      url: 'https://api.example.com/data',
      headers: {
        'Authorization': 'Bearer token'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
```

## 🎯 实践项目

### 项目1：电商网站E2E测试

创建一个完整的电商网站端到端测试套件：

```javascript
// cypress/e2e/ecommerce.cy.js
describe('电商网站E2E测试', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  
  it('完整的购物流程', () => {
    // 1. 浏览商品
    cy.get('[data-cy=product-grid]').should('be.visible')
    cy.get('[data-cy=product-item]').first().click()
    
    // 2. 查看商品详情
    cy.get('[data-cy=product-details]').should('be.visible')
    cy.get('[data-cy=add-to-cart]').click()
    
    // 3. 查看购物车
    cy.get('[data-cy=cart-icon]').click()
    cy.get('[data-cy=cart-items]').should('contain', '1')
    
    // 4. 结账
    cy.get('[data-cy=checkout-button]').click()
    cy.get('[data-cy=checkout-form]').should('be.visible')
    
    // 5. 填写信息
    cy.get('[data-cy=email]').type('test@example.com')
    cy.get('[data-cy=address]').type('测试地址')
    cy.get('[data-cy=payment-method]').select('信用卡')
    
    // 6. 完成订单
    cy.get('[data-cy=place-order]').click()
    cy.get('[data-cy=order-confirmation]').should('be.visible')
  })
})
```

### 项目2：管理后台测试

```javascript
// cypress/e2e/admin-dashboard.cy.js
describe('管理后台测试', () => {
  beforeEach(() => {
    cy.loginAs('admin')
    cy.visit('/admin')
  })
  
  it('用户管理功能', () => {
    // 查看用户列表
    cy.get('[data-cy=user-management]').click()
    cy.get('[data-cy=user-table]').should('be.visible')
    
    // 创建新用户
    cy.get('[data-cy=add-user-button]').click()
    cy.get('[data-cy=user-form]').should('be.visible')
    
    cy.get('[data-cy=user-name]').type('新用户')
    cy.get('[data-cy=user-email]').type('newuser@example.com')
    cy.get('[data-cy=user-role]').select('user')
    cy.get('[data-cy=save-user]').click()
    
    // 验证用户创建成功
    cy.get('[data-cy=user-table]').should('contain', 'newuser@example.com')
    
    // 编辑用户
    cy.get('[data-cy=user-table]')
      .contains('newuser@example.com')
      .parent()
      .find('[data-cy=edit-user]')
      .click()
    
    cy.get('[data-cy=user-name]').clear().type('更新的用户名')
    cy.get('[data-cy=save-user]').click()
    
    // 验证更新成功
    cy.get('[data-cy=user-table]').should('contain', '更新的用户名')
  })
})
```

## 📝 总结

通过本指南，您已经掌握了：

1. **Cypress基础**：安装、配置和基本概念
2. **测试编写**：元素定位、操作和断言
3. **高级功能**：页面对象、数据驱动、API测试
4. **最佳实践**：测试组织、错误处理、性能优化
5. **调试技巧**：问题诊断和解决方案

### 下一步学习

- [Playwright使用](./playwright-usage.md) - 另一个强大的E2E测试框架
- [测试自动化](./test-automation.md) - 测试自动化策略
- [性能测试基础](./performance-testing-basics.md) - 性能测试方法

继续学习，掌握Cypress测试技能！🚀
