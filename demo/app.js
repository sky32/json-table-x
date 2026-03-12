const $ = (s) => document.querySelector(s);
const input = $('#input'), out = $('#out');
const styleLink = document.getElementById('styleLink');
function loadExample() {
  const d = {
    meta: {
      traceId: 'tr_01HXY7K9J4X8E8K3Q4R5S6T7U8',
      generatedAt: '2026-03-12T03:00:00.000Z',
      env: 'prod',
      flags: {
        'exp:layout': 'auto',
        'exp:render:allowHtml': false,
        'ui:compact': true
      }
    },
    summary: {
      ok: true,
      ratio: 0.8125,
      count: 123456,
      nullExample: null,
      emptyObject: {},
      emptyArray: []
    },
    users: [
      {
        id: 1,
        name: 'Alice',
        active: true,
        profile: { age: 28, city: 'Shanghai', contact: { email: 'alice@example.com', phone: '+86-13800000000' } },
        tags: ['pro', 'beta', 'vip'],
        metrics: [
          { day: '2026-03-10', pv: 12, uv: 7 },
          { day: '2026-03-11', pv: 9, uv: 6 },
          { day: '2026-03-12', pv: 20, uv: 11 }
        ]
      },
      {
        id: 2,
        name: 'Bob',
        active: false,
        profile: { age: 35, city: 'Beijing' },
        roles: ['admin'],
        notes: '多行文本测试：\nline1\nline2\nline3'
      }
    ],
    order: {
      id: 'ord_20260312_0001',
      status: 'PAID',
      amount: { currency: 'CNY', total: 199.9, discount: 20, pay: 179.9 },
      shipping: {
        address: {
          country: 'CN',
          province: 'Zhejiang',
          city: 'Hangzhou',
          district: 'Xihu',
          street: 'No. 1 Road',
          zip: '310000'
        },
        timeline: [
          { at: '2026-03-12T01:00:00Z', state: 'created' },
          { at: '2026-03-12T01:05:00Z', state: 'paid' },
          { at: '2026-03-12T02:30:00Z', state: 'packed' }
        ]
      },
      items: [
        { sku: 'SKU-001', name: 'Keyboard', price: 99.9, qty: 1, attrs: { 'spec:color': 'black', 'spec:layout': 'US' } },
        { sku: 'SKU-002', name: 'Mouse', price: 50, qty: 2, attrs: { 'spec:dpi': 1600, 'spec:wireless': true } }
      ]
    },
    mixedArray: [
      1,
      'str',
      true,
      null,
      { a: 1, b: { c: 2 } },
      [1, 2, { x: 3 }]
    ],
    htmlLike: {
      title: '<b>HTML 测试</b>',
      link: '<a href="https://example.com" target="_blank">example.com</a>'
    },
    deep: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                key: 'deep value',
                list: [
                  { n: 1, v: { a: 'x', b: 'y' } },
                  { n: 2, v: { a: 'x2', b: 'y2', c: { d: 'z' } } }
                ]
              }
            }
          }
        }
      }
    }
  };
  input.value = JSON.stringify(d, null, 2);
}
$('#example').onclick = loadExample;
$('#example').onclick = loadExample;

function currentOpts() {
  const enableScroll = $('#scroll').checked;
  const h = parseInt($('#height').value || '260', 10);
  return {
    view: $('#view').value,
    className: 'jtx',
    layoutMode: $('#layout').value,
    lang: $('#lang').value,
    allowHtml: $('#allowHtml').checked,
    singleItemInline: $('#single').checked,
    scroll: { enable: enableScroll, maxHeight: Math.max(60, isNaN(h) ? 260 : h) },
    cssVars: (JsonTableX.themes[$('#theme').value] || undefined)
  };
}
function renderNow() {
  try {
    const data = JSON.parse(input.value);
    JsonTableX.render(out, data, currentOpts());
  } catch (e) {
    // ignore parse error during typing
  }
}
$('#render').onclick = renderNow;

['view', 'theme', 'layout', 'lang'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', renderNow);
});
['allowHtml', 'single', 'scroll'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', renderNow);
});
const heightEl = document.getElementById('height');
if (heightEl) {
  heightEl.addEventListener('input', renderNow);
  heightEl.addEventListener('change', renderNow);
}
const enableCssEl = document.getElementById('enableCss');
if (enableCssEl && styleLink) {
  const renderStyle = document.getElementById('renderStyle');
  const applyCssToggle = () => {
    styleLink.disabled = !enableCssEl.checked;
    if (renderStyle) renderStyle.disabled = !enableCssEl.checked;
  };
  enableCssEl.addEventListener('change', () => { applyCssToggle(); });
  applyCssToggle();
}
if (!input.value.trim()) loadExample();
renderNow();
