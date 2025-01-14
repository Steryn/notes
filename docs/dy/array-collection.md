# Set获取数据并交叉集

## 实例数据

```js
const arr1 = [1, 2, 3, 4, 5, 6];
const arr2 = [1, 2, 3, 7, 8, 9];
```

## 并集

```js
const union = [...new Set([...arr1, ...arr2])];
console.log(union);
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## 交集

```js
const intersection = arr1.filter(item => arr2.includes(item));
console.log(intersection);
// [1, 2, 3]
```

## 差集

```js
const difference = arr1.filter(item => !arr2.includes(item));
console.log(difference);
// [4, 5, 6]
```
