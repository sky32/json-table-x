# JsonTableX

将任意 JSON（对象/数组/原始值）渲染为可读的嵌套 HTML 表格：自动选择横/纵布局，支持多表拆分、滚动、i18n、主题变量与类名覆写。

## 特性

- 任意深度嵌套：对象/数组混合结构都可递归展示
- 表格自适应：对象数组自动生成“记录表”，并按数据规模自动横/纵切换
- 多表模式：从 JSON 中发现可渲染的表格路径，按需筛选渲染
- i18n：内置中英文文案，可完全自定义
- 样式可控：提供 CSS 变量主题 + classNames 覆写，适配你的设计体系
- 小优化：数组单元素可内联、子表可滚动、`a:b` 形式 key 会自动分组

## 使用方式

### 直接在页面引入（推荐）

构建产物在 `dist/` 下：

```html
<link rel="stylesheet" href="dist/json-table-x.min.css" />
<script src="dist/json-table-x.min.js"></script>
```

全局变量：

- `window.JsonTableX`（别名：`window.JsonTablePlugin`）

### 快速开始

```html
<div id="mount"></div>
<script>
  const data = { hello: "world", users: [{ id: 1, name: "Alice" }] };

  JsonTableX.render(document.getElementById('mount'), data, {
    className: 'jtx',
    view: 'single',
    layoutMode: 'auto',
    lang: 'zh',
    allowHtml: false,
    singleItemInline: true,
    scroll: { enable: false, maxHeight: 260 },
    cssVars: JsonTableX.themes.dark
  });
</script>
```

## API

### JsonTableX.render(container, data, options?)

- `container`: HTMLElement（渲染容器）
- `data`: 任意 JSON
- `options`：
  - `view`: `'single' | 'multi'`，默认 `'single'`
  - `layoutMode`: `'auto' | 'horizontal' | 'vertical'`，默认 `'auto'`
  - `allowHtml`: boolean，默认 `false`（注意：开启后会把 key/字符串当作 HTML 注入 DOM）
  - `lang`: `'zh' | 'en'`，默认 `'zh'`
  - `messages`: 覆盖文案 `{ fieldLabel, contentLabel, noTables, trueLabel, falseLabel }`
  - `singleItemInline`: boolean，默认 `true`（数组只有 1 个元素时直接内联）
  - `scroll`: `{ enable: boolean, maxHeight: number }`（子表滚动）
  - `selectedPaths`: `Set<string>`（仅 `view='multi'` 生效，用于筛选要渲染的路径）
  - `className`: string（根容器附加类名；内置样式使用 `jtx`）
  - `classNames`: `Record<string,string>`（覆写内部类名，key 列表见下方）
  - `cssVars`: `Record<string,string>`（CSS 变量覆写；可直接用 `JsonTableX.themes.*`）

内部 classNames 可覆写 key：

`table thead tbody tr th td card tableWrap nestedTable sections section sectionHeader sectionBody kvInline kvChip kvRow kvTitle kvContent listPlain listItem`

### JsonTableX.discover(data)

返回“可渲染表格”的摘要数组，用于多表模式筛选：

- `[{ kind, path, columns, rows }, ...]`
- `kind`: `'records' | 'list' | 'kv'`
- `path`: 类 JSONPath 形式（例如 `$.users[0].profile`）

多表筛选示例：

```js
const tables = JsonTableX.discover(data);
const selectedPaths = new Set(tables.filter(t => t.kind === 'records').map(t => t.path));
JsonTableX.render(mountEl, data, { className: 'jtx', view: 'multi', selectedPaths });
```

## i18n

内置文案：

- zh: `{ fieldLabel: '字段', contentLabel: '内容', noTables: '没有可渲染的表格', trueLabel: '是', falseLabel: '否' }`
- en: `{ fieldLabel: 'Field', contentLabel: 'Content', noTables: 'No tables to render', trueLabel: 'true', falseLabel: 'false' }`

可通过 `lang` 或 `messages` 覆盖。

## 构建与本地预览

```bash
npm install
npm run build
npm run dev
```

- `npm run dev`：构建并打开 Demo（默认 http://127.0.0.1:8000/）
- `npm run build`：输出 `dist/json-table-x.min.js` 与 `dist/json-table-x.min.css`
- `npm run clean`：清理 `dist`

Demo 位于 `demo/`，直接打开 `demo/index.html` 也可运行（但建议先 `npm run build`）。

