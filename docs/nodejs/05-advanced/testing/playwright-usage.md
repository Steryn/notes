# Playwright使用

## 📋 概述

Playwright是由Microsoft开发的现代化端到端测试框架，支持Chromium、Firefox、Safari等多种浏览器。它提供了强大的自动化测试能力，包括API测试、UI测试、移动端测试等，是构建可靠Web应用测试的首选工具之一。

## 🎯 学习目标

- 掌握Playwright的安装、配置和基本使用
- 学会编写稳定可靠的E2E测试用例
- 了解Playwright的高级功能和最佳实践
- 掌握测试调试、并行执行和CI/CD集成

## 🚀 Playwright环境搭建

### 安装和初始化

```bash
# 创建新项目
mkdir playwright-testing
cd playwright-testing
npm init -y

# 安装Playwright
npm install -D @playwright/test

# 初始化Playwright配置
npx playwright install

# 安装浏览器（可选，如果之前没有安装）
npx playwright install chromium firefox webkit
```

### 基础配置

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests',
  
  // 全局测试超时时间
  timeout: 30 * 1000,
  
  // 期望超时时间
  expect: {
    timeout: 5000
  },
  
  // 失败时重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行执行的工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report.json' }],
    ['junit', { outputFile: 'playwright-results.xml' }]
  ],
  
  // 全局设置
  use: {
    // 基础URL
    baseURL: 'http://localhost:3000',
    
    // 浏览器追踪
    trace: 'on-first-retry',
    
    // 截图设置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 忽略HTTPS错误
    ignoreHTTPSErrors: true,
    
    // 用户代理
    userAgent: 'Playwright Test Agent'
  },
  
  // 项目配置（多浏览器测试）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
  
  // Web服务器配置
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // 输出目录
  outputDir: 'test-results/',
});
```

### 环境变量配置

```javascript
// .env
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_BROWSER=chromium
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_RETRIES=2
CI=false
```

## 📝 基础测试编写

### 简单页面测试

```javascript
// tests/basic-navigation.spec.js
import { test, expect } from '@playwright/test';

test.describe('基础页面导航测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问首页
    await page.goto('/');
  });
  
  test('应该正确加载首页', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/Welcome/);
    
    // 验证主要元素存在
    await expect(page.locator('h1')).toContainText('Welcome');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
  
  test('应该能够导航到不同页面', async ({ page }) => {
    // 点击导航链接
    await page.click('nav a[href="/about"]');
    
    // 验证URL变化
    await expect(page).toHaveURL(/.*about/);
    
    // 验证页面内容
    await expect(page.locator('h1')).toContainText('About');
  });
  
  test('应该在移动端正确显示', async ({ page, isMobile }) => {
    if (isMobile) {
      // 验证移动端菜单按钮
      await expect(page.locator('.mobile-menu-toggle')).toBeVisible();
      
      // 点击移动端菜单
      await page.click('.mobile-menu-toggle');
      await expect(page.locator('.mobile-menu')).toBeVisible();
    } else {
      // 验证桌面端导航
      await expect(page.locator('.desktop-nav')).toBeVisible();
    }
  });
});
```

### 表单交互测试

```javascript
// tests/form-interactions.spec.js
import { test, expect } from '@playwright/test';

test.describe('表单交互测试', () => {
  test('用户注册流程', async ({ page }) => {
    await page.goto('/register');
    
    // 填写注册表单
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password"]', 'SecurePass123!');
    
    // 选择用户类型
    await page.selectOption('[data-testid="user-type"]', 'premium');
    
    // 勾选同意条款
    await page.check('[data-testid="terms-checkbox"]');
    
    // 提交表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证成功消息
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('注册成功');
    
    // 验证重定向到仪表板
    await expect(page).toHaveURL(/.*dashboard/);
  });
  
  test('表单验证错误处理', async ({ page }) => {
    await page.goto('/register');
    
    // 提交空表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证错误消息
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // 填写无效邮箱
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('请输入有效的邮箱地址');
  });
  
  test('文件上传功能', async ({ page }) => {
    await page.goto('/profile');
    
    // 监听文件上传请求
    const uploadPromise = page.waitForResponse(resp => 
      resp.url().includes('/api/upload') && resp.status() === 200
    );
    
    // 上传文件
    const fileInput = page.locator('[data-testid="avatar-upload"]');
    await fileInput.setInputFiles('./test-fixtures/avatar.jpg');
    
    // 等待上传完成
    await uploadPromise;
    
    // 验证上传成功
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible();
  });
});
```

### API测试集成

```javascript
// tests/api-integration.spec.js
import { test, expect } from '@playwright/test';

test.describe('API集成测试', () => {
  let apiContext;
  let authToken;
  
  test.beforeAll(async ({ playwright }) => {
    // 创建API上下文
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // 获取认证令牌
    const loginResponse = await apiContext.post('/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword'
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });
  
  test.afterAll(async () => {
    await apiContext.dispose();
  });
  
  test('获取用户列表', async () => {
    const response = await apiContext.get('/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
    
    // 验证用户数据结构
    expect(users[0]).toHaveProperty('id');
    expect(users[0]).toHaveProperty('name');
    expect(users[0]).toHaveProperty('email');
  });
  
  test('创建新用户', async () => {
    const newUser = {
      name: 'New Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'newpassword123'
    };
    
    const response = await apiContext.post('/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: newUser
    });
    
    expect(response.status()).toBe(201);
    
    const createdUser = await response.json();
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);
    expect(createdUser).toHaveProperty('id');
    expect(createdUser).not.toHaveProperty('password'); // 密码不应返回
  });
  
  test('处理API错误', async () => {
    // 测试无效数据
    const response = await apiContext.post('/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: '', // 空名称
        email: 'invalid-email' // 无效邮箱
      }
    });
    
    expect(response.status()).toBe(400);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('errors');
    expect(Array.isArray(errorData.errors)).toBeTruthy();
  });
  
  test('UI与API数据一致性', async ({ page }) => {
    // 通过API获取用户数据
    const apiResponse = await apiContext.get('/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const apiUsers = await apiResponse.json();
    
    // 访问用户列表页面
    await page.goto('/users');
    
    // 等待数据加载
    await page.waitForSelector('[data-testid="user-list"]');
    
    // 获取页面显示的用户数量
    const userRows = await page.locator('[data-testid="user-row"]').count();
    
    // 验证UI显示的数据与API返回的数据一致
    expect(userRows).toBe(apiUsers.length);
    
    // 验证第一个用户的详细信息
    if (apiUsers.length > 0) {
      const firstUser = apiUsers[0];
      await expect(page.locator(`[data-testid="user-${firstUser.id}"] .user-name`))
        .toContainText(firstUser.name);
      await expect(page.locator(`[data-testid="user-${firstUser.id}"] .user-email`))
        .toContainText(firstUser.email);
    }
  });
});
```

## 🔧 高级功能使用

### 页面对象模式

```javascript
// page-objects/base-page.js
export class BasePage {
  constructor(page) {
    this.page = page;
  }
  
  async goto(path = '') {
    await this.page.goto(path);
  }
  
  async waitForLoadState(state = 'networkidle') {
    await this.page.waitForLoadState(state);
  }
  
  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true 
    });
  }
  
  async getTitle() {
    return await this.page.title();
  }
  
  async isElementVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }
  
  async clickElement(selector) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
  }
  
  async fillInput(selector, text) {
    await this.page.waitForSelector(selector);
    await this.page.fill(selector, text);
  }
  
  async selectOption(selector, value) {
    await this.page.waitForSelector(selector);
    await this.page.selectOption(selector, value);
  }
}
```

```javascript
// page-objects/login-page.js
import { BasePage } from './base-page.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // 页面元素选择器
    this.selectors = {
      emailInput: '[data-testid="email-input"]',
      passwordInput: '[data-testid="password-input"]',
      loginButton: '[data-testid="login-button"]',
      errorMessage: '[data-testid="error-message"]',
      rememberMeCheckbox: '[data-testid="remember-me"]',
      forgotPasswordLink: '[data-testid="forgot-password"]',
      registerLink: '[data-testid="register-link"]'
    };
  }
  
  async goto() {
    await super.goto('/login');
    await this.waitForLoadState();
  }
  
  async login(email, password, rememberMe = false) {
    await this.fillInput(this.selectors.emailInput, email);
    await this.fillInput(this.selectors.passwordInput, password);
    
    if (rememberMe) {
      await this.clickElement(this.selectors.rememberMeCheckbox);
    }
    
    await this.clickElement(this.selectors.loginButton);
  }
  
  async getErrorMessage() {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.page.textContent(this.selectors.errorMessage);
    }
    return null;
  }
  
  async clickForgotPassword() {
    await this.clickElement(this.selectors.forgotPasswordLink);
  }
  
  async clickRegister() {
    await this.clickElement(this.selectors.registerLink);
  }
  
  async isLoginFormVisible() {
    return await this.isElementVisible(this.selectors.emailInput) &&
           await this.isElementVisible(this.selectors.passwordInput) &&
           await this.isElementVisible(this.selectors.loginButton);
  }
}
```

```javascript
// page-objects/dashboard-page.js
import { BasePage } from './base-page.js';

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      welcomeMessage: '[data-testid="welcome-message"]',
      userMenu: '[data-testid="user-menu"]',
      logoutButton: '[data-testid="logout-button"]',
      notificationBell: '[data-testid="notification-bell"]',
      sidebarToggle: '[data-testid="sidebar-toggle"]',
      mainContent: '[data-testid="main-content"]',
      statsCards: '[data-testid="stats-card"]',
      recentActivity: '[data-testid="recent-activity"]'
    };
  }
  
  async goto() {
    await super.goto('/dashboard');
    await this.waitForLoadState();
  }
  
  async waitForDashboardLoad() {
    await this.page.waitForSelector(this.selectors.welcomeMessage);
    await this.page.waitForSelector(this.selectors.mainContent);
  }
  
  async getWelcomeMessage() {
    return await this.page.textContent(this.selectors.welcomeMessage);
  }
  
  async openUserMenu() {
    await this.clickElement(this.selectors.userMenu);
    await this.page.waitForSelector(this.selectors.logoutButton);
  }
  
  async logout() {
    await this.openUserMenu();
    await this.clickElement(this.selectors.logoutButton);
    await this.page.waitForURL(/.*login/);
  }
  
  async getNotificationCount() {
    const badge = this.page.locator(`${this.selectors.notificationBell} .badge`);
    if (await badge.isVisible()) {
      return parseInt(await badge.textContent());
    }
    return 0;
  }
  
  async getStatsData() {
    const statsCards = this.page.locator(this.selectors.statsCards);
    const count = await statsCards.count();
    const stats = [];
    
    for (let i = 0; i < count; i++) {
      const card = statsCards.nth(i);
      const title = await card.locator('.stats-title').textContent();
      const value = await card.locator('.stats-value').textContent();
      stats.push({ title, value });
    }
    
    return stats;
  }
  
  async toggleSidebar() {
    await this.clickElement(this.selectors.sidebarToggle);
  }
}
```

### 使用页面对象的测试

```javascript
// tests/user-workflow.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login-page.js';
import { DashboardPage } from '../page-objects/dashboard-page.js';

test.describe('用户工作流测试', () => {
  let loginPage;
  let dashboardPage;
  
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });
  
  test('完整登录到仪表板流程', async () => {
    // 访问登录页面
    await loginPage.goto();
    
    // 验证登录表单可见
    expect(await loginPage.isLoginFormVisible()).toBe(true);
    
    // 执行登录
    await loginPage.login('user@example.com', 'password123', true);
    
    // 等待仪表板加载
    await dashboardPage.waitForDashboardLoad();
    
    // 验证欢迎消息
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    expect(welcomeMessage).toContain('欢迎');
    
    // 验证统计数据加载
    const stats = await dashboardPage.getStatsData();
    expect(stats.length).toBeGreaterThan(0);
    
    // 验证通知功能
    const notificationCount = await dashboardPage.getNotificationCount();
    expect(typeof notificationCount).toBe('number');
  });
  
  test('登录失败处理', async () => {
    await loginPage.goto();
    
    // 尝试使用错误凭据登录
    await loginPage.login('wrong@example.com', 'wrongpassword');
    
    // 验证错误消息
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('用户名或密码错误');
  });
  
  test('注销流程', async () => {
    // 先登录
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await dashboardPage.waitForDashboardLoad();
    
    // 执行注销
    await dashboardPage.logout();
    
    // 验证重定向到登录页面
    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });
});
```

### 数据驱动测试

```javascript
// tests/data-driven.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login-page.js';

// 测试数据
const loginTestCases = [
  {
    description: '有效凭据登录',
    email: 'valid@example.com',
    password: 'validpassword',
    expectedResult: 'success'
  },
  {
    description: '无效邮箱登录',
    email: 'invalid@example.com',
    password: 'validpassword',
    expectedResult: 'error',
    expectedMessage: '用户不存在'
  },
  {
    description: '错误密码登录',
    email: 'valid@example.com',
    password: 'wrongpassword',
    expectedResult: 'error',
    expectedMessage: '密码错误'
  },
  {
    description: '空邮箱登录',
    email: '',
    password: 'validpassword',
    expectedResult: 'validation',
    expectedMessage: '请输入邮箱'
  },
  {
    description: '空密码登录',
    email: 'valid@example.com',
    password: '',
    expectedResult: 'validation',
    expectedMessage: '请输入密码'
  }
];

test.describe('数据驱动登录测试', () => {
  loginTestCases.forEach(testCase => {
    test(testCase.description, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login(testCase.email, testCase.password);
      
      switch (testCase.expectedResult) {
        case 'success':
          // 验证登录成功
          await expect(page).toHaveURL(/.*dashboard/);
          break;
          
        case 'error':
        case 'validation':
          // 验证错误消息
          const errorMessage = await loginPage.getErrorMessage();
          expect(errorMessage).toContain(testCase.expectedMessage);
          break;
      }
    });
  });
});

// 参数化测试的另一种方式
const userRoles = ['admin', 'user', 'manager', 'guest'];

userRoles.forEach(role => {
  test(`${role}角色权限测试`, async ({ page }) => {
    // 根据角色设置不同的测试逻辑
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login(`${role}@example.com`, 'password123');
    
    // 验证不同角色的权限
    await page.goto('/admin');
    
    if (role === 'admin') {
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
    } else {
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    }
  });
});
```

## 🎭 高级测试技巧

### 浏览器上下文和存储

```javascript
// tests/browser-context.spec.js
import { test, expect } from '@playwright/test';

test.describe('浏览器上下文测试', () => {
  test('多用户会话测试', async ({ browser }) => {
    // 创建两个独立的浏览器上下文
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // 用户1登录
      await page1.goto('/login');
      await page1.fill('[data-testid="email"]', 'user1@example.com');
      await page1.fill('[data-testid="password"]', 'password1');
      await page1.click('[data-testid="login-button"]');
      
      // 用户2登录
      await page2.goto('/login');
      await page2.fill('[data-testid="email"]', 'user2@example.com');
      await page2.fill('[data-testid="password"]', 'password2');
      await page2.click('[data-testid="login-button"]');
      
      // 验证两个用户都成功登录
      await expect(page1).toHaveURL(/.*dashboard/);
      await expect(page2).toHaveURL(/.*dashboard/);
      
      // 验证用户身份独立
      const user1Name = await page1.locator('[data-testid="user-name"]').textContent();
      const user2Name = await page2.locator('[data-testid="user-name"]').textContent();
      
      expect(user1Name).toContain('用户1');
      expect(user2Name).toContain('用户2');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
  
  test('本地存储测试', async ({ page }) => {
    await page.goto('/settings');
    
    // 设置用户偏好
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await page.selectOption('[data-testid="language-select"]', 'zh-CN');
    await page.click('[data-testid="save-settings"]');
    
    // 验证本地存储
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    const language = await page.evaluate(() => localStorage.getItem('language'));
    
    expect(theme).toBe('dark');
    expect(language).toBe('zh-CN');
    
    // 刷新页面验证设置持久化
    await page.reload();
    
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('dark');
    await expect(page.locator('[data-testid="language-select"]')).toHaveValue('zh-CN');
  });
  
  test('Cookie管理测试', async ({ context, page }) => {
    await page.goto('/');
    
    // 设置cookie
    await context.addCookies([
      {
        name: 'session_id',
        value: 'test-session-123',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'user_preferences',
        value: JSON.stringify({ theme: 'dark', lang: 'zh' }),
        domain: 'localhost',
        path: '/'
      }
    ]);
    
    await page.reload();
    
    // 验证cookie被正确设置
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session_id');
    const prefCookie = cookies.find(c => c.name === 'user_preferences');
    
    expect(sessionCookie.value).toBe('test-session-123');
    expect(prefCookie.value).toContain('dark');
  });
});
```

### 网络拦截和模拟

```javascript
// tests/network-mocking.spec.js
import { test, expect } from '@playwright/test';

test.describe('网络拦截测试', () => {
  test('API响应模拟', async ({ page }) => {
    // 拦截API请求并返回模拟数据
    await page.route('/api/users', async route => {
      const mockUsers = [
        { id: 1, name: 'Mock User 1', email: 'mock1@example.com' },
        { id: 2, name: 'Mock User 2', email: 'mock2@example.com' }
      ];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsers)
      });
    });
    
    await page.goto('/users');
    
    // 验证模拟数据正确显示
    await expect(page.locator('[data-testid="user-1"]')).toContainText('Mock User 1');
    await expect(page.locator('[data-testid="user-2"]')).toContainText('Mock User 2');
  });
  
  test('网络错误模拟', async ({ page }) => {
    // 模拟网络错误
    await page.route('/api/users', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/users');
    
    // 验证错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('加载失败');
  });
  
  test('慢速网络模拟', async ({ page }) => {
    // 模拟慢速响应
    await page.route('/api/users', async route => {
      // 延迟3秒
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/users');
    
    // 验证加载状态显示
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // 等待加载完成
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
  });
  
  test('请求拦截和修改', async ({ page }) => {
    // 拦截并修改请求
    await page.route('/api/users', async (route, request) => {
      // 获取原始请求
      const headers = request.headers();
      
      // 添加自定义头部
      headers['X-Test-Header'] = 'test-value';
      
      // 继续原始请求但使用修改后的头部
      await route.continue({ headers });
    });
    
    // 监听请求以验证修改
    page.on('request', request => {
      if (request.url().includes('/api/users')) {
        expect(request.headers()['x-test-header']).toBe('test-value');
      }
    });
    
    await page.goto('/users');
  });
  
  test('文件下载拦截', async ({ page }) => {
    // 拦截文件下载请求
    await page.route('/api/export/users.csv', async route => {
      const csvContent = 'id,name,email\\n1,John,john@example.com\\n2,Jane,jane@example.com';
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="users.csv"'
        },
        body: csvContent
      });
    });
    
    await page.goto('/users');
    
    // 监听下载事件
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('users.csv');
    
    // 验证下载内容
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf8');
    expect(content).toContain('John,john@example.com');
  });
});
```

### 视觉回归测试

```javascript
// tests/visual-regression.spec.js
import { test, expect } from '@playwright/test';

test.describe('视觉回归测试', () => {
  test('首页视觉对比', async ({ page }) => {
    await page.goto('/');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 全页面截图对比
    await expect(page).toHaveScreenshot('homepage.png');
  });
  
  test('登录表单视觉对比', async ({ page }) => {
    await page.goto('/login');
    
    // 对比登录表单
    await expect(page.locator('[data-testid="login-form"]'))
      .toHaveScreenshot('login-form.png');
  });
  
  test('响应式设计视觉测试', async ({ page }) => {
    await page.goto('/');
    
    // 桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('homepage-desktop.png');
    
    // 平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-tablet.png');
    
    // 移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
  
  test('主题切换视觉测试', async ({ page }) => {
    await page.goto('/');
    
    // 默认主题
    await expect(page).toHaveScreenshot('theme-default.png');
    
    // 切换到暗色主题
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // 等待主题切换动画
    
    await expect(page).toHaveScreenshot('theme-dark.png');
  });
  
  test('组件状态视觉测试', async ({ page }) => {
    await page.goto('/components');
    
    const button = page.locator('[data-testid="primary-button"]');
    
    // 默认状态
    await expect(button).toHaveScreenshot('button-default.png');
    
    // 悬停状态
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');
    
    // 禁用状态
    await page.click('[data-testid="disable-button"]');
    await expect(button).toHaveScreenshot('button-disabled.png');
  });
});
```

## 🚀 性能和调试

### 性能监控

```javascript
// tests/performance.spec.js
import { test, expect } from '@playwright/test';

test.describe('性能测试', () => {
  test('页面加载性能', async ({ page }) => {
    // 开始性能监控
    await page.goto('/dashboard');
    
    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        domNodes: document.querySelectorAll('*').length,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    console.log('Performance Metrics:', metrics);
    
    // 设置性能阈值
    expect(metrics.domContentLoaded).toBeLessThan(2000); // DOMContentLoaded < 2s
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // FCP < 1.5s
    expect(metrics.domNodes).toBeLessThan(2000); // DOM节点数 < 2000
  });
  
  test('资源加载优化验证', async ({ page }) => {
    const resources = [];
    
    // 监听资源加载
    page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'],
        size: response.headers()['content-length']
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 分析资源
    const images = resources.filter(r => r.contentType?.startsWith('image/'));
    const scripts = resources.filter(r => r.contentType?.includes('javascript'));
    const styles = resources.filter(r => r.contentType?.includes('css'));
    
    console.log(`Images: ${images.length}, Scripts: ${scripts.length}, Styles: ${styles.length}`);
    
    // 验证资源优化
    expect(images.length).toBeLessThan(20); // 图片数量限制
    expect(scripts.length).toBeLessThan(10); // JS文件数量限制
    expect(styles.length).toBeLessThan(5); // CSS文件数量限制
    
    // 验证没有404资源
    const notFoundResources = resources.filter(r => r.status === 404);
    expect(notFoundResources).toHaveLength(0);
  });
});
```

### 调试工具

```javascript
// tests/debugging.spec.js
import { test, expect } from '@playwright/test';

test.describe('调试功能', () => {
  test('详细调试信息', async ({ page }) => {
    // 启用详细日志
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`Page Error: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      console.error(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    await page.goto('/');
    
    // 在调试时暂停
    // await page.pause(); // 这会在有头模式下暂停执行
    
    // 执行自定义JavaScript进行调试
    const debugInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        cookies: document.cookie,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };
    });
    
    console.log('Debug Info:', debugInfo);
  });
  
  test('截图调试', async ({ page }) => {
    await page.goto('/complex-page');
    
    // 测试步骤间截图
    await page.screenshot({ 
      path: 'debug-screenshots/step-1-initial.png',
      fullPage: true 
    });
    
    await page.click('[data-testid="toggle-menu"]');
    await page.screenshot({ 
      path: 'debug-screenshots/step-2-menu-open.png',
      fullPage: true 
    });
    
    await page.fill('[data-testid="search-input"]', 'test query');
    await page.screenshot({ 
      path: 'debug-screenshots/step-3-search-filled.png',
      fullPage: true 
    });
    
    await page.click('[data-testid="search-button"]');
    await page.waitForSelector('[data-testid="search-results"]');
    await page.screenshot({ 
      path: 'debug-screenshots/step-4-results.png',
      fullPage: true 
    });
  });
  
  test('元素状态调试', async ({ page }) => {
    await page.goto('/interactive-page');
    
    const button = page.locator('[data-testid="submit-button"]');
    
    // 调试元素状态
    const elementInfo = await button.evaluate(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      disabled: el.disabled,
      style: window.getComputedStyle(el).display,
      boundingBox: el.getBoundingClientRect(),
      innerHTML: el.innerHTML
    }));
    
    console.log('Element Info:', elementInfo);
    
    // 等待元素状态变化
    await expect(button).toBeEnabled();
    await expect(button).toBeVisible();
  });
});
```

## 📝 Playwright最佳实践

### 测试组织和维护

```javascript
const PlaywrightBestPractices = {
  TEST_ORGANIZATION: {
    structure: [
      '按功能模块组织测试文件',
      '使用页面对象模式封装页面交互',
      '共享工具函数和测试数据',
      '明确的测试命名约定'
    ],
    
    maintainability: [
      '定期更新选择器和页面对象',
      '保持测试的独立性',
      '避免硬编码等待时间',
      '使用数据驱动测试减少重复'
    ]
  },
  
  STABILITY_PRACTICES: {
    waitingStrategies: [
      '使用waitForSelector等待元素',
      '使用waitForLoadState等待页面状态',
      '使用expect的内置等待机制',
      '避免使用固定的sleep'
    ],
    
    selectorStrategies: [
      '优先使用data-testid属性',
      '避免依赖CSS类名和样式',
      '使用语义化的选择器',
      '建立选择器的更新机制'
    ]
  },
  
  PERFORMANCE_OPTIMIZATION: {
    execution: [
      '并行执行独立的测试',
      '使用浏览器上下文复用',
      '合理配置超时时间',
      '优化测试数据的准备'
    ],
    
    debugging: [
      '启用调试模式进行问题排查',
      '使用截图和视频记录',
      '监控测试执行时间',
      '分析失败模式'
    ]
  }
};
```

## 📝 总结

Playwright是功能强大的现代E2E测试框架：

- **多浏览器支持**：Chromium、Firefox、Safari全覆盖
- **API丰富**：页面交互、网络拦截、性能监控
- **调试友好**：截图、录制、调试模式
- **CI/CD集成**：容器化部署、并行执行

通过Playwright可以构建稳定、高效的端到端测试体系，确保Web应用的质量和用户体验。

## 🔗 相关资源

- [Playwright官方文档](https://playwright.dev/)
- [Playwright GitHub仓库](https://github.com/microsoft/playwright)
- [Playwright测试最佳实践](https://playwright.dev/docs/best-practices)
- [Playwright与其他框架对比](https://playwright.dev/docs/why-playwright)
