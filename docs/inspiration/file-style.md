# 文件树样式的任务列表

<image src="../.vitepress/assets/file-style.png" />

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>任务列表</title>
    <style>
      :root {
        --primary-color: #6c63ff;
        --border-width: 2px;
        --left-distance: 50px;
        --transform-x-percent: -75%;
        --transform-y-percent: -33%;
        --box-inline-padding: 0 var(--left-distance);
        --background-color: #fff;
      }
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .task-list {
        position: relative;
        width: 500px;
        margin-left: 20px;
        margin: auto;
        padding: var(--box-inline-padding);
        list-style: none;
        overflow: hidden;
      }
      .task-item {
        position: relative;
        background-color: var(--background-color);
      }
      .task-item::before {
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        transform: translate(
          var(--transform-x-percent),
          var(--transform-y-percent)
        );
        width: var(--left-distance);
        height: calc(100% + 20px);
        border-bottom-left-radius: 15px;
        border-width: var(--border-width);
        border-style: solid;
        border-top-color: transparent;
        border-right-color: transparent;
        border-left-color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        z-index: -2;
      }
      .task-item:nth-child(1) .task-content {
        animation-delay: 0.2s;
      }
      .task-item:nth-child(2) .task-content {
        animation-delay: 0.4s;
      }
      .task-item:nth-child(3) .task-content {
        animation-delay: 0.6s;
      }
      .task-content {
        display: flex;
        align-items: center;
        margin-block: 10px;
        padding: 10px;
        border-radius: 5px;
        background-color: #f5f5f5;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.5s forwards;
        z-index: 10;
      }

      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* 内容 */
      .task-icon {
        margin-right: 10px;
      }
      .task-status {
        margin-left: auto;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
      }
      .done {
        background-color: #d4edda;
        color: #155724;
      }
      .in-progress {
        background-color: #cce5ff;
        color: #004085;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <ul class="task-list">
        <li class="task-item">
          <div class="task-content">
            <div class="task-icon">⚡</div>
            <div>BEIC-12 Customer portal</div>
            <div class="task-status done">DONE</div>
          </div>
        </li>
        <li class="task-item">
          <div class="task-content">
            <div class="task-icon">⚡</div>
            <div>BEIC-57 Credit card launch</div>
            <div class="task-status in-progress">IN PROGRESS</div>
          </div>
        </li>
        <li class="task-item">
          <div class="task-content">
            <div class="task-icon">⚡</div>
            <div>BEIC-71 Billing system</div>
            <div class="task-status done">DONE</div>
          </div>
        </li>
      </ul>
    </div>
  </body>
</html>

```
