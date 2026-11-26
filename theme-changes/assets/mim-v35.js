/* v3.5: infinite scroll for collection and search product grids (pagination stays in the markup for no-JS and SEO) */
(function(){
if(!('IntersectionObserver' in window)||!window.fetch)return;
var io=null,busy=false;
function host(){return document.getElementById('product-grid');}
function list(h){return h&&(h.matches('ul')?h:h.querySelector('ul.product-grid'));}
function nextUrl(scope){var w=scope.querySelector('.pagination-wrapper[data-next-url]');return w&&w.getAttribute('data-next-url');}
function setup(){
var h=host(),ul=list(h);if(!ul)return;
var scope=h.closest('.collection')||h;
if(io){io.disconnect();io=null;}
var old=document.querySelector('.mim-inf__more');if(old&&!scope.contains(old))old.remove();
if(!nextUrl(scope))return;
scope.classList.add('mim-inf');
var more=scope.querySelector('.mim-inf__more');
if(!more){more=document.createElement('div');more.className='mim-inf__more';more.setAttribute('role','status');more.innerHTML='<span class="mim-inf__spin" aria-hidden="true"></span>';scope.appendChild(more);}
io=new IntersectionObserver(function(es){if(es[0].isIntersecting)load(h,ul,scope,more);},{rootMargin:'0px 0px 900px 0px'});
io.observe(more);
}
function load(h,ul,scope,more){
var url=nextUrl(scope);if(busy||!url)return;busy=true;
var u=new URL(url,location.href);if(h.dataset.id)u.searchParams.set('section_id',h.dataset.id);
fetch(u.toString(),{credentials:'same-origin'}).then(function(r){if(!r.ok)throw r.status;return r.text();}).then(function(t){
var doc=new DOMParser().parseFromString(t,'text/html');
var nh=doc.getElementById('product-grid'),nul=list(nh);
if(nul){[].slice.call(nul.children).forEach(function(li){var n=document.importNode(li,true);n.classList.remove('scroll-trigger','animate--slide-in');n.querySelectorAll('.scroll-trigger').forEach(function(x){x.classList.remove('scroll-trigger');});ul.appendChild(n);});}
var ow=scope.querySelector('.pagination-wrapper'),nw=doc.querySelector('.pagination-wrapper');
if(ow){if(nw)ow.replaceWith(document.importNode(nw,true));else ow.removeAttribute('data-next-url');}
busy=false;
if(!nextUrl(scope)){if(io)io.disconnect();more.hidden=true;}
else{io.unobserve(more);io.observe(more);}
}).catch(function(){busy=false;if(io)io.disconnect();scope.classList.remove('mim-inf');more.hidden=true;});
}
function watch(){
setup();
var c=document.getElementById('ProductGridContainer');
if(c&&'MutationObserver' in window){new MutationObserver(function(){if(!document.querySelector('.mim-inf__more')||!document.querySelector('.mim-inf'))setup();}).observe(c,{childList:true,subtree:false});}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',watch):watch();
})();
/* v3.5: weather-aware shelf - pick warm / mild / cool from today's high temperature (Open-Meteo, no key) */
(function(){
/* the visitor's own country and local temperature (approximate IP location, no key); Cairo when the lookup fails */
var lang=(document.documentElement.lang||'en').slice(0,2);
function countryName(cc,fallback){try{return new Intl.DisplayNames([lang],{type:'region'}).of(cc)||fallback;}catch(e){return fallback;}}
function where(root){
var dflt={cc:'EG',name:countryName('EG',root.dataset.city||'Egypt'),lat:parseFloat(root.dataset.lat)||30.04,lon:parseFloat(root.dataset.lon)||31.24};
try{var g=JSON.parse(sessionStorage.getItem('mimgeo')||'null');if(g&&g.cc)return Promise.resolve({cc:g.cc,name:countryName(g.cc,g.cn),lat:g.lat,lon:g.lon});}catch(e){}
var slow=new Promise(function(res){setTimeout(function(){res(dflt);},2500);});
return Promise.race([slow,fetch('https://get.geojs.io/v1/ip/geo.json').then(function(r){return r.json();}).then(function(d){
var lat=parseFloat(d.latitude),lon=parseFloat(d.longitude),cc=(d.country_code||'').toUpperCase();
if(!cc||isNaN(lat)||isNaN(lon))return dflt;
try{sessionStorage.setItem('mimgeo',JSON.stringify({cc:cc,cn:d.country,lat:lat,lon:lon}));}catch(e){}
return {cc:cc,name:countryName(cc,d.country),lat:lat,lon:lon};
}).catch(function(){return dflt;})]);
}
function run(root){
if(root.dataset.wxReady)return;root.dataset.wxReady='1';
var touched=false;root.querySelectorAll('[data-tab]').forEach(function(t){t.addEventListener('click',function(e){if(e.isTrusted)touched=true;var p=root.querySelector('[data-panel="'+t.dataset.tab+'"]');var h=root.querySelector('[data-wx-heading]');if(p&&h&&p.dataset.line)h.textContent=p.dataset.line;});});
where(root).then(function(loc){
function apply(max,now){
var s=max>=29?'warm':(max>=21?'mild':'cool');
var chip=root.querySelector('[data-wx-chip]');
if(chip){chip.textContent=Math.round(now)+'° '+loc.name;chip.hidden=false;}
var t=root.querySelector('[data-season="'+s+'"]');
if(t&&!touched&&!t.classList.contains('is-active'))t.click();
else if(t){var p=root.querySelector('[data-panel="'+t.dataset.tab+'"]'),h=root.querySelector('[data-wx-heading]');if(p&&h&&p.dataset.line)h.textContent=p.dataset.line;}
}
var lat=Math.round(loc.lat*10)/10,lon=Math.round(loc.lon*10)/10,key='mimwx:'+lat+','+lon;
try{var v=JSON.parse(sessionStorage.getItem(key)||'null');if(v&&Date.now()-v.t<36e5){apply(v.max,v.now);return;}}catch(e){}
fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m&daily=temperature_2m_max&timezone=auto&forecast_days=1').then(function(r){return r.json();}).then(function(d){
var max=d.daily&&d.daily.temperature_2m_max&&d.daily.temperature_2m_max[0],now=d.current&&d.current.temperature_2m;
if(typeof max!=='number')return;if(typeof now!=='number')now=max;
try{sessionStorage.setItem(key,JSON.stringify({t:Date.now(),max:max,now:now}));}catch(e){}
apply(max,now);
}).catch(function(){var a=root.querySelector('.mim-shelf__tab.is-active');if(a)a.click();});
});
}
function go(){document.querySelectorAll('[data-mim-weather]').forEach(function(r){setTimeout(function(){run(r);},300);});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
/* v3.8: build a hidden shelf tab from its <template> the first time it is opened (capture phase, so it runs before the tab switcher) */
document.addEventListener('click',function(e){
var t=e.target.closest&&e.target.closest('.mim-shelf [data-tab]');if(!t)return;
var s=t.closest('.mim-shelf'),p=s&&s.querySelector('[data-panel="'+t.dataset.tab+'"]'),tpl=p&&p.querySelector('template[data-shelf-lazy]');
if(tpl)tpl.replaceWith(tpl.content.cloneNode(true));
},true);
/* v3.8 About page: the technique tab row follows the active tab, measured against the row itself, and never pulls away while someone is swiping it */
(function(){
function init(){
var bar=document.querySelector('.mab-tech__tabs');if(!bar)return;
var last=0;['touchmove','wheel'].forEach(function(ev){bar.addEventListener(ev,function(){last=Date.now();},{passive:true});});
bar.scrollTo=function(){
if(Date.now()-last<6000||bar.scrollWidth<=bar.clientWidth)return;
var a=bar.querySelector('.is-active');if(!a)return;
var r=a.getBoundingClientRect(),b=bar.getBoundingClientRect();
var rtl=getComputedStyle(bar).direction==='rtl';
var d=rtl?(r.right-b.right+16):(r.left-b.left-16);
Element.prototype.scrollBy.call(bar,{left:d,behavior:'smooth'});
};
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
/* v3.8: French and Dutch pages show prices in euros (approximate, today's rate). Checkout still charges EGP,
   because the store's payment gateway supports only one currency, so the cart says so. */
(function(){
var lang=(document.documentElement.lang||'').slice(0,2).toLowerCase();
var CUR={fr:'EUR',nl:'EUR'}[lang];if(!CUR||!window.fetch)return;
var NOTE={fr:'Prix en euros indicatifs. Le paiement est effectué en livres égyptiennes (EGP) au taux du jour.',nl:'Prijzen in euro zijn indicatief. Je betaalt in Egyptische ponden (EGP) tegen de dagkoers.'}[lang];
var RX=/(?:LE|EGP|E£)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)(?:\s?EGP)?/g;
var key='mimfx:'+CUR,rate=null,fmt=new Intl.NumberFormat(lang+'-'+lang.toUpperCase(),{style:'currency',currency:CUR,minimumFractionDigits:0,maximumFractionDigits:0});
function conv(s){return s.replace(RX,function(m,n){var v=parseFloat(n.replace(/,/g,''))*rate;return '≈ '+fmt.format(Math.round(v));});}
function walk(root){
if(!root||rate==null)return;
var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(t){var p=t.parentNode;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TEMPLATE)$/.test(p.nodeName))return NodeFilter.FILTER_REJECT;RX.lastIndex=0;return RX.test(t.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}}),list=[],t;
while((t=w.nextNode()))list.push(t);
list.forEach(function(t){RX.lastIndex=0;var nv=conv(t.nodeValue);if(nv!==t.nodeValue)t.nodeValue=nv;});
document.querySelectorAll('.totals,.cart-drawer__footer .totals,#main-cart-footer .totals').forEach(function(tt){var host=tt.parentNode;if(host&&!host.querySelector('.mim-fx-note')){var p=document.createElement('p');p.className='mim-fx-note';p.textContent=NOTE;tt.insertAdjacentElement('afterend',p);}});
}
function start(){
walk(document.body);
document.querySelectorAll('template').forEach(function(tp){walk(tp.content);});
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){walk(n);if(n.querySelectorAll)n.querySelectorAll('template').forEach(function(tp){walk(tp.content);});}else if(n.nodeType===3&&n.parentNode)walk(n.parentNode);});if(m.type==='characterData'&&m.target.parentNode)walk(m.target.parentNode);});}).observe(document.body,{childList:true,subtree:true,characterData:true});
}
function ready(r){rate=r;document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();}
try{var c=JSON.parse(localStorage.getItem(key)||'null');if(c&&Date.now()-c.t<432e5){ready(c.r);return;}}catch(e){}
fetch('https://open.er-api.com/v6/latest/EGP').then(function(r){return r.json();}).then(function(d){var r=d&&d.rates&&d.rates[CUR];if(typeof r!=='number')return;try{localStorage.setItem(key,JSON.stringify({t:Date.now(),r:r}));}catch(e){}ready(r);}).catch(function(){});
})();
/* v3.9 cards: a colour dot swaps the card photo and points the card links at that colour */
(function(){
function pick(d){
var card=d.closest('.mim-card');if(!card)return;
card.querySelectorAll('.mim-dot.is-on').forEach(function(x){x.classList.remove('is-on');});d.classList.add('is-on');
var img=card.querySelector('.mim-card__img1');
if(img&&d.dataset.img){var tok=(card._mimTok||0)+1;card._mimTok=tok;var n=new Image();n.sizes=img.sizes;n.srcset=d.dataset.srcset||'';n.src=d.dataset.img;
var put=function(){if(card._mimTok!==tok)return;img.removeAttribute('loading');img.srcset=d.dataset.srcset||'';img.src=d.dataset.img;card.classList.remove('is-swapping');};
if(n.complete&&n.naturalWidth)put();else{card.classList.add('is-swapping');(n.decode?n.decode():Promise.reject()).then(put,function(){n.onload=put;n.onerror=put;if(n.complete)put();});}}
if(d.dataset.url)card.querySelectorAll('a.mim-card__media,.mim-card__title a').forEach(function(a){a.href=d.dataset.url;});
}
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('.mim-card .mim-dot');if(d){e.preventDefault();pick(d);}});
document.addEventListener('mouseover',function(e){if(!window.matchMedia('(hover:hover)').matches)return;var d=e.target.closest&&e.target.closest('.mim-card .mim-dot');if(d&&!d.classList.contains('is-on'))pick(d);});
})();
/* v3.9 product page: when a colour is picked the theme moves that photo to the front - scroll the slider back to it */
(function(){
function hook(){document.querySelectorAll('media-gallery .product__media-list').forEach(function(l){if(l.dataset.mimHook)return;l.dataset.mimHook='1';new MutationObserver(function(){l.scrollTo({left:0,behavior:'smooth'});}).observe(l,{childList:true});});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',hook):hook();
document.addEventListener('shopify:section:load',hook);
})();
/* v3.9 instant search: match names, product types, variants and tags only (not long descriptions) */
(function(){
if(!window.fetch)return;var f=window.fetch;
window.fetch=function(u,o){
try{if(typeof u==='string'&&u.indexOf('/search/suggest')>-1&&u.indexOf('fields')===-1){u+=(u.indexOf('?')>-1?'&':'?')+'resources%5Boptions%5D%5Bfields%5D=title%2Cproduct_type%2Cvariants.title%2Ctag&resources%5Boptions%5D%5Bunavailable_products%5D=last';}}catch(e){}
return f.call(this,u,o);
};
})();

/* v3.9.1 product rails: ‹ 1 / N › under every card rail, one card per tap */
(function(){
function build(t){
if(t.dataset.mimNav)return;t.dataset.mimNav='1';
var items=Array.prototype.filter.call(t.children,function(c){return c.offsetWidth>0;});
if(items.length<2)return;
var nav=document.createElement('div');nav.className='mim-rail-nav';
nav.innerHTML='<button type="button" class="mim-rail-nav__btn" data-d="-1" aria-label="Previous"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button><span class="mim-rail-nav__count" aria-live="polite"></span><button type="button" class="mim-rail-nav__btn" data-d="1" aria-label="Next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>';
t.insertAdjacentElement('afterend',nav);
var cnt=nav.querySelector('.mim-rail-nav__count'),prev=nav.querySelector('[data-d="-1"]'),next=nav.querySelector('[data-d="1"]');
var rtl=getComputedStyle(t).direction==='rtl';
function step(){var a=items[0].getBoundingClientRect(),b=items[1].getBoundingClientRect();return Math.abs(b.left-a.left)||items[0].offsetWidth;}
function upd(){
var max=t.scrollWidth-t.clientWidth;nav.hidden=max<8;
var x=Math.abs(t.scrollLeft),i=Math.round(x/step());
if(x>=max-4)i=items.length-1;
cnt.textContent=Math.min(i+1,items.length)+' / '+items.length;
prev.disabled=x<4;next.disabled=x>=max-4;
}
nav.addEventListener('click',function(e){var btn=e.target.closest('button');if(!btn)return;var d=+btn.dataset.d*(rtl?-1:1);t.scrollBy({left:d*step(),behavior:'smooth'});});
t.addEventListener('scroll',function(){window.requestAnimationFrame(upd);},{passive:true});
window.addEventListener('resize',upd);upd();
}
function all(){document.querySelectorAll('.mim-rail__track,.mim-cats__rail').forEach(build);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();
document.addEventListener('shopify:section:load',all);
})();

/* v3.9.3 enlarged product photos: one row you swipe through, opened on the photo you tapped, with ‹ n / N › */
(function(){
function setup(modal){
var c=modal.querySelector('.product-media-modal__content');if(!c)return;
var items=[].slice.call(c.children).filter(function(k){if(k.classList&&k.classList.contains('mim-cm-hide'))return false;return k.tagName==='IMG'||k.querySelector&&k.querySelector('img,video,iframe,model-viewer')||/VIDEO|DEFERRED-MEDIA|PRODUCT-MODEL/.test(k.tagName);});
if(items.length<2)return;
c.classList.add('mim-zg');
var nav=modal.querySelector('.mim-zg-nav');
if(!nav){nav=document.createElement('div');nav.className='mim-zg-nav';
nav.innerHTML='<button type="button" data-d="-1" aria-label="Previous"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button><span aria-live="polite"></span><button type="button" data-d="1" aria-label="Next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>';
modal.querySelector('[role=dialog]')?modal.querySelector('[role=dialog]').appendChild(nav):modal.appendChild(nav);
var rtl=getComputedStyle(c).direction==='rtl';
nav.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;c.scrollBy({left:(+b.dataset.d)*(rtl?-1:1)*c.clientWidth,behavior:'smooth'});});
c.addEventListener('scroll',function(){requestAnimationFrame(upd);},{passive:true});
}
function upd(){var i=Math.round(Math.abs(c.scrollLeft)/(c.clientWidth||1));i=Math.max(0,Math.min(items.length-1,i));nav.querySelector('span').textContent=(i+1)+' / '+items.length;nav.querySelector('[data-d="-1"]').disabled=i===0;nav.querySelector('[data-d="1"]').disabled=i===items.length-1;}
var act=c.querySelector('.active')||items[0],idx=Math.max(0,items.indexOf(act));
requestAnimationFrame(function(){c.scrollLeft=(getComputedStyle(c).direction==='rtl'?-1:1)*idx*c.clientWidth;upd();});
}
function watch(m){new MutationObserver(function(){if(m.hasAttribute('open'))setTimeout(function(){setup(m);},60);}).observe(m,{attributes:true,attributeFilter:['open']});}
function all(){document.querySelectorAll('product-modal').forEach(function(m){if(m.dataset.mimZg)return;m.dataset.mimZg='1';watch(m);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();
})();

/* MIM speed: on the product page, quietly fetch the next gallery photos once the page has loaded,
   then stay two photos ahead while the visitor swipes, so the next photo is already there. */
(function(){
var ul=document.querySelector('[id^="Slider-Gallery"]');if(!ul)return;
var imgs=[].slice.call(ul.querySelectorAll('.product__media img'));
var ahead=3;
function warm(n){imgs.slice(0,n).forEach(function(i){if(i.loading==='lazy')i.loading='eager'})}
var idle=window.requestIdleCallback||function(f){setTimeout(f,1200)};
if(document.readyState==='complete')idle(function(){warm(ahead)});else window.addEventListener('load',function(){idle(function(){warm(ahead)})});
ul.addEventListener('scroll',function(){var n=Math.round(Math.abs(ul.scrollLeft)/Math.max(ul.clientWidth,1))+3;if(n>ahead){ahead=n;warm(n)}},{passive:true});
})();

/* MIM: product page shows only the photos of the selected colour (gallery, thumbnails and zoom).
   Groups come from #MimColorMedia: each colour owns its variant photo and the photos after it, up to the next colour's. */
(function(){
var el=document.getElementById('MimColorMedia');if(!el)return;
var d;try{d=JSON.parse(el.textContent);}catch(e){return;}
var starts={};
d.variants.forEach(function(v){var i=d.media.indexOf(v[1]);if(i<0)return;if(!(v[0] in starts)||i<starts[v[0]])starts[v[0]]=i;});
var miss=[];d.variants.forEach(function(v){if(!(v[0] in starts)&&miss.indexOf(v[0])<0)miss.push(v[0]);});
var first=Math.min.apply(null,Object.keys(starts).map(function(k){return starts[k];}).concat([d.media.length]));
if(miss.length===1&&first>0)starts[miss[0]]=0;
var cols=Object.keys(starts).sort(function(a,b){return starts[a]-starts[b];});
if(cols.length<2)return;
var group={};
cols.forEach(function(c,k){var s=k===0?0:starts[c],e=k+1<cols.length?starts[cols[k+1]]:d.media.length;for(var i=s;i<e;i++)group[d.media[i]]=c;});
function current(){var f=document.querySelectorAll('variant-selects fieldset, variant-selects .product-form__input--dropdown')[d.pos-1];if(!f)return null;var r=f.querySelector('input:checked');if(r)return r.value;var s=f.querySelector('select');return s?s.value:null;}
function mid(n){var a=n.getAttribute('data-media-id')||n.getAttribute('data-target')||'';return +(a.split('-').pop());}
var last=null;
function apply(){
var c=current();if(!c||!(c in starts))return;
var nodes=document.querySelectorAll('[id^="Slider-Gallery"] > li[data-media-id], [id^="Slider-Thumbnails"] > li[data-target], .product-media-modal__content > [data-media-id]');
nodes.forEach(function(n){var g=group[mid(n)];var show=!g||g===c;n.classList.toggle('mim-cm-hide',!show);n.classList.toggle('mim-cm-show',show);});
if(c!==last){last=c;
var ul=document.querySelector('[id^="Slider-Gallery"]');if(ul){ul.scrollLeft=0;var sc=ul.closest('slider-component');if(sc&&sc.resetPages)try{sc.resetPages();}catch(e){}}}
one();
}
/* a colour with a single photo: Dawn's slider leaves the old counter and live arrows, so hide them */
function one(){var ul=document.querySelector('[id^="Slider-Gallery"]');if(!ul)return;var sc=ul.closest('slider-component');if(!sc)return;var n=[].filter.call(ul.children,function(li){return !li.classList.contains('mim-cm-hide');}).length;sc.classList.toggle('mim-one',n<2);var t=sc.querySelector('.slider-counter--total');if(t&&n>1)t.textContent=n;}
if(window.customElements)customElements.whenDefined('slider-component').then(function(){setTimeout(function(){last=null;apply();},50);});
if(!document.getElementById('MimOneCss')){var st=document.createElement('style');st.id='MimOneCss';st.textContent='slider-component.mim-one .slider-buttons{display:none!important}';document.head.appendChild(st);}
var t;function soon(){clearTimeout(t);t=setTimeout(apply,30);}
document.addEventListener('change',function(e){if(e.target.closest&&e.target.closest('variant-selects')){soon();setTimeout(apply,500);}});
var w=document.querySelector('.product__media-wrapper');if(w)new MutationObserver(soon).observe(w,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();

/* MIM speed: fetch a card's other colour photos ahead of time, only for cards the visitor is looking at
   (60% on screen for a second) or hovering, so tapping a colour dot shows the photo straight away. */
(function(){
if(!('IntersectionObserver' in window))return;
var idle=window.requestIdleCallback||function(f){setTimeout(f,200);};
function warm(card){if(card.dataset.mimWarm)return;card.dataset.mimWarm='1';var b=card.querySelector('.mim-card__img1');var sz=b?b.sizes:'';
idle(function(){card.querySelectorAll('.mim-dot[data-img]:not(.is-on)').forEach(function(d){var i=new Image();i.decoding='async';i.sizes=sz;i.srcset=d.dataset.srcset||'';i.src=d.dataset.img;});});}
var timers=new WeakMap();
var io=new IntersectionObserver(function(es){es.forEach(function(e){var c=e.target;if(e.isIntersecting){timers.set(c,setTimeout(function(){warm(c);io.unobserve(c);},900));}else{clearTimeout(timers.get(c));}});},{threshold:.6});
function scan(){document.querySelectorAll('.mim-card:not([data-mim-obs])').forEach(function(c){c.dataset.mimObs='1';if(c.querySelector('.mim-dot[data-img]:not(.is-on)'))io.observe(c);});}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(scan,300);}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('mouseover',function(e){var c=e.target.closest&&e.target.closest('.mim-card');if(c)warm(c);},{passive:true});
if(document.readyState==='complete')scan();else window.addEventListener('load',scan);
})();

/* Card colour dots: once a colour is picked, stop the hover photo (always the first colour's 2nd shot) covering it */
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('.mim-dot');if(!d)return;var c=d.closest('.mim-card');if(c)c.classList.toggle('mim-picked',!d.parentNode.firstElementChild.isSameNode(d)||c.classList.contains('mim-picked'));},true);
