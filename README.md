# JsonTableX

一个可将任意 JSON 渲染为嵌套 HTML 表格的轻量插件，支持对象/数组混合结构、纵横布局、HTML 内容、i18n、子表滚动与空间优化。

## 安装与引入

直接在页面引入：

```html
<script src="dist/json-table-x.min.js"></script>
```

全局变量：
- `window.JsonTableX`（别名 `JsonTablePlugin`）

## 快速开始

```html
<div id="mount"></div>
<script>
  const data = {/* your JSON */};
  JsonTableX.render(document.getElementById('mount'), data, {
    view: 'single',                  // 'single' | 'multi'
    layoutMode: 'auto',              // 'auto' | 'horizontal' | 'vertical'
    allowHtml: false,                // 是否将字符串/键名按HTML渲染
    lang: 'zh',                      // 'zh' | 'en'
    singleItemInline: true,          // 数组仅1个元素时，直接内联到父单元格
    scroll: { enable: false, maxHeight: 260 }, // 子表滚动与高度
    className: 'my-root',            // 根容器附加类名
    classNames: {                    // 覆盖内部类名（可选）
      kvChip: 'my-chip'
    },
    cssVars: {                       // 覆盖样式变量（可选）
      '--panel': '#0f0f0f'
    },
    // selectedPaths: new Set(['$.data.items']) // 多表模式下生效
  });
</script>
```

## API

### render(container, data, options)
- `container`: HTMLElement，渲染容器
- `data`: 任意 JSON 对象/数组/原始值
- `options`:
  - `view`: 'single' | 'multi'
  - `layoutMode`: 'auto' | 'horizontal' | 'vertical'
  - `allowHtml`: boolean
  - `lang`: 'zh' | 'en'
  - `messages`: 自定义文案 { fieldLabel, contentLabel, noTables, trueLabel, falseLabel }
  - `singleItemInline`: boolean
  - `scroll`: { enable: boolean, maxHeight: number }
  - `selectedPaths`: Set<string>（view='multi' 时可选）
  - `className`: string（根容器附加类）
  - `classNames`: Record<string,string>（覆盖内部类名，可选键：
    table、thead、tbody、tr、th、td、card、tableWrap、nestedTable、sections、section、sectionHeader、sectionBody、kvInline、kvChip、listPlain、listItem）
  - `cssVars`: Record<string,string>（覆盖主题变量，如 {'--panel':'#0f0f0f'}）

### discover(data)
返回可渲染表格的摘要信息数组（path/kind/columns/rows），便于外部做路径选择。

## i18n
内置：
- zh: { fieldLabel: '字段', contentLabel: '内容', noTables: '没有可渲染的表格', trueLabel: '是', falseLabel: '否' }
- en: { fieldLabel: 'Field', contentLabel: 'Content', noTables: 'No tables to render', trueLabel: 'true', falseLabel: 'false' }

可通过 `lang` 或 `messages` 覆盖。

## 展示策略
- 平面对象（仅键→基础值）：合并到一个单元格，以逐行 chips 展示
- 数组：
  - 仅1个元素且 `singleItemInline=true`：直接内联该元素
  - 纯基础值数组：无表头的纵向内容列表
  - 对象数组：子表（列为键并集）
- 嵌套对象：基础字段先以 chips 集中展示，复杂字段分节展开；递归嵌套无限制
 
## 主题与样式
- 内置主题：`JsonTableX.themes.dark | light | compact`，可直接作为 `cssVars` 传入
- 自定义类名：通过 `classNames` 覆盖内部节点类以适配你的设计体系

## Demo
- 打开 `demo/index.html` 体验最简集成

## 构建
```bash
npm run build
```

输出：dist/json-table-x.min.js

## 脚本
- `npm run dev`：本地预览 demo（端口 8000）
- `npm run build`：压缩生成 dist/json-table-x.min.js
- `npm run clean`：清理 dist
