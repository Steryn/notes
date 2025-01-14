# 监听本地存储

```js

const prefix = "@@";
function sendMsg(type, payload) {
  localStorage.setItem(
    prefix + type,
    JSON.stringify({
      payload,
      temp: Date.now(),
    })
  );
}

function listenMsg(handler) {
  const storageHandler = (e) => {
    const data = JSON.parse(e.newValue);
    handler(e.key.substring(prefix.length), data.payload);
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener("storage", storageHandler);
  };
}

// 使用
let unHandler;
onMounted(() => {
  unHandler = listenMsg((type, payload) => {
    if (type == "目标的type") {
      // doSomething
    }
  });
});
onUnmounted(() => {
  unHandler && unHandler();
});

```
