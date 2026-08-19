# 合作网络模块

## 入口与数据

- 独立预览入口：`index.html`
- 模块脚本：`collaboration-network.js`
- 模块样式：`collaboration-network.css`
- 唯一数据入口：`network_data.json`

请通过本地 Web 服务打开 `index.html`，以便浏览器可以读取 JSON。

## Dashboard 接入

1. 在 Dashboard 引入 `collaboration-network.css` 和 `collaboration-network.js`。
2. 在目标 Panel 放入一个宽高均为 `100%` 的容器。
3. 读取相对路径的 `network_data.json` 后初始化：

```js
CollaborationNetworkModule.init(container, networkData, { defaultYear: '2026' });
```

4. 将目标 Panel 放在 `grid-column: 2; grid-row: 2 / 4;`。详情层使用 fixed overlay，自动覆盖整个 Dashboard，不受 Panel 裁剪。

## 公共方法

- `init(container, data, { defaultYear })`
- `update(data)`
- `setYear(year)`
- `openNodeDetail(nodeId)`
- `closeNodeDetail()`
- `resize()`
- `destroy()`

年度网络由 `buildNetwork()` 依据边的 `event_ids` 和真实事件年份重算；节点详情由 `getNodeDetail()`、`getPartners()` 与 `getNodeEvents()` 生成。`ResizeObserver` 在模块初始化时监听父容器。
