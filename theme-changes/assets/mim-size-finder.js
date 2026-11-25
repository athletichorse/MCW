/* MIM Find My Size v2 — interactive female fit finder (no dependencies) */
(function () {
if (customElements.get('mim-size-finder')) return;
var STORE_KEY = 'mim_fit_profile_v1';
var ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL'];
var ALIAS = { '2XL': 'XXL', '3XL': 'XXXL', 'XXS': 'XS', 'XXXXL': '4XL', 'SMALL': 'S', 'MEDIUM': 'M', 'LARGE': 'L', 'FREESIZE': 'FREE' };
var NUM = { '1': 1.5, '2': 3.5, '3': 5.5, '4': 7 };
var CHART = {
bust:  [82, 86, 91, 97, 103, 109, 115, 121],
waist: [64, 68, 73, 79, 85, 91, 97, 103],
hips:  [90, 94, 99, 105, 111, 117, 123, 129]
};
function sizeIdx(v) { var k = norm(v); if (NUM.hasOwnProperty(k)) return NUM[k]; return ORDER.indexOf(k); }
function fitDist(sz, t) { var d = Math.abs(sz.idx - t); return sz.idx % 1 ? Math.max(0, d - 0.5) : d; }
function chartAt(d, i) { var r = CHART[d], a = Math.floor(i), b = Math.min(a + 1, r.length - 1), f = i - a; return r[a] + (r[b] - r[a]) * f; }
var DIMS = {
top:    { bust: 1, waist: 0.75 },
dress:  { bust: 1, waist: 0.85, hips: 0.9 },
bottom: { waist: 1, hips: 1 }
};
function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
function writeStore(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function norm(v) { var k = String(v).toUpperCase().replace(/\s+/g, ''); return ALIAS[k] || k; }
function estimate(p) {
var h = p.h, bmi = p.w / Math.pow(h / 100, 2), dh = h - 165;
return {
bust:  43 + 1.9 * bmi + 0.12 * dh + (p.bust > 0 ? 5 : p.bust < 0 ? -4 : 0),
waist: 24 + 2.1 * bmi + 0.10 * dh + (p.stomach > 0 ? 6 : p.stomach < 0 ? -4 : 0),
hips:  49 + 2.0 * bmi + 0.20 * dh + (p.hips > 0 ? 6 : p.hips < 0 ? -4 : 0),
height: h
};
}
function indexFor(row, m) {
if (m <= row[0]) return (m - row[0]) / (row[1] - row[0]);
for (var i = 0; i < row.length - 1; i++) if (m <= row[i + 1]) return i + (m - row[i]) / (row[i + 1] - row[i]);
var n = row.length - 1;
return n + (m - row[n]) / (row[n] - row[n - 1]);
}
function recommend(p, garment) {
var body = estimate(p), dims = DIMS[garment] || DIMS.top;
var ease = p.fit > 0 ? 3.5 : p.fit < 0 ? -2.5 : 0, target = -Infinity;
Object.keys(dims).forEach(function (d) {
var w = indexFor(CHART[d], body[d] + ease) - (1 - dims[d]) * 0.6;
if (w > target) target = w;
});
target = clamp(target, -0.49, ORDER.length - 0.51);
var idx = Math.round(target);
return { body: body, target: target, idx: idx, frac: target - idx };
}
function markPicker(optionName, value) {
setTimeout(function () { markNow(optionName, value); }, 0);
}
function markNow(optionName, value) {
document.querySelectorAll('variant-selects input[type="radio"]').forEach(function (input) {
var label = document.querySelector('label[for="' + input.id + '"]');
if (!label) return;
var match = (input.dataset.optionName || '').toLowerCase() === (optionName || '').toLowerCase() && input.value === value;
label.classList.toggle('mim-rec', match);
});
}
class MimSizeFinder extends HTMLElement {
setGarment(g) { this.garment = g; if (this.state) { this.update(); if (readStore()) this.renderTrigger(); } }
connectedCallback() {
if (this._ready) return;
this._ready = true;
var self = this;
this.garment = this.dataset.garment || 'top';
this.optionName = this.dataset.optionName;
this.i18n = JSON.parse(this.querySelector('[data-mim-i18n]').textContent);
var dec = document.createElement('textarea');
Object.keys(this.i18n).forEach(function (k) { dec.innerHTML = self.i18n[k]; self.i18n[k] = dec.value; }); // the t filter HTML-escapes apostrophes (You&#39;re)
var raw = JSON.parse(this.querySelector('[data-mim-sizes]').textContent);
this.sizes = raw.map(function (v) { return { value: v, idx: sizeIdx(v) }; })
.filter(function (s) { return s.idx > -1; })
.sort(function (a, b) { return a.idx - b.idx; });
document.querySelectorAll('body > .mim-sf__panel, body > .mim-sf__overlay').forEach(function (n) { n.remove(); });
this.panel = this.querySelector('[data-mim-panel]');
this.overlay = this.querySelector('[data-mim-overlay]');
document.body.appendChild(this.overlay);
document.body.appendChild(this.panel);
this.$ = function (s) { return self.panel.querySelector(s); };
this.$$ = function (s) { return self.panel.querySelectorAll(s); };
var saved = readStore();
this.state = Object.assign({ h: 165, w: 62, bust: 0, stomach: 0, hips: 0, fit: 0, uh: 'cm', uw: 'kg' }, saved || {});
this.step = 1;
this.preview = null;
this.querySelector('[data-mim-open]').addEventListener('click', function () { self.open(); });
this.$('[data-mim-close]').addEventListener('click', function () { self.close(); });
this.overlay.addEventListener('click', function () { self.close(); });
this.panel.addEventListener('keydown', function (e) {
if (e.key === 'Escape') self.close();
if (e.key === 'Tab') self.trap(e);
});
this.$('[data-mim-next]').addEventListener('click', function () { self.next(); });
this.$('[data-mim-back]').addEventListener('click', function () { self.back(); });
this.$('[data-mim-restart]').addEventListener('click', function () { self.go(1); });
var hr = this.$('[data-mim-height]'), wr = this.$('[data-mim-weight]');
hr.addEventListener('input', function () { self.state.h = +hr.value; self.update(); });
wr.addEventListener('input', function () { self.state.w = +wr.value; self.update(); });
this.$$('[data-mim-nudge]').forEach(function (b) {
var timer;
function bump() {
var key = b.dataset.mimNudge === 'height' ? 'h' : 'w', input = key === 'h' ? hr : wr;
self.state[key] = clamp(self.state[key] + (+b.dataset.dir), +input.min, +input.max);
self.update();
}
b.addEventListener('click', bump);
b.addEventListener('pointerdown', function () { timer = setInterval(bump, 140); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearInterval(timer); }); });
});
this.$$('[data-mim-unit-h]').forEach(function (b) { b.addEventListener('click', function () { self.state.uh = b.dataset.mimUnitH; self.update(); }); });
this.$$('[data-mim-unit-w]').forEach(function (b) { b.addEventListener('click', function () { self.state.uw = b.dataset.mimUnitW; self.update(); }); });
['bust', 'stomach', 'hips', 'fit'].forEach(function (k) {
self.$$('input[name="mim-' + k + '"]').forEach(function (r) {
r.checked = +r.value === self.state[k];
r.addEventListener('change', function () {
self.state[k] = +r.value;
self.update();
if (k === 'fit') setTimeout(function () { self.next(); }, 260);
});
});
});
var live = this.$('[data-mim-live-chips]');
this.sizes.forEach(function (sz) {
var s = document.createElement('span');
s.className = 'mim-sf__lchip';
s.textContent = sz.value;
s.dataset.idx = sz.idx;
live.appendChild(s);
});
this.update();
if (saved) this.renderTrigger();
}
open() {
this.lastFocus = document.activeElement;
this.overlay.hidden = false;
this.panel.hidden = false;
document.documentElement.classList.add('mim-sf-lock');
var self = this;
void this.panel.offsetWidth; // force layout so the transition runs
this.overlay.classList.add('is-open');
this.panel.classList.add('is-open');
this.go(readStore() ? 4 : 1);
setTimeout(function () { var c = self.$('[data-mim-close]'); if (c) c.focus({ preventScroll: true }); }, 80);
}
close() {
var self = this;
this.overlay.classList.remove('is-open');
this.panel.classList.remove('is-open');
document.documentElement.classList.remove('mim-sf-lock');
setTimeout(function () { self.overlay.hidden = true; self.panel.hidden = true; }, 380);
if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus({ preventScroll: true });
}
trap(e) {
var f = Array.prototype.filter.call(this.panel.querySelectorAll('button, input'), function (el) { return !el.disabled && el.offsetParent !== null; });
if (!f.length) return;
if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
}
go(n) {
this.step = n;
this.panel.dataset.step = n;
this.$$('[data-mim-step]').forEach(function (s) { s.hidden = +s.dataset.mimStep !== n; });
this.$$('[data-mim-bar]').forEach(function (b) { b.classList.toggle('is-done', +b.dataset.mimBar <= Math.min(n, 3)); });
this.$('[data-mim-back]').style.visibility = n === 1 ? 'hidden' : 'visible';
this.$('[data-mim-restart]').hidden = n !== 4;
var label = this.$('[data-mim-next-label]');
if (n === 3) label.textContent = this.i18n.see_result;
else if (n < 3) label.textContent = this.i18n.continue;
if (n === 4) { this.preview = null; this.renderResult(true); }
var body = this.panel.querySelector('.mim-sf__body');
if (body) body.scrollTop = 0;
}
next() {
if (this.step < 3) return this.go(this.step + 1);
if (this.step === 3) { writeStore(this.state); this.renderTrigger(); return this.go(4); }
this.applySize(this.preview != null ? this.preview : this.bestAvailable().value);
this.close();
}
back() { if (this.step > 1) this.go(this.step - 1); }
update() {
var s = this.state;
var hr = this.$('[data-mim-height]'), wr = this.$('[data-mim-weight]');
hr.value = s.h; wr.value = s.w;
var units = { cm: this.$('[data-mim-unit-h="cm"]').textContent, kg: this.$('[data-mim-unit-w="kg"]').textContent, lb: this.$('[data-mim-unit-w="lb"]').textContent };
var hOut = this.$('[data-mim-height-out]'), wOut = this.$('[data-mim-weight-out]');
if (s.uh === 'in') {
var tin = Math.round(s.h / 2.54);
hOut.innerHTML = Math.floor(tin / 12) + '<small>ft</small> ' + (tin % 12) + '<small>in</small>';
} else hOut.innerHTML = s.h + '<small>' + units.cm + '</small>';
wOut.innerHTML = s.uw === 'lb' ? Math.round(s.w * 2.2046) + '<small>' + units.lb + '</small>' : s.w + '<small>' + units.kg + '</small>';
this.$$('[data-mim-unit-h]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.mimUnitH === s.uh); });
this.$$('[data-mim-unit-w]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.mimUnitW === s.uw); });
[hr, wr].forEach(function (r) { r.style.setProperty('--mim-pct', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'); });
var g = this.$('[data-mim-body]');
if (g) {
var sx = clamp(0.8 + (s.w / Math.pow(s.h / 100, 2) - 21) * 0.025, 0.78, 1.35);
var sy = clamp(0.9 + (s.h - 165) * 0.004, 0.8, 1.06);
g.style.transform = 'scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
}
var rec = recommend(s, this.garment), best = this.bestAvailable(rec);
var el = this.$('[data-mim-live]');
if (el.textContent !== best.value) {
el.textContent = best.value;
el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
}
this.$$('.mim-sf__lchip').forEach(function (c) { c.classList.toggle('is-on', +c.dataset.idx === best.idx); });
}
bestAvailable(rec) {
rec = rec || recommend(this.state, this.garment);
var best = this.sizes[0], dist = Infinity;
this.sizes.forEach(function (sz) { var d = fitDist(sz, rec.target); if (d < dist) { dist = d; best = sz; } });
return Object.assign({ exact: dist <= 0.5, dist: dist }, best);
}
renderResult(animate) {
var self = this, rec = recommend(this.state, this.garment), best = this.bestAvailable(rec);
var shown = this.preview != null ? this.sizes.filter(function (s) { return s.value === self.preview; })[0] : best;
var match = clamp(Math.round(97 - fitDist(shown, rec.target) * 34), 35, 98);
this.$('[data-mim-result-size]').textContent = shown.value;
var ring = this.$('[data-mim-ring]'), C = 2 * Math.PI * 54;
ring.style.strokeDasharray = C;
if (animate) { ring.style.transition = 'none'; ring.style.strokeDashoffset = C; void ring.getBoundingClientRect(); ring.style.transition = ''; }
requestAnimationFrame(function () { ring.style.strokeDashoffset = C * (1 - match / 100); });
var mEl = this.$('[data-mim-match]');
if (animate) {
var t0 = performance.now();
(function tick(t) {
var k = Math.min(1, (t - t0) / 900);
mEl.textContent = Math.round(match * (1 - Math.pow(1 - k, 3))) + '%';
if (k < 1) requestAnimationFrame(tick);
})(t0);
} else mEl.textContent = match + '%';
this.$('[data-mim-confidence]').textContent = match >= 85 ? this.i18n.confident : this.i18n.close_match;
var chips = this.$('[data-mim-chips]');
chips.innerHTML = '';
this.sizes.forEach(function (sz) {
var b = document.createElement('button');
b.type = 'button';
b.className = 'mim-sf__chip' + (sz.value === shown.value ? ' is-active' : '') + (sz.value === best.value ? ' is-best' : '');
b.textContent = sz.value;
b.setAttribute('aria-pressed', sz.value === shown.value ? 'true' : 'false');
b.addEventListener('click', function () { self.preview = sz.value; self.renderResult(false); });
chips.appendChild(b);
});
var body = rec.body, dims = DIMS[this.garment] || DIMS.top;
['bust', 'waist', 'hips'].forEach(function (d) {
var row = self.$('[data-mim-row="' + d + '"]');
row.hidden = !(d in dims);
var diff = body[d] - chartAt(d, shown.idx);
row.querySelector('[data-mim-dot]').style.setProperty('--pos', clamp(50 - (diff / 9) * 50, 4, 96) + '%');
});
this.$('[data-mim-row="length"] [data-mim-dot]').style.setProperty('--pos', clamp(50 - ((body.height - 165) / 22) * 50, 4, 96) + '%');
var note;
if (!best.exact && this.preview == null) note = this.i18n.note_unavail;
else if (shown.idx % 1 === 0 && Math.abs(rec.frac) > 0.32 && this.preview == null) note = rec.frac > 0 ? this.i18n.note_between_down : this.i18n.note_between_up;
else note = this.i18n.note_true;
this.$('[data-mim-note]').textContent = note;
this.$('[data-mim-next-label]').textContent = this.i18n.select_size.replace('[size]', shown.value);
}
renderTrigger() {
var rec = recommend(this.state, this.garment), best = this.bestAvailable(rec);
var match = clamp(Math.round(97 - fitDist(best, rec.target) * 34), 35, 98);
this.querySelector('[data-mim-trigger-label]').hidden = true;
var res = this.querySelector('[data-mim-trigger-result]');
res.hidden = false;
res.innerHTML = '<b>' + best.value + '</b> ' + this.i18n.your_size + ' · ' + match + '% ' + this.i18n.match;
markPicker(this.optionName, best.value);
this.dispatchEvent(new CustomEvent('mim:size', { bubbles: true, detail: { value: best.value, match: match } }));
}
applySize(value) {
var name = (this.optionName || '').toLowerCase(), done = false;
document.querySelectorAll('variant-selects input[type="radio"]').forEach(function (input) {
if (done || input.value !== value) return;
if (input.dataset.optionName && input.dataset.optionName.toLowerCase() !== name) return;
input.checked = true;
input.dispatchEvent(new Event('change', { bubbles: true }));
done = true;
});
if (!done) {
document.querySelectorAll('variant-selects select').forEach(function (sel) {
if (done) return;
for (var i = 0; i < sel.options.length; i++) {
if (sel.options[i].value === value) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); done = true; break; }
}
});
}
markPicker(this.optionName, this.bestAvailable().value);
var res = this.querySelector('[data-mim-trigger-result]');
this.querySelector('[data-mim-trigger-label]').hidden = true;
res.hidden = false;
res.innerHTML = this.i18n.selected.replace('[size]', '<b>' + value + '</b>');
this.dispatchEvent(new CustomEvent('mim:size', { bubbles: true, detail: { value: value } }));
}
}
customElements.define('mim-size-finder', MimSizeFinder);
document.addEventListener('change', function (e) {
if (!e.target.closest || !e.target.closest('variant-selects')) return;
var finder = document.querySelector('mim-size-finder');
if (!finder || !finder.state || !readStore()) return;
setTimeout(function () { markNow(finder.optionName, finder.bestAvailable().value); }, 700);
});
})();