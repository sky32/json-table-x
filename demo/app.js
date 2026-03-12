const $ = (s) => document.querySelector(s);
const input = $('#input'), out = $('#out');
const styleLink = document.getElementById('styleLink');
function loadExample() {
    const d = {
        users: [
            { id: 1, name: 'Alice', profile: { age: 28, city: 'Shanghai' }, tags: ['pro', 'beta'] },
            { id: 2, name: 'Bob', profile: { age: 35, city: 'Beijing' }, active: true }
        ],
        meta: { version: '1.0.0' },
        tags: { dangerOrder: true, NewExpressArrival: true }
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

['view','theme','layout','lang'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', renderNow);
});
['allowHtml','single','scroll'].forEach(id => {
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
