/* MIM theme interactions — tiny, dependency-free, deferred */
(function () {
  window.mimReady = true;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll ---------- */
  function initReveal(root) {
    var els = (root || document).querySelectorAll('.mim-r:not(.is-in)');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    /* anything already on screen shows instantly; only content below the fold animates in */
    var vh = window.innerHeight || 800;
    els = Array.prototype.filter.call(els, function (e) { if (e.getBoundingClientRect().top < vh) { e.classList.add('is-in'); return false; } return true; });
    document.documentElement.classList.add('mim-rv');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- hero print slideshow ---------- */
  function initHero(hero) {
    if (hero.dataset.ready) return;
    hero.dataset.ready = '1';
    var slides = hero.querySelectorAll('.mim-hero__slide');
    var tabs = hero.querySelectorAll('.mim-hero__tab');
    if (slides.length < 2) return;
    var i = 0, timer = null, ms = (+hero.dataset.interval || 6) * 1000, paused = false;
    function go(n, user) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      tabs.forEach(function (t, k) {
        t.classList.remove('is-active'); void t.offsetWidth;
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      var active = tabs[i];
      if (active && active.parentNode.scrollWidth > active.parentNode.clientWidth) {
        active.parentNode.scrollTo({ left: active.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      }
      // load lazy images of the next slide early
      var nxt = slides[(i + 1) % slides.length];
      nxt.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
      restart();
    }
    function restart() { clearTimeout(timer); if (!paused && !reduce) timer = setTimeout(function () { go(i + 1); }, ms); }
    function pause(p) { paused = p; hero.classList.toggle('is-paused', p); if (p) clearTimeout(timer); else restart(); }
    tabs.forEach(function (t) { t.addEventListener('click', function () { go(+t.dataset.go, true); }); });
    hero.addEventListener('mouseenter', function () { pause(true); });
    hero.addEventListener('mouseleave', function () { pause(false); });
    hero.addEventListener('focusin', function () { pause(true); });
    hero.addEventListener('focusout', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });
    // swipe
    var x0 = null, y0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        var rtl = document.documentElement.dir === 'rtl';
        go(i + ((dx < 0) !== rtl ? 1 : -1), true);
      }
      x0 = null;
    }, { passive: true });
    if (reduce) hero.classList.add('is-paused');
    restart();
  }

  /* ---------- shop-by-print tabs ---------- */
  function initTabs(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = '1';
    var tabs = root.querySelectorAll('[data-tab]'), panels = root.querySelectorAll('[data-panel]');
    function show(n) {
      tabs.forEach(function (t) { var on = t.dataset.tab === String(n); t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      panels.forEach(function (p) {
        var on = p.dataset.panel === String(n);
        p.hidden = !on;
        if (on) { initReveal(p); p.querySelectorAll('[data-mim-rail]').forEach(initRail); }
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var list = Array.prototype.slice.call(tabs), k = list.indexOf(t), rtl = document.documentElement.dir === 'rtl';
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        if (rtl) dir = -dir;
        var nt = list[(k + dir + list.length) % list.length]; nt.focus(); nt.click();
      });
    });
  }

  /* ---------- rails ---------- */
  function initRail(rail) {
    if (rail.dataset.ready) return;
    var track = rail.querySelector('[data-rail-track]');
    if (!track) return;
    rail.dataset.ready = '1';
    var scope = rail.closest('.mim-railsec') || rail;
    var prev = scope.querySelector('[data-rail-prev]'), next = scope.querySelector('[data-rail-next]');
    var rtl = document.documentElement.dir === 'rtl';
    function step() { var c = track.children[0]; return c ? (c.getBoundingClientRect().width + 16) * 2 : 300; }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2, pos = Math.abs(track.scrollLeft);
      if (prev) prev.disabled = pos <= 2;
      if (next) next.disabled = pos >= max;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: rtl ? step() : -step() }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: rtl ? -step() : step() }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- language pill: header + mobile drawer ---------- */
  function placeLang() {
    var tpl = document.getElementById('MimLangTemplate');
    if (!tpl) return;
    var icons = document.querySelector('.header__icons');
    if (icons && !icons.querySelector('.mim-lang')) icons.insertBefore(tpl.content.cloneNode(true), icons.firstChild);
    var util = document.querySelector('.menu-drawer__utility-links');
    if (util && !util.querySelector('.mim-lang')) {
      var node = tpl.content.cloneNode(true);
      var wrap = node.querySelector('.mim-lang');
      if (wrap) wrap.classList.add('mim-lang--drawer');
      util.insertBefore(node, util.firstChild);
    }
  }

  /* ---------- header shadow on scroll ---------- */
  function initScroll() {
    var on = false;
    window.addEventListener('scroll', function () {
      var s = window.scrollY > 10;
      if (s !== on) { on = s; document.documentElement.classList.toggle('mim-scrolled', s); }
    }, { passive: true });
  }

  /* ---------- sticky add-to-cart on product pages (mobile) ---------- */
  function initSticky() {
    var btn = document.querySelector('.product-form__submit');
    var title = document.querySelector('.product__title h1, .product__title h2');
    if (!btn || !title || !('IntersectionObserver' in window)) return;
    var bar = document.createElement('div');
    bar.className = 'mim-sticky';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="mim-sticky__info"><p class="mim-sticky__title"></p><p class="mim-sticky__price"></p></div><button type="button" class="mim-btn mim-btn--solid" tabindex="-1"></button>';
    document.body.appendChild(bar);
    var bTitle = bar.querySelector('.mim-sticky__title'), bPrice = bar.querySelector('.mim-sticky__price'), bBtn = bar.querySelector('button');
    function sync() {
      var real = document.querySelector('.product-form__submit');
      var price = document.querySelector('.product__info-container .price-item--sale:not(:empty), .product__info-container .price-item--regular');
      bTitle.textContent = title.textContent.trim();
      bPrice.textContent = price ? price.textContent.trim() : '';
      bBtn.textContent = real ? real.textContent.trim() : '';
      bBtn.disabled = !real || real.disabled;
    }
    sync();
    bBtn.addEventListener('click', function () {
      var real = document.querySelector('.product-form__submit');
      if (real && !real.disabled) real.click();
      else document.querySelector('variant-selects, .product-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    var io = new IntersectionObserver(function (en) {
      var hidden = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      bar.classList.toggle('is-on', hidden);
      if (hidden) sync();
    });
    io.observe(btn.closest('.product-form') || btn);
    document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('variant-selects')) setTimeout(sync, 600); });
  }


  /* ---------- money ---------- */
  function money(cents, fmt) {
    fmt = fmt || '{{amount}}';
    function f(n, d, ts, ds) { n = (n / 100).toFixed(d); var p = n.split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts) + (p[1] && +p[1] ? ds + p[1] : ''); }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) {
      if (k === 'amount_no_decimals') return f(cents, 0, ',', '.');
      if (k === 'amount_with_comma_separator') return f(cents, 2, '.', ',');
      if (k === 'amount_no_decimals_with_comma_separator') return f(cents, 0, '.', ',');
      return f(cents, 2, ',', '.');
    });
  }

  /* ---------- frequently bought together (v2: tiles, colour dots / selects, item count) ---------- */
  function initFbt(root) {
    if (root.dataset.ready) return; root.dataset.ready = '1';
    var i18n = {}; try { i18n = JSON.parse(root.querySelector('[data-fbt-i18n]').textContent); } catch (e) {}
    var items = root.querySelectorAll('[data-fbt-item]'), totalEl = root.querySelector('[data-fbt-total]');
    var countEl = root.querySelector('[data-fbt-count]');
    var btn = root.querySelector('[data-fbt-add]'), msg = root.querySelector('[data-fbt-msg]');
    function hid(it) { return it.querySelector('[data-fbt-variant]'); }
    function countText(n) {
      if (!n) return i18n.none || '';
      if (n === 1) return i18n.one || '1';
      if (n === 2 && i18n.two) return i18n.two;
      return (i18n.many || '{n}').replace('{n}', n);
    }
    function update() {
      var sum = 0, n = 0;
      items.forEach(function (it) {
        var on = it.querySelector('[data-fbt-check]').checked; it.classList.toggle('is-off', !on);
        var o = hid(it); if (on && o && o.value) { sum += +o.dataset.price || 0; n++; }
      });
      totalEl.textContent = money(sum, i18n.money); btn.disabled = n === 0;
      if (countEl) countEl.textContent = countText(n);
    }
    root.addEventListener('change', function (e) { if (e.target.matches('[data-fbt-check]')) update(); });
    items.forEach(function (it) {
      var data = it.querySelector('[data-fbt-variants]'); if (!data) return;
      var vs = []; try { vs = JSON.parse(data.textContent); } catch (e) { return; }
      var h = hid(it), priceEl = it.querySelector('[data-fbt-price]'), cname = it.querySelector('[data-fbt-cname]');
      function current() {
        var want = [];
        it.querySelectorAll('select[data-fbt-opt]').forEach(function (x) { want[+x.dataset.fbtOpt] = x.value; });
        it.querySelectorAll('button[data-fbt-opt].is-on').forEach(function (x) { want[+x.dataset.fbtOpt] = x.dataset.val; });
        return want;
      }
      function show(v) {
        it.querySelectorAll('select[data-fbt-opt]').forEach(function (x) { x.value = v.o[+x.dataset.fbtOpt]; });
        it.querySelectorAll('button[data-fbt-opt]').forEach(function (x) {
          var on = v.o[+x.dataset.fbtOpt] === x.dataset.val; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on);
          if (on && cname) cname.textContent = x.dataset.label || x.dataset.val;
        });
        h.value = v.id; h.dataset.price = v.price;
        if (priceEl) priceEl.innerHTML = v.cmp > v.price ? '<span class="mim-price-sale">' + money(v.price, i18n.money) + '</span> <s class="mim-price-old">' + money(v.cmp, i18n.money) + '</s>' : money(v.price, i18n.money);
        update();
      }
      function pick(idx, val) {
        var want = current(); want[idx] = val;
        var hit = vs.filter(function (v) { return v.ok && v.o.every(function (o, i) { return want[i] === undefined || want[i] === o; }); })[0]
          || vs.filter(function (v) { return v.ok && v.o[idx] === val; })[0];
        if (hit) show(hit);
      }
      it.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-fbt-opt]'); if (!b || b.disabled) return;
        pick(+b.dataset.fbtOpt, b.dataset.val);
      });
      it.addEventListener('change', function (e) {
        var s = e.target.closest('select[data-fbt-opt]'); if (s) pick(+s.dataset.fbtOpt, s.value);
      });
    });
    btn.addEventListener('click', function () {
      var list = [];
      items.forEach(function (it) { if (it.querySelector('[data-fbt-check]').checked) { var o = hid(it); if (o && o.value) list.push({ id: +o.value, quantity: 1 }); } });
      if (!list.length) return;
      btn.disabled = true; btn.classList.add('is-loading'); msg.textContent = '';
      var drawer = document.querySelector('cart-drawer');
      var body = { items: list };
      if (drawer && drawer.getSectionsToRender) { body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; }); body.sections_url = window.location.pathname; }
      fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); })
        .then(function (j) {
          msg.textContent = i18n.added || 'Added';
          if (drawer && j.sections) { j.id = list[0].id; drawer.classList.remove('is-empty'); drawer.renderContents(j); }
          else window.location.href = (window.routes && routes.cart_url) || '/cart';
          if (window.publish && window.PUB_SUB_EVENTS) publish(PUB_SUB_EVENTS.cartUpdate, { source: 'mim-fbt' });
        })
        .catch(function (e) { msg.textContent = (e && e.description) || i18n.error || 'Error'; })
        .finally(function () { btn.disabled = false; btn.classList.remove('is-loading'); });
    });
    /* phone: the FBT bar has its own sticky button, so hide the product sticky bar while the block is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { document.body.classList.toggle('mfb-in', en.isIntersecting); }); }).observe(root);
    }
    update();
  }

  /* ---------- sale pop-up (once per session) ---------- */
  function initSalePop() {
    var pop = document.getElementById('MimSalePop');
    if (!pop) return;
    var k = 'mim_sale_pop'; try { if (sessionStorage.getItem(k)) return; } catch (e) {}
    function close() { pop.classList.remove('is-open'); pop.setAttribute('aria-hidden', 'true'); try { sessionStorage.setItem(k, '1'); } catch (e) {} }
    pop.querySelectorAll('[data-pop-close]').forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    setTimeout(function () { pop.classList.add('is-open'); pop.setAttribute('aria-hidden', 'false'); }, 3500);
  }

  function initAll(root) {
    initReveal(root);
    (root || document).querySelectorAll('[data-mim-hero]').forEach(initHero);
    (root || document).querySelectorAll('[data-mim-tabs]').forEach(initTabs);
    (root || document).querySelectorAll('[data-mim-rail]').forEach(function (r) { if (!r.closest('[hidden]')) initRail(r); });
    (root || document).querySelectorAll('[data-mim-fbt]').forEach(initFbt);
  }


  /* ---------- Title Case for product names typed in ALL CAPS (future products) ---------- */
  var KEEP = /^(MIM|XS|S|M|L|XL|XXL|XXXL|ABC|ATC|ABP|CUH|ATP|AST|ASB)$/, SMALL = /^(and|or|of|the|in|on|with|for|to|at|by)$/;
  function tcWord(w, first) {
    return w.split('-').map(function (p, j) {
      if (!p) return p;
      if (/\d/.test(p) || KEEP.test(p)) return p;
      var l = p.toLowerCase();
      if (!first && j === 0 && SMALL.test(l)) return l;
      if (l === 'cm' || l === 'mm') return l;
      return l.charAt(0).toUpperCase() + l.slice(1);
    }).join('-');
  }
  function titleCase(root) {
    (root || document).querySelectorAll('.product__title h1, .product__title h2, .mim-sticky__title, .cart-item__name, .mim-crumbs [aria-current]').forEach(function (el) {
      if (el.children.length) return;
      var t = el.textContent.trim();
      if (!/[A-Z]{2}/.test(t) || t !== t.toUpperCase()) return;
      el.textContent = t.split(/\s+/).map(function (w, i) { return tcWord(w, i === 0); }).join(' ');
    });
  }

  /* ---------- pause looping animations while off screen ---------- */
  function initOffscreen(root) {
    if (!('IntersectionObserver' in window)) return;
    var io = initOffscreen.io || (initOffscreen.io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); });
    }));
    (root || document).querySelectorAll('.mim-marquee, [data-mim-mega], [data-mim-hero], [data-mab-anim]').forEach(function (el) {
      if (el.dataset.offObs) return; el.dataset.offObs = '1'; io.observe(el);
    });
  }

  function boot() {
    initOffscreen();
    titleCase();
    placeLang();
    initAll(document);
    initScroll();
    initSticky();
    initSalePop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // theme editor support
  document.addEventListener('shopify:section:load', function (e) { placeLang(); initAll(e.target); initOffscreen(e.target); });
})();
