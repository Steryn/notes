# 数字转中文

```js
function toChineseNumber(num) {
  const chars = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = [
    "",
    "十",
    "百",
    "千",
    "万",
    "十",
    "百",
    "千",
    "亿",
    "十",
    "百",
    "千",
    "万",
    "十",
    "百",
    "千",
    "亿",
  ];
  // 去除中间段和末尾的连续‘零’
  function dropZero(str) {
    return str.replace(/零{2,}/g, "零").replace(/零+$/g, "");
  }
  function _transform(n) {
    if (n.replaceAll("0", "") === "") return chars[0];
    let result = "";
    for (let i = 0; i < n.length; i++) {
      const c = chars[+n[i]];
      const u = units[n.length - 1 - i];
      result += c + (c === chars[0] ? "" : u);
    }
    return dropZero(result);
  }

  const numStr = num.toString().split(",").filter(Boolean);

  return numStr.reduce((prev, cur) => {
    return (prev += _transform(cur));
  }, "");
}
console.log(toChineseNumber(34530003430));

```
