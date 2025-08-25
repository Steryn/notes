# JS Api

## Page Visibility API —— 页面“隐身”探测

```js
document.addEventListener('visibilitychange', () => {
  document.visibilityState === 'hidden'
    ? video.pause()
    : video.play();
});
```

## Broadcast Channel —— 跨标签页通信

```js
const bc = new BroadcastChannel('login');
bc.postMessage({ token: 'abc123' });
bc.onmessage = (e) => console.log(e.data);
```

## Intl.NumberFormat —— 一键千分位

```js
new Intl.NumberFormat('zh-CN').format(1234567); // 1,234,567
```

## Intl.RelativeTimeFormat —— 相对时间格式化

```js
new Intl.RelativeTimeFormat('zh-CN').format(1, 'day'); // 1天后
new Intl.RelativeTimeFormat('zh-CN').format(-1, 'day'); // 1天前
new Intl.RelativeTimeFormat('zh-CN').format(1, 'month'); // 1个月后
new Intl.RelativeTimeFormat('zh-CN').format(-1, 'month'); // 1个月前
new Intl.RelativeTimeFormat('zh-CN').format(1, 'year'); // 1年后
```

## Intl.ListFormat —— 列表格式化

```js
new Intl.ListFormat('zh-CN').format(['张三', '李四', '王五']); // 张三、李四、王五
new Intl.ListFormat('zh-CN').format(['张三', '李四']); // 张三、李四
new Intl.ListFormat('zh-CN').format(['张三']); // 张三
```

## IntersectionObserver —— 懒加载 + 曝光埋点

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => e.isIntersecting && loadImg(e.target));
});
io.observe(img);
```

## ResizeObserver —— 元素级尺寸监听

```js
const ro = new ResizeObserver((entries) => {
  entries.forEach((e) => console.log('尺寸变化', e.contentRect));
});
ro.observe(chartContainer);
```

## Clipboard API —— 无依赖复制

```js
await navigator.clipboard.writeText('COUPON2025');
```

## URLSearchParams —— 再也不用正则解析 query

```js
const params = new URLSearchParams(location.search);
params.get('id'); // ?id=123
```

## AbortController —— 可取消的 fetch

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // 立即中断
```

## requestIdleCallback —— 主线程垃圾时间调度器

```js
requestIdleCallback(() => {
  // 在主线程空闲时执行
});
```

## requestIdleCallback：利用浏览器空闲时间

作用：在浏览器空闲时执行低优先级任务，避免阻塞主线程。

场景：日志上报、数据预加载、非紧急计算。

```js
function processDataChunk(deadline) {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    executeTask(tasks.pop());
  }
  if (tasks.length > 0) {
    requestIdleCallback(processDataChunk); // 递归调度
  }
}
requestIdleCallback(processDataChunk);
```

## IntersectionObserver：高效实现懒加载

作用：异步监听元素是否进入视口，替代 scroll 事件。

场景：图片懒加载、无限滚动、广告曝光统计。

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src; // 触发加载
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.lazy-img').forEach(img => observer.observe(img));
```

## URL.createObjectURL：高效处理本地文件

作用：为 Blob/File 生成临时 URL，避免 FileReader 内存爆炸。

场景：大文件预览、视频即时播放。

```js
const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = (e) => {
  const url = URL.createObjectURL(e.target.files[0]); // 瞬时生成
  videoElement.src = url;
  // 使用后释放内存！
  videoElement.onend = () => URL.revokeObjectURL(url);
};
```

## Fetch API + Streams：流式处理大文件

作用：分块处理大数据，减少内存占用。

场景：大文件下载、实时视频流。

```js
fetch('/large-video.mp4')
  .then(response => {
    const reader = response.body.getReader();
    const processChunk = ({ done, value }) => {
      if (done) return;
      videoBuffer.append(value); // 分块写入缓冲区
      reader.read().then(processChunk);
    };
    reader.read().then(processChunk);
  });
```
