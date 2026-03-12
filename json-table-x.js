; (function (global) {
    const defaultMessages = {
        zh: { fieldLabel: '字段', contentLabel: '内容', noTables: '没有可渲染的表格', trueLabel: '是', falseLabel: '否' },
        en: { fieldLabel: 'Field', contentLabel: 'Content', noTables: 'No tables to render', trueLabel: 'true', falseLabel: 'false' }
    };
    const defaultClassNames = {
        card: 'card',
        tableWrap: 'table-wrap',
        nestedTable: 'nested-table',
        table: 'table',
        thead: 'thead',
        tbody: 'tbody',
        tr: 'tr',
        th: 'th',
        td: 'td',
        sections: 'sections',
        section: 'section',
        sectionHeader: 'section-header',
        sectionBody: 'section-body',
        kvInline: 'kv-inline',
        kvChip: 'kv-chip',
        kvRow: 'kv-row',
        kvTitle: 'kv-title',
        kvContent: 'kv-content',
        listPlain: 'list-plain',
        listItem: 'list-item'
    };
    function cn(key, classes) { return (classes && classes[key]) || defaultClassNames[key]; }
    function isPlainObject(x) { return Object.prototype.toString.call(x) === '[object Object]'; }
    function isPrimitive(x) { return x === null || x === undefined || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'; }
    function isPrimitiveArray(arr) { if (!Array.isArray(arr)) return false; for (const v of arr) if (!isPrimitive(v)) return false; return true; }
    function groupColonKeys(obj) {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const idx = k.indexOf(':');
            if (idx > 0) { const head = k.slice(0, idx); const tail = k.slice(idx + 1); if (!out[head]) out[head] = {}; out[head][tail] = v; }
            else { out[k] = isPlainObject(v) ? groupColonKeys(v) : v; }
        }
        return out;
    }
    function flattenObject(obj, prefix = '', out = {}) {
        if (!isPlainObject(obj)) return out;
        for (const [k, v] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (isPlainObject(v)) flattenObject(v, path, out);
            else if (Array.isArray(v)) out[path] = v;
            else out[path] = v;
        }
        return out;
    }
    function isFlatObject(obj) {
        if (!isPlainObject(obj)) return false;
        for (const v of Object.values(obj)) { if (Array.isArray(v) || isPlainObject(v)) return false; }
        return true;
    }
    function chooseOrientation(kind, columns, rows, layoutMode) {
        if (layoutMode === 'horizontal') return 'horizontal';
        if (layoutMode === 'vertical') return 'vertical';
        if (kind === 'records') { const cols = columns.length, r = rows.length; if ((cols > 12 && r <= 6) || (cols / Math.max(1, r) >= 2 && r <= 8)) return 'vertical'; return 'horizontal'; }
        if (kind === 'list') return 'vertical';
        if (kind === 'kv') return 'vertical';
        return 'horizontal';
    }
    function orientData(kind, columns, rows, orientation, msgs) {
        if (orientation === 'horizontal') return { columns, rows };
        if (kind === 'records' && orientation === 'vertical') {
            const colLabels = [msgs.fieldLabel, ...rows.map((_, i) => `#${i}`)];
            const transRows = columns.map(field => { const obj = { [msgs.fieldLabel]: field }; rows.forEach((r, i) => { obj[`#${i}`] = r[field]; }); return obj; });
            return { columns: colLabels, rows: transRows };
        }
        if (kind === 'list') {
            if (orientation === 'vertical') return { columns, rows };
            const cols = rows.map((_, i) => `#${i}`); const one = {}; rows.forEach((r, i) => { one[`#${i}`] = r[msgs.contentLabel]; });
            return { columns: cols, rows: [one] };
        }
        if (kind === 'kv') {
            if (orientation === 'vertical') { const cols = rows.map(x => x.key); const one = {}; rows.forEach(x => { one[x.key] = x.value; }); return { columns: cols, rows: [one] }; }
            return { columns, rows };
        }
        return { columns, rows };
    }
    function collectTables(root, msgs) {
        const tables = [];
        function visit(node, path = '$') {
            if (Array.isArray(node)) {
                if (node.length === 0) { tables.push({ kind: 'list', path, columns: [msgs.contentLabel], rows: [] }); return; }
                const kinds = new Set(node.map(x => isPlainObject(x) ? 'obj' : Array.isArray(x) ? 'arr' : typeof x));
                if (kinds.size === 1 && kinds.has('obj')) {
                    const flatRows = node.map(r => flattenObject(r));
                    const columns = [...flatRows.reduce((set, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set())].sort();
                    tables.push({ kind: 'records', path, columns, rows: flatRows });
                } else {
                    const rows = node.map(v => ({ [msgs.contentLabel]: v }));
                    tables.push({ kind: 'list', path, columns: [msgs.contentLabel], rows });
                    node.forEach((item, idx) => { if (isPlainObject(item) || Array.isArray(item)) visit(item, `${path}[${idx}]`); });
                }
            } else if (isPlainObject(node)) {
                const flat = flattenObject(node);
                const kvRows = Object.entries(flat).map(([k, v]) => ({ key: k, value: v }));
                tables.push({ kind: 'kv', path, columns: ['key', 'value'], rows: kvRows });
                for (const [k, v] of Object.entries(node)) { if (isPlainObject(v) || Array.isArray(v)) visit(v, `${path}.${k}`); }
            }
        }
        visit(root, '$');
        const byKey = new Map();
        for (const t of tables) {
            const key = `${t.path}:${t.kind}`;
            if (t.kind === 'records') { byKey.delete(`${t.path}:kv`); byKey.set(key, t); }
            else if (!byKey.has(key)) { byKey.set(key, t); }
        }
        const chosenByPath = new Map();
        for (const t of byKey.values()) {
            const existing = chosenByPath.get(t.path);
            if (!existing) chosenByPath.set(t.path, t);
            else { const rank = { records: 3, list: 2, kv: 1 }; chosenByPath.set(t.path, rank[t.kind] >= rank[existing.kind] ? t : existing); }
        }
        return Array.from(chosenByPath.values());
    }
    function buildRootTable(root, msgs) {
        if (Array.isArray(root)) {
            if (root.length === 0) return { kind: 'list', path: '$', columns: [msgs.contentLabel], rows: [] };
            const kinds = new Set(root.map(x => isPlainObject(x) ? 'obj' : Array.isArray(x) ? 'arr' : typeof x));
            if (kinds.size === 1 && kinds.has('obj')) {
                const columns = [...root.reduce((set, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set())].sort();
                const rows = root.map(r => { const row = {}; columns.forEach(k => { row[k] = r?.[k]; }); return row; });
                return { kind: 'records', path: '$', columns, rows };
            }
            return { kind: 'list', path: '$', columns: [msgs.contentLabel], rows: root.map(v => ({ [msgs.contentLabel]: v })) };
        } else if (isPlainObject(root)) {
            const grouped = groupColonKeys(root);
            const rows = Object.entries(grouped).map(([k, v]) => ({ key: k, value: v }));
            return { kind: 'kv', path: '$', columns: ['key', 'value'], rows };
        }
        return { kind: 'list', path: '$', columns: [msgs.contentLabel], rows: [{ [msgs.contentLabel]: root }] };
    }
    function buildTableElement(columns, rows, ctx) {
        const { nested = false, depth = 0, orientation = 'horizontal', allowHtml = false, scroll, classNames, msgs, singleItemInline } = ctx;
        const table = document.createElement('table');
        table.classList.add(cn('table', classNames));
        if (nested) table.classList.add(cn('nestedTable', classNames));
        if (orientation === 'vertical') table.classList.add('vertical');
        const thead = document.createElement('thead'); thead.classList.add(cn('thead', classNames));
        const tbody = document.createElement('tbody'); tbody.classList.add(cn('tbody', classNames));
        const trHead = document.createElement('tr'); trHead.classList.add(cn('tr', classNames));
        for (const c of columns) { const th = document.createElement('th'); th.classList.add(cn('th', classNames)); if (allowHtml) th.innerHTML = c; else th.textContent = c; trHead.appendChild(th); }
        thead.appendChild(trHead);
        for (const r of rows) {
            const tr = document.createElement('tr'); tr.classList.add(cn('tr', classNames));
            for (const c of columns) {
                const td = document.createElement('td'); td.classList.add(cn('td', classNames));
                const v = r[c];
                td.appendChild(buildValueNode(v, depth + 1, { allowHtml, scroll, layoutMode: ctx.layoutMode, msgs, singleItemInline, classNames }));
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(thead); table.appendChild(tbody);
        return table;
    }
    function buildValueNode(v, depth, ctx) {
        const { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames } = ctx;
        if (v === null || v === undefined) { const em = document.createElement('em'); em.className = 'null'; em.textContent = '—'; return em; }
        if (Array.isArray(v)) {
            if (v.length === 0) { const span = document.createElement('span'); span.className = 'pill'; span.textContent = '[]'; return span; }
            if (singleItemInline && v.length === 1) return buildValueNode(v[0], depth, ctx);
            const wrap = document.createElement('div'); wrap.className = 'nested-wrap';
            if (scroll?.enable) { wrap.style.maxHeight = `${scroll.maxHeight || 260}px`; wrap.style.overflow = 'auto'; }
            if (v.length === 1 && !singleItemInline) {
                const only = v[0];
                if (isPlainObject(only)) {
                    const flat = flattenObject(only);
                    const columns = Object.keys(flat);
                    const rows = [flat];
                    const orientation = 'horizontal';
                    wrap.appendChild(buildTableElement(columns, rows, { nested: true, depth, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                    return wrap;
                }
            }
            if (isPrimitiveArray(v)) {
                if (v.length === 1 && !singleItemInline) {
                    const baseColumns = [msgs.contentLabel];
                    const baseRows = [{ [msgs.contentLabel]: v[0] }];
                    const orientation = 'vertical';
                    wrap.appendChild(buildTableElement(baseColumns, baseRows, { nested: true, depth, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                } else {
                    const list = document.createElement('div'); list.className = cn('listPlain', classNames);
                    v.forEach(item => { const row = document.createElement('div'); row.className = cn('listItem', classNames); if (allowHtml && typeof item === 'string') row.innerHTML = item; else row.textContent = typeof item === 'string' ? item : String(item); list.appendChild(row); });
                    wrap.appendChild(list);
                }
                return wrap;
            }
            const kinds = new Set(v.map(x => isPlainObject(x) ? 'obj' : Array.isArray(x) ? 'arr' : typeof x));
            if (kinds.size === 1 && kinds.has('obj')) {
                const flatRows = v.map(r => flattenObject(r));
                const columns = [...flatRows.reduce((set, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set())].sort();
                const orientation = chooseOrientation('records', columns, flatRows, layoutMode);
                const oriented = orientData('records', columns, flatRows, orientation, msgs);
                wrap.appendChild(buildTableElement(oriented.columns, oriented.rows, { nested: true, depth, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
            } else {
                const baseColumns = [msgs.contentLabel]; const baseRows = v.map((item) => ({ [msgs.contentLabel]: item }));
                const orientation = chooseOrientation('list', baseColumns, baseRows, layoutMode);
                const oriented = orientData('list', baseColumns, baseRows, orientation, msgs);
                wrap.appendChild(buildTableElement(oriented.columns, oriented.rows, { nested: true, depth, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
            }
            return wrap;
        }
        if (isPlainObject(v)) {
            const grouped = groupColonKeys(v);
            if (isFlatObject(grouped)) {
                const entries = Object.entries(grouped);
                if (singleItemInline) {
                    const wrap = document.createElement('div');
                    for (const [k, val] of entries) {
                        const row = document.createElement('div'); row.className = cn('kvRow', classNames);
                        const title = document.createElement('div'); title.className = cn('kvTitle', classNames);
                        if (allowHtml) title.innerHTML = k; else title.textContent = k;
                        const content = document.createElement('div'); content.className = cn('kvContent', classNames);
                        content.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                        row.appendChild(title); row.appendChild(content);
                        wrap.appendChild(row);
                    }
                    return wrap;
                } else {
                    const container = document.createElement('div'); container.className = cn('sections', classNames);
                    for (const [k, val] of entries) {
                        const sec = document.createElement('div'); sec.className = cn('section', classNames);
                        const header = document.createElement('div'); header.className = cn('sectionHeader', classNames);
                        if (allowHtml) header.innerHTML = k; else header.textContent = k;
                        const body = document.createElement('div'); body.className = cn('sectionBody', classNames);
                        body.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                        sec.appendChild(header); sec.appendChild(body); container.appendChild(sec);
                    }
                    return container;
                }
            }
            const entries = Object.entries(grouped);
            const primitives = entries.filter(([_, val]) => !Array.isArray(val) && !isPlainObject(val));
            const complexes = entries.filter(([_, val]) => Array.isArray(val) || isPlainObject(val));
            const container = document.createElement('div'); container.className = cn('sections', classNames);
            if (primitives.length > 0) {
                if (singleItemInline) {
                    for (const [k, val] of primitives) {
                        const row = document.createElement('div'); row.className = cn('kvRow', classNames);
                        const title = document.createElement('div'); title.className = cn('kvTitle', classNames);
                        if (allowHtml) title.innerHTML = k; else title.textContent = k;
                        const content = document.createElement('div'); content.className = cn('kvContent', classNames);
                        content.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                        row.appendChild(title); row.appendChild(content);
                        container.appendChild(row);
                    }
                } else {
                    for (const [k, val] of primitives) {
                        const sec = document.createElement('div'); sec.className = cn('section', classNames);
                        const header = document.createElement('div'); header.className = cn('sectionHeader', classNames);
                        if (allowHtml) header.innerHTML = k; else header.textContent = k;
                        const body = document.createElement('div'); body.className = cn('sectionBody', classNames);
                        body.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                        sec.appendChild(header); sec.appendChild(body); container.appendChild(sec);
                    }
                }
            }
            for (const [k, val] of complexes) {
                const sec = document.createElement('div'); sec.className = cn('section', classNames);
                const header = document.createElement('div'); header.className = cn('sectionHeader', classNames);
                if (allowHtml) header.innerHTML = k; else header.textContent = k;
                const body = document.createElement('div'); body.className = cn('sectionBody', classNames);
                // If value is a single-key flat object and inline is on, render inline "k2: v2"
                if (singleItemInline && isPlainObject(val)) {
                    const grouped2 = groupColonKeys(val);
                    const entries2 = Object.entries(grouped2);
                    if (entries2.length === 1 && isFlatObject(grouped2)) {
                        const [k2, v2] = entries2[0];
                        const row = document.createElement('div'); row.className = cn('kvRow', classNames);
                        const title = document.createElement('div'); title.className = cn('kvTitle', classNames);
                        if (allowHtml) title.innerHTML = k2; else title.textContent = k2;
                        const content = document.createElement('div'); content.className = cn('kvContent', classNames);
                        content.appendChild(buildValueNode(v2, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                        row.appendChild(title); row.appendChild(content);
                        body.appendChild(row);
                    } else {
                        body.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                    }
                } else {
                    body.appendChild(buildValueNode(val, depth + 1, { allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
                }
                sec.appendChild(header); sec.appendChild(body); container.appendChild(sec);
            }
            return container;
        }
        const span = document.createElement('span');
        if (typeof v === 'string') { if (allowHtml) span.innerHTML = v; else span.textContent = v; }
        else if (typeof v === 'number') span.textContent = String(v);
        else if (typeof v === 'boolean') span.textContent = v ? ((msgs && msgs.trueLabel) || 'true') : ((msgs && msgs.falseLabel) || 'false');
        else { span.className = 'pill'; span.textContent = JSON.stringify(v); }
        return span;
    }
    function renderSingle(container, data, options) {
        const { layoutMode = 'auto', allowHtml = false, scroll, lang = 'zh', messages, singleItemInline = true, cssVars, classNames, className } = options || {};
        const msgs = messages || defaultMessages[lang] || defaultMessages.zh;
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = className || '';
        if (cssVars) { for (const [k, v] of Object.entries(cssVars)) root.style.setProperty(k, v); }
        const t = buildRootTable(data, msgs);
        const orientation = chooseOrientation(t.kind, t.columns, t.rows, layoutMode);
        const oriented = orientData(t.kind, t.columns, t.rows, orientation, msgs);
        const card = document.createElement('div'); card.className = cn('card', classNames);
        const wrap = document.createElement('div'); wrap.className = cn('tableWrap', classNames);
        wrap.appendChild(buildTableElement(oriented.columns, oriented.rows, { nested: false, depth: 0, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
        card.appendChild(wrap); root.appendChild(card); container.appendChild(root);
    }
    function renderMulti(container, data, options) {
        const { layoutMode = 'auto', allowHtml = false, scroll, selectedPaths, lang = 'zh', messages, singleItemInline = true, cssVars, classNames, className } = options || {};
        const msgs = messages || defaultMessages[lang] || defaultMessages.zh;
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = className || '';
        if (cssVars) { for (const [k, v] of Object.entries(cssVars)) root.style.setProperty(k, v); }
        const tables = collectTables(data, msgs);
        let rendered = 0;
        for (const t of tables) {
            if (selectedPaths && !selectedPaths.has(t.path)) continue;
            const orientation = chooseOrientation(t.kind, t.columns, t.rows, layoutMode);
            const oriented = orientData(t.kind, t.columns, t.rows, orientation, msgs);
            const card = document.createElement('div'); card.className = cn('card', classNames);
            const wrap = document.createElement('div'); wrap.className = cn('tableWrap', classNames);
            wrap.appendChild(buildTableElement(oriented.columns, oriented.rows, { nested: false, depth: 0, orientation, allowHtml, scroll, layoutMode, msgs, singleItemInline, classNames }));
            card.appendChild(wrap); root.appendChild(card); rendered++;
        }
        if (rendered === 0) {
            const card = document.createElement('div'); card.className = cn('card', classNames);
            const wrap = document.createElement('div'); wrap.className = cn('tableWrap', classNames);
            const empty = document.createElement('div'); empty.style.padding = '12px'; empty.style.color = '#9ca3af'; empty.textContent = msgs.noTables;
            wrap.appendChild(empty); card.appendChild(wrap); root.appendChild(card);
        }
        container.appendChild(root);
        return tables;
    }
    function render(container, data, options) {
        const { view = 'single' } = options || {};
        if (view === 'single') renderSingle(container, data, options);
        else renderMulti(container, data, options);
    }
    function discover(data) { return collectTables(data, defaultMessages.zh); }
    const themes = {
        dark: {
            '--bg': '#0f172a', '--panel': '#111827', '--muted': '#9ca3af', '--text': '#e5e7eb',
            '--accent': '#22c55e', '--accent-2': '#3b82f6', '--border': '#1f2937', '--chip': '#0b1220',
            '--jtx-header-bg': '#0d1526', '--jtx-row-odd': '#0b1220', '--jtx-row-even': '#0c172a',
            '--jtx-pill-bg': '#132036', '--jtx-pill-border': '#1c2b4b', '--jtx-pill-text': '#9cc3ff'
        },
        light: {
            '--bg': '#ffffff', '--panel': '#ffffff', '--muted': '#6b7280', '--text': '#0f172a',
            '--accent': '#16a34a', '--accent-2': '#2563eb', '--border': '#e5e7eb', '--chip': '#f8fafc',
            '--jtx-header-bg': '#f1f5f9', '--jtx-row-odd': '#ffffff', '--jtx-row-even': '#f8fafc',
            '--jtx-pill-bg': '#eef2ff', '--jtx-pill-border': '#e0e7ff', '--jtx-pill-text': '#334155'
        },
        compact: {
            '--chip': '#0b1220', '--border': '#1f2937'
        }
    };
    global.JsonTableX = { render, discover, themes };
    global.JsonTablePlugin = global.JsonTableX;
})(window);
