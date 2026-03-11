const $ = (s) => document.querySelector(s);
const input = $('#input'), out = $('#out');
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
$('#render').onclick = () => {
    const data = JSON.parse(input.value);
    JsonTableX.render(out, data, {
        view: $('#view').value,
        layoutMode: $('#layout').value,
        lang: $('#lang').value,
        allowHtml: $('#allowHtml').checked,
        singleItemInline: $('#single').checked,
    scroll: { enable: $('#scroll').checked, maxHeight: parseInt($('#height').value || '260', 10) },
    cssVars: (JsonTableX.themes[$('#theme').value] || undefined)
    });
};
if (!input.value.trim()) loadExample();
