/* Eau de Deal – ekstra: legg til varer, ønsket pris, del, pris per ml, «siden sist», rolige kort */
(function(){
var LS=window.localStorage;
function get(k){try{return LS.getItem(k)}catch(e){return null}}
function set(k,v){try{v==null?LS.removeItem(k):LS.setItem(k,v)}catch(e){}}
function jget(k,d){try{return JSON.parse(get(k))||d}catch(e){return d}}
function key(u){return String(u||"").split("?")[0].split("#")[0].replace(/\/+$/,"").toLowerCase()}
function host(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return u}}
function num(v){v=String(v||"").replace(/\s/g,"").replace(",",".").replace(/[^\d.]/g,"");var n=parseFloat(v);return n>0?n:null}
function nok(n){return n.toLocaleString("nb-NO",{maximumFractionDigits:n<10?1:0})+" kr"}
function mlOf(p){var s=[p.name].concat((p.offers||[]).map(function(o){return o.name})).join(" ");var m=s.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);if(m)return parseFloat(m[1].replace(",","."));m=s.match(/(\d+(?:[.,]\d+)?)\s*(?:fl\.?\s*)?(?:oz|ounce)/i);return m?Math.round(parseFloat(m[1].replace(",","."))*29.57):null}
var MOTION=!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)&&get("pv_motion")!=="off";

/* ---------- Stil ---------- */
var css=document.createElement("style");css.textContent=
".fab{position:fixed;right:18px;bottom:calc(env(safe-area-inset-bottom) + 22px);width:58px;height:58px;border-radius:20px;background:var(--grad);color:#fff;font-size:34px;font-weight:300;line-height:1;display:grid;place-items:center;box-shadow:0 10px 30px rgba(0,0,0,.45),4px 4px 0 rgba(0,0,0,.3);z-index:9}"+
".fab:active{transform:scale(.92)}"+
"html .card,html .stat,html .seg,html .vseg,html select{background:rgba(18,16,38,.84)!important}"+
"#list::after{content:'';display:block;grid-column:1/-1;height:36vh}"+
".mood:empty{display:none}"+
".card.pending{border-style:dashed!important;opacity:.9}"+
".card.pending .p{animation:blink 1.2s ease-in-out infinite}@keyframes blink{50%{opacity:.3}}"+
".row{display:flex;gap:8px;align-items:stretch}.row .f{flex:1;min-width:0}.row .btn{padding:12px 14px;white-space:nowrap}"+
".btn.danger{color:#fb7185;border-color:rgba(251,113,133,.45)}"+
".actions.one{grid-template-columns:1fr}"+
".since{margin:6px 0 12px;padding:12px 40px 12px 14px;border-radius:16px;background:linear-gradient(120deg,rgba(52,211,153,.25),rgba(34,211,238,.14));border:1px solid rgba(52,211,153,.5);font-size:13.5px;position:relative;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}"+
".since b{color:#6ee7b7}.since .x{position:absolute;right:10px;top:8px;color:var(--muted);font-size:20px}"+
".cf{position:fixed;top:-20px;width:9px;height:14px;border-radius:2px;z-index:30;pointer-events:none;animation:cf 2.6s ease-in forwards}"+
"@keyframes cf{to{transform:translate(var(--dx),110vh) rotate(720deg);opacity:.7}}"+
".note{margin:10px 0 0;padding:10px 12px;border-radius:12px;font-size:12.5px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:#fcd34d}"+
".ml{font-size:12.5px;color:var(--muted);margin-top:6px}.ml b{color:var(--text)}"+
".sw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;margin-top:14px;border-radius:14px;background:var(--card);border:1px solid var(--line);font-weight:600}"+
".sw input{width:46px;height:28px;accent-color:#ec4899}"+
"ol.steps{margin:6px 0 0;padding-left:20px;font-size:13px;color:var(--muted);line-height:1.6}ol.steps b{color:var(--text)}"+
"details.more{margin-top:14px;padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line)}details.more summary{font-weight:700;cursor:pointer}";
document.head.appendChild(css);

/* ---------- Statistikk: «prisfall siste 7 d» byttes med sum på lista ---------- */
var sD=document.getElementById("sDrops");if(sD&&sD.nextElementSibling)sD.nextElementSibling.textContent="totalt på lista";

/* ---------- Sortering: pris per ml ---------- */
var sel=document.getElementById("sort");
var o=document.createElement("option");o.value="ml";o.textContent="Pris per ml";sel.appendChild(o);
if(get("pv_sort")==="ml")sel.value="ml";
sel.addEventListener("change",function(){after()});
document.getElementById("tabs").addEventListener("click",function(){setTimeout(after,0)});

/* ---------- GitHub: kommandoer til prissjekken ---------- */
function ready(){
  if(!DATA||!DATA.repo||!DATA.issue){toast("Fungerer ikke i demo-modus");return false}
  if(!get("pv_token")){toast("Legg inn GitHub-nøkkelen først");openSettings();return false}
  return true;
}
function postCmd(c){
  return fetch("https://api.github.com/repos/"+DATA.repo+"/issues/"+DATA.issue.number+"/comments",{method:"POST",headers:Object.assign(ghHeaders(),{"Content-Type":"application/json"}),
    body:JSON.stringify({body:"🤖 Eau de Deal-kommando (utføres automatisk ved neste prissjekk)\n\n"+JSON.stringify(c)})})
  .then(function(r){if(!r.ok)throw new Error("GitHub svarte "+r.status);return r});
}
function runSoon(){
  fetch("https://api.github.com/repos/"+DATA.repo+"/actions/workflows/prisvakt.yml/dispatches",{method:"POST",headers:Object.assign(ghHeaders(),{"Content-Type":"application/json"}),body:JSON.stringify({ref:"main"})}).catch(function(){});
  clearTimeout(runSoon.t);runSoon.t=setTimeout(load,150000);
}
function sheet(html){OPEN=null;document.getElementById("sheetBody").innerHTML=html;document.getElementById("scrim").classList.add("on");var s=document.getElementById("sheet");s.classList.add("on");s.scrollTop=0}

/* ---------- Legg til vare ---------- */
function openAdd(prefill){
  var noTok=!get("pv_token");
  sheet('<h2>Legg til vare</h2><p class="help">Lim inn lenken til en produktside. Navn og pris hentes automatisk – vanligvis innen 2 minutter.</p>'+
    (noTok?'<div class="note">Første gang her: legg inn GitHub-nøkkelen under ⚙️ (også i Safari, siden Safari og appen husker hver for seg).</div>':"")+
    '<label class="f" for="addUrl">Lenke</label><div class="row"><input class="f" id="addUrl" type="url" inputmode="url" autocomplete="off" placeholder="https://…"><button class="btn" id="addPaste">Lim inn</button></div>'+
    '<label class="f" for="addTgt">Ønsket pris (valgfritt)</label><input class="f" id="addTgt" inputmode="decimal" placeholder="Varsle meg når den er under …">'+
    '<div class="actions one"><button class="btn primary" id="addGo">＋ Legg til</button></div>'+
    '<details class="more"><summary>Raskere: rett fra Safari med Del-knappen</summary><ol class="steps">'+
    '<li>Åpne <b>Snarveier</b>-appen og trykk <b>+</b>.</li><li>Legg til handlingen <b>Kod URL</b> og velg <b>Snarvei-inndata</b> som innhold.</li>'+
    '<li>Legg til <b>Åpne URL-er</b> og skriv: <b>'+esc(location.origin+location.pathname)+'?add=</b> fulgt av variabelen <b>Kodet URL</b>.</li>'+
    '<li>Trykk ⓘ / pilen øverst → slå på <b>Vis i delingsark</b>, og gi den navnet <b>Legg i Eau de Deal</b>.</li>'+
    '<li>På en produktside i Safari: <b>Del → Legg i Eau de Deal</b>. Siden åpnes med lenken klar – trykk Legg til.</li></ol></details>');
  var u=document.getElementById("addUrl");if(prefill)u.value=prefill;
  document.getElementById("addPaste").onclick=function(){
    if(!navigator.clipboard||!navigator.clipboard.readText)return toast("Trykk lenge i feltet og velg Lim inn");
    navigator.clipboard.readText().then(function(t){var m=String(t).match(/https?:\/\/\S+/);if(m)u.value=m[0];else toast("Fant ingen lenke i utklippstavlen")}).catch(function(){toast("Trykk lenge i feltet og velg Lim inn")});
  };
  document.getElementById("addGo").onclick=function(){
    var m=u.value.match(/https?:\/\/\S+/);if(!m)return toast("Det ser ikke ut som en lenke");
    var url=m[0],t=num(document.getElementById("addTgt").value);
    if(!ready())return;
    var k=key(url);
    if(DATA.products.some(function(p){return key(p.url)===k||(p.offers||[]).some(function(x){return key(x.url)===k})}))return toast("Du følger allerede denne");
    var b=this;b.disabled=true;b.textContent="Legger til …";
    postCmd({cmd:"add",url:url,target:t}).then(function(){
      var pend=jget("pv_pending",[]);pend.push({url:url,target:t,t:Date.now()});set("pv_pending",JSON.stringify(pend));
      runSoon();closeSheet();render();burst();toast("✨ Lagt til! Navn og pris kommer om ca. 2 min");
    }).catch(function(e){b.disabled=false;b.textContent="＋ Legg til";toast("Klarte ikke å legge til: "+e.message)});
  };
  if(!prefill)setTimeout(function(){u.focus()},300);
}
var fab=document.createElement("button");fab.className="fab";fab.setAttribute("aria-label","Legg til vare");fab.textContent="+";fab.onclick=function(){openAdd()};document.body.appendChild(fab);

// Lenke delt fra Safari-snarveien: ?add=…
(function(){
  var q=new URLSearchParams(location.search),raw=q.get("add")||q.get("url")||q.get("text");if(!raw)return;
  history.replaceState(null,"",location.pathname);
  var m=String(raw).match(/https?:\/\/\S+/);if(!m)return;
  var tries=0,iv=setInterval(function(){if(typeof DATA!=="undefined"&&DATA||++tries>50){clearInterval(iv);openAdd(m[0])}},200);
})();

/* ---------- Kort: varsel når en butikk ikke svarer, mål i sikte ---------- */
var _card=card;
card=function(p){
  var h=_card(p),x="";
  if(p.failed&&p.failed.length)x+='<span class="chip err">⚠ '+esc(p.failed[0])+(p.failed.length>1?" m.fl.":"")+' svarer ikke</span>';
  if(p.target&&p.price&&p.price>p.target&&p.price<=p.target*1.1)x+='<span class="chip low">🎯 Nær målet</span>';
  return x?h.replace('<div class="chips">','<div class="chips">'+x):h;
};

/* ---------- Detaljark: ønsket pris, per ml, del, slutt å følge ---------- */
var _open=openSheet;
openSheet=function(id,keep){
  _open(id,keep);
  var p=DATA&&DATA.products.find(function(x){return x.id===id});if(!p)return;
  var ml=mlOf(p),body=document.getElementById("sheetBody"),acts=body.querySelector(".actions"),h="";
  if(p.failed&&p.failed.length)h+='<div class="note">⚠ Fikk ikke svar fra '+esc(p.failed.join(", "))+' ved siste sjekk. Prisen over gjelder butikkene som svarte.</div>';
  if(ml&&p.price)h+='<div class="ml">≈ <b>'+nok(p.price/ml)+' per ml</b> ('+ml+' ml)'+(p.lowest&&p.lowest<p.price?' · laveste '+nok(p.lowest/ml)+'/ml':"")+'</div>';
  h+='<h3>Ønsket pris</h3><div class="row"><input class="f" id="tgt" inputmode="decimal" placeholder="f.eks. '+(p.price?Math.round(p.price*.85/10)*10:299)+'" value="'+(p.target||"")+'"><button class="btn primary" id="tgtSave">Lagre</button></div>'+
    '<p class="help" style="margin:6px 0 0">Du får eget varsel når prisen når dette nivået. La feltet stå tomt for å fjerne målet.</p>';
  if(acts)acts.insertAdjacentHTML("beforebegin",h);else body.insertAdjacentHTML("beforeend",h);
  body.insertAdjacentHTML("beforeend",'<div class="actions"><button class="btn" id="shareBtn">↗ Del</button><button class="btn danger" id="rmBtn">Slutt å følge</button></div>');
  document.getElementById("tgtSave").onclick=function(){
    var t=num(document.getElementById("tgt").value);if(!ready())return;
    postCmd({cmd:"target",id:p.id,target:t}).then(function(){p.target=t;runSoon();render();toast(t?"🎯 Mål "+kr(t)+" lagret":"Målet er fjernet")}).catch(function(e){toast("Klarte ikke å lagre: "+e.message)});
  };
  document.getElementById("shareBtn").onclick=function(){
    var txt=p.name+" – "+kr(p.price)+(p.store?" hos "+p.store:"");
    if(navigator.share)navigator.share({title:p.name,text:txt,url:p.url}).catch(function(){});
    else if(navigator.clipboard)navigator.clipboard.writeText(txt+"\n"+p.url).then(function(){toast("Kopiert – lim inn hvor du vil")});
  };
  document.getElementById("rmBtn").onclick=function(){
    if(!confirm("Slutte å følge «"+p.name+"»?"))return;if(!ready())return;
    postCmd({cmd:"remove",id:p.id}).then(function(){
      var r=jget("pv_removed",{});r[p.id]=Date.now();set("pv_removed",JSON.stringify(r));
      closeSheet();render();runSoon();toast("Følger ikke lenger «"+p.name+"»");
    }).catch(function(e){toast("Klarte ikke: "+e.message)});
  };
};

/* ---------- Innstillinger: bevegelse, snarvei, del med en venn ---------- */
document.getElementById("settingsBtn").addEventListener("click",function(){
  var b=document.getElementById("sheetBody");
  b.insertAdjacentHTML("beforeend",
    '<label class="sw">Bevegelige kort og bakgrunn<input type="checkbox" id="mot"'+(get("pv_motion")!=="off"?" checked":"")+'></label>'+
    '<details class="more"><summary>Del appen med en venn</summary><ol class="steps">'+
    '<li>Vennen lager en gratis konto på <b>github.com</b>, åpner <a href="https://github.com/'+esc((DATA&&DATA.repo)||"")+'" target="_blank" rel="noopener">prosjektet ditt</a> og trykker <b>Fork</b>.</li>'+
    '<li>I kopien: <b>Settings → Pages</b> → Branch <b>main</b>, mappe <b>/docs</b>. <b>Actions</b> → slå på.</li>'+
    '<li>Vennen laster ned <b>ntfy</b>, finner på et eget hemmelig navn og legger det inn som <b>Settings → Secrets → Actions → NTFY_TOPIC</b>.</li>'+
    '<li>Vennen bytter ut lenkene i <b>products.txt</b> med sine egne (eller bruker + i appen etterpå).</li>'+
    '<li>Appen ligger da på <b>brukernavn.github.io/dropp-og-senk</b>. Legg den på Hjem-skjermen og lag en egen GitHub-nøkkel.</li></ol>'+
    '<p class="help">Bare se på lista di? Send lenken til appen – uten nøkkel kan ingen endre noe.</p></details>');
  document.getElementById("mot").onchange=function(){set("pv_motion",this.checked?null:"off");toast(this.checked?"Bevegelse på":"Bevegelse av");setTimeout(function(){location.reload()},700)};
});

/* ---------- Etter hver visning ---------- */
var lastData=null;
function after(){
  if(typeof DATA==="undefined"||!DATA)return;
  var list=document.getElementById("list"),now=Date.now();
  // sum på lista
  var act=DATA.products.filter(function(p){return !p.bought&&p.price!=null});
  if(sD)sD.textContent=kr(act.reduce(function(a,p){return a+p.price},0));
  // skjul varer du nettopp sluttet å følge
  var rm=jget("pv_removed",{}),ch=false;
  Object.keys(rm).forEach(function(id){var still=DATA.products.some(function(p){return p.id===id});if(!still||now-rm[id]>36e5){delete rm[id];ch=true}else{var c=list.querySelector('.card[data-id="'+CSS.escape(id)+'"]');if(c)c.remove()}});
  if(ch)set("pv_removed",JSON.stringify(rm));
  // varer som er på vei inn
  var pend=jget("pv_pending",[]).filter(function(x){var k=key(x.url);return now-x.t<72e5&&!DATA.products.some(function(p){return key(p.url)===k||(p.offers||[]).some(function(o){return key(o.url)===k})})});
  set("pv_pending",pend.length?JSON.stringify(pend):null);
  if(TAB==="active"&&pend.length){
    var emp=list.querySelector(".empty");if(emp)emp.remove();
    list.insertAdjacentHTML("afterbegin",pend.map(function(x){return '<article class="card pending"><div class="top"><div style="min-width:0"><div class="name">'+esc(host(x.url))+'</div><div class="chips"><span class="chip store">Legges til …</span>'+(x.target?'<span class="chip">Mål '+kr(x.target)+'</span>':"")+'</div></div><div class="price"><div class="p">…</div></div></div></article>'}).join(""));
  }
  // sorter på pris per ml
  if(sel.value==="ml"){
    var cs=[].slice.call(list.querySelectorAll(".card[data-id]"));
    var per=function(c){var p=DATA.products.find(function(x){return String(x.id)===c.dataset.id});var m=p&&mlOf(p);return m&&p.price?p.price/m:1e9};
    cs.sort(function(a,b){return per(a)-per(b)}).forEach(function(c){list.appendChild(c)});
  }
  // siden sist
  if(DATA!==lastData){lastData=DATA;sinceLast()}
  if(window.EDD_wake)window.EDD_wake(.6);
}
var _render=render;render=function(){_render();after()};

function sinceLast(){
  if(!DATA.repo)return;
  var seen=jget("pv_seen",null),drops=[],cur={};
  DATA.products.forEach(function(p){if(p.price==null)return;cur[p.id]=p.price;if(seen&&seen[p.id]!=null&&p.price<seen[p.id]&&!p.bought)drops.push({p:p,d:seen[p.id]-p.price})});
  set("pv_seen",JSON.stringify(cur));
  var old=document.querySelector(".since");if(old)old.remove();
  if(!drops.length)return;
  drops.sort(function(a,b){return b.d-a.d});
  var el=document.createElement("div");el.className="since";
  el.innerHTML='🎉 <b>'+(drops.length===1?"1 vare":drops.length+" varer")+' har falt i pris</b> siden sist: '+drops.slice(0,3).map(function(x){return esc(x.p.name.split(" ").slice(0,4).join(" "))+" (−"+kr(x.d)+")"}).join(", ")+(drops.length>3?" …":"")+'<button class="x" aria-label="Lukk">×</button>';
  el.querySelector(".x").onclick=function(){el.remove()};
  var st=document.querySelector(".stats");st.parentNode.insertBefore(el,st);
  burst();
}
function burst(){
  if(!MOTION)return;
  var cols=["#ec4899","#f59e0b","#34d399","#22d3ee","#8b5cf6","#fff"];
  for(var i=0;i<46;i++){var c=document.createElement("i");c.className="cf";c.style.left=(Math.random()*100)+"vw";c.style.background=cols[i%cols.length];c.style.setProperty("--dx",(Math.random()*160-80)+"px");c.style.animationDelay=(Math.random()*.5)+"s";c.style.animationDuration=(2+Math.random()*1.4)+"s";document.body.appendChild(c);setTimeout(function(x){x.remove()}.bind(null,c),4200)}
}

/* ---------- Rolige kort som dulter ved endringer og trykk ---------- */
(function(){
  var list=document.getElementById("list"),B=[],last=0,I=3.5,E=1,run=false;
  if(!MOTION){window.EDD_wake=function(){};return}
  function lively(c){
    if(c.classList.contains("pending"))return true;
    var p=typeof DATA!=="undefined"&&DATA&&DATA.products.find(function(x){return String(x.id)===c.dataset.id});
    var h=p&&p.history||[];return h.length>1&&Date.now()-new Date(h[h.length-1].t)<1728e5;
  }
  function scan(){var cs=list.querySelectorAll(".card"),nb=[];for(var i=0;i<cs.length;i++){var c=cs[i],o=null;for(var j=0;j<B.length;j++)if(B[j].el===c){o=B[j];break}
    if(!o)o={el:c,x:0,y:0,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,r:0,vr:0};o.l=c.offsetLeft;o.t=c.offsetTop;o.w=c.offsetWidth;o.h=c.offsetHeight;o.live=lively(c);nb.push(o)}B=nb}
  function wake(e){E=Math.max(E,e==null?1:e);if(!run){run=true;last=0;requestAnimationFrame(step)}}
  window.EDD_wake=function(e){setTimeout(function(){scan();wake(e)},60)};
  new MutationObserver(function(){setTimeout(function(){scan();wake(.5)},60)}).observe(list,{childList:true});
  window.addEventListener("resize",function(){setTimeout(scan,60)});
  list.addEventListener("pointerdown",function(e){var c=e.target.closest(".card");B.forEach(function(o){if(o.el===c){o.vx+=(Math.random()-.5)*90;o.vy+=(Math.random()-.5)*90;o.vr+=(Math.random()-.5)*20}});wake(.3)});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)wake(.8)});
  function step(t){
    var dt=last?Math.min(.033,(t-last)/1000):.016;last=t;E*=Math.exp(-dt/1.4);var i,j,moving=false,anyLive=false;
    for(i=0;i<B.length;i++){var a=B[i];if(a.live)anyLive=true;
      var k=(a.live?.45:0)+E*.9;if(Math.random()<dt*k){a.vx+=(Math.random()-.5)*(a.live?40:30);a.vy+=(Math.random()-.5)*(a.live?40:30);a.vr+=(Math.random()-.5)*5}
      a.vx+=(-10*a.x-2*a.vx)*dt;a.vy+=(-10*a.y-2*a.vy)*dt;a.vr+=(-12*a.r-2.6*a.vr)*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.r+=a.vr*dt;
      a.x=Math.max(-12,Math.min(12,a.x));a.y=Math.max(-12,Math.min(12,a.y));a.r=Math.max(-3,Math.min(3,a.r));
      if(Math.abs(a.vx)+Math.abs(a.vy)>.4||Math.abs(a.x)+Math.abs(a.y)>.15||Math.abs(a.r)>.03)moving=true}
    for(i=0;i<B.length;i++)for(j=i+1;j<B.length;j++){var p=B[i],q=B[j];
      var px=p.l+p.x-I,py=p.t+p.y-I,qx=q.l+q.x-I,qy=q.t+q.y-I,pw=p.w+2*I,ph=p.h+2*I,qw=q.w+2*I,qh=q.h+2*I;
      var ox=Math.min(px+pw,qx+qw)-Math.max(px,qx),oy=Math.min(py+ph,qy+qh)-Math.max(py,qy);if(ox<=0||oy<=0)continue;
      if(ox<oy){var d=(px+pw/2<qx+qw/2)?-1:1;p.x+=d*ox/2;q.x-=d*ox/2;var tv=p.vx;p.vx=q.vx*.85;q.vx=tv*.85;p.vr+=d*3;q.vr-=d*3}
      else{var e=(py+ph/2<qy+qh/2)?-1:1;p.y+=e*oy/2;q.y-=e*oy/2;var tu=p.vy;p.vy=q.vy*.85;q.vy=tu*.85;p.vr-=e*2;q.vr+=e*2}}
    for(i=0;i<B.length;i++){var b=B[i];b.el.style.translate=b.x.toFixed(1)+"px "+b.y.toFixed(1)+"px";b.el.style.rotate=b.r.toFixed(2)+"deg"}
    if(moving||anyLive||E>.02)requestAnimationFrame(step);
    else{run=false;B.forEach(function(b){b.x=b.y=b.r=0;b.el.style.translate="";b.el.style.rotate=""})}
  }
  setTimeout(function(){scan();wake(1)},300);
})();

if(typeof DATA!=="undefined"&&DATA)render();
})();
