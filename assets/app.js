/* Application : rendu des onglets à partir des données chargées (voir donnees.js). */
function lancerApplication(D){
const {RAW,AGE,POPAGE,SV,PATRI,JUSTICE,PUB,C27,POPC,POPN,ERAS,TVAGE,AN,VOTE,MTYPE,MOWN,PARAM,couleurDuel}=D;
const POS=["Gauche radicale","Gauche","Centre-gauche","Centre","Centre-droit","Droite","Droite conserv. / identitaire"];
const POSC=["#9F1239","#E11D48","#F472B6","#A78BFA","#60A5FA","#2563EB","#1E3A8A"];
const TYPES=["TV","Radio","Presse","Magazine","En ligne"];
const KC={capital:"#C2410C",partenariat:"#7C3AED",commande:"#7A8599"};
const KL={capital:"possède",partenariat:"partenariat",commande:"commande"};
const fmt=v=>v==null||isNaN(v)?"–":(+v).toLocaleString("fr-FR",{minimumFractionDigits:(+v)%1?1:0,maximumFractionDigits:1});
const frDate=s=>new Date(s+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const el=(t,a={},h="")=>{const e=document.createElement(t);for(const k in a)e.setAttribute(k,a[k]);e.innerHTML=h;return e;};
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const DAY=864e5, toD=s=>new Date(s+"T12:00:00").getTime();
let ERA, Y="2027", CH={};
function killCharts(keys){(keys||Object.keys(CH)).forEach(k=>{if(CH[k]){CH[k].destroy();delete CH[k];}});}
function allPolls(){return ERA.polls;}
function avgAt(P,k,t,win){const L={};P.forEach(p=>{const pt=toD(p.d);if(pt<=t&&t-pt<=win*DAY&&p.s[k]!=null)L[p.inst]=p.s[k];});const v=Object.values(L);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function keysOf(){return Object.keys(ERA.C);}
/* ================= Onglet Sondages ================= */
let T0,MAXD,view,visible,trendCache;
const dayLabel=(v,o)=>new Date(T0+v*DAY).toLocaleDateString("fr-FR",o);
function computeTrend(P){
  const win=ERA.live?45:21, out={days:[],s:{}};keysOf().forEach(k=>out.s[k]=[]);
  for(let d=0;d<=MAXD;d+=7){const t=T0+d*DAY;out.days.push(d);keysOf().forEach(k=>{const v=avgAt(P,k,t,win);out.s[k].push(v==null?null:Math.round(v*10)/10);});}
  return out;
}
function nameOf(k){return ERA.C[k].s||ERA.C[k].n.split(" /")[0];}
function renderHero(P){
  const bars=document.getElementById("heroBars"),leg=document.getElementById("legend");bars.innerHTML="";leg.innerHTML="";
  const bar=(vals,label)=>{const items=Object.keys(vals).filter(k=>vals[k]!=null&&ERA.C[k]).sort((a,b)=>vals[b]-vals[a]);const tot=items.reduce((s,k)=>s+vals[k],0);
    const wrap=el("div",{});if(label)wrap.appendChild(el("div",{class:"hint",style:"margin:6px 0 2px"},label));
    const b=el("div",{class:"grid-bar",role:"img","aria-label":label||"Répartition"});
    items.forEach(k=>{const v=vals[k],s=el("span",{title:`${ERA.C[k].n} ${fmt(v)} %`});s.style.width=(v/tot*100)+"%";s.style.background=ERA.C[k].c;
      if(v>=9)s.innerHTML=`<b>${v>=25?nameOf(k)+" ":""}${fmt(Math.round(v*10)/10)}</b>`;b.appendChild(s);});
    wrap.appendChild(b);bars.appendChild(wrap);return items;};
  if(ERA.live){
    const endT=Math.max(toD(ERA.end),toD(P[P.length-1].d));const now={},ago={};
    keysOf().forEach(k=>{now[k]=avgAt(P,k,endT,30);ago[k]=avgAt(P,k,endT-92*DAY,30);});
    document.getElementById("heroTitle").textContent="La moyenne aujourd’hui, au premier tour";
    document.getElementById("heroLede").textContent="Moyenne des sondages des 30 derniers jours (le plus récent de chaque institut compte une fois). Entre parenthèses : l’évolution sur trois mois.";
    bar(now).forEach(k=>{const v=now[k],a=ago[k];let d;if(a!=null){const x=Math.round((v-a)*10)/10;d=`<span class="dl ${x>0.4?"upc":x<-0.4?"dnc":"flat"}">(${x>0?"+":""}${fmt(x)})</span>`;}else d=`<span class="dl flat">(nouveau)</span>`;
      leg.appendChild(el("div",{class:"cand"},`<i style="background:${ERA.C[k].c}"></i><span class="nm">${k==="rn"?"Le Pen":ERA.C[k].n}</span><span class="sc">${fmt(Math.round(v*10)/10)} %</span>${d}`));});
    ERA._now=now;
  }else{
    const t=toD(ERA.results.d),fin={};keysOf().forEach(k=>{const v=avgAt(P,k,t,9);if(v!=null)fin[k]=v;});
    document.getElementById("heroTitle").textContent="Derniers sondages contre résultat réel";
    document.getElementById("heroLede").textContent="En haut, la moyenne des derniers sondages publiés avant le vote ; en bas, le vrai résultat du premier tour. Dans la liste, l’écart : positif si le candidat a fait mieux que prévu.";
    bar(fin,"Moyenne des derniers sondages");const items=bar(ERA.results.r1,"Résultat du "+frDate(ERA.results.d));
    items.forEach(k=>{const r=ERA.results.r1[k],f=fin[k];let d="";if(f!=null){const x=Math.round((r-f)*10)/10;d=`<span class="dl ${x>=1?"upc":x<=-1?"dnc":"flat"}">(${x>0?"+":""}${fmt(x)})</span>`;}
      leg.appendChild(el("div",{class:"cand"},`<i style="background:${ERA.C[k].c}"></i><span class="nm">${nameOf(k)}</span><span class="sc">${fmt(r)} %</span>${d}`));});
    ERA._now=fin;
  }
}
/* ---- courbes + lecture au doigt ---- */
function stepFor(r){return r<=40?7:r<=100?14:30.4;}
function fitY(){
  const c=CH.trend;let lo=100,hi=0;c.data.datasets.forEach(d=>{if(d.hidden)return;d.data.forEach(p=>{if(p.x>=view.min&&p.x<=view.max&&p.y!=null){lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);}});});
  if(hi===0){lo=0;hi=40;}const full=(view.max-view.min)>=MAXD-5;
  c.options.scales.y.min=full?0:Math.max(0,Math.floor(lo-2));c.options.scales.y.max=full?Math.max(40,Math.ceil(hi+2)):Math.ceil(hi+2);
}
function syncUI(){
  const f=document.getElementById("rFrom"),t=document.getElementById("rTo");f.max=t.max=MAXD;f.value=Math.round(view.min);t.value=Math.round(view.max);
  document.getElementById("rangeLabel").textContent=`Période affichée : du ${dayLabel(view.min,{day:"numeric",month:"long",year:"numeric"})} au ${dayLabel(view.max,{day:"numeric",month:"long",year:"numeric"})}`;
  document.querySelectorAll("#zoombar .chip[data-d]").forEach(b=>b.setAttribute("aria-pressed",String(Math.round(view.max)===MAXD&&Math.abs(Math.round(MAXD-view.min)-(+b.dataset.d))<2)));
}
function setView(min,max,fromPlugin){
  view.min=Math.max(0,Math.min(min,MAXD-7));view.max=Math.min(MAXD,Math.max(max,view.min+7));
  const c=CH.trend;if(!fromPlugin){c.options.scales.x.min=view.min;c.options.scales.x.max=view.max;}
  c.options.scales.x.ticks.stepSize=stepFor(view.max-view.min);fitY();c.update("none");syncUI();
}
function readoutAt(day){
  const box=document.getElementById("readout");if(day==null){box.innerHTML=`<div class="rd">Faites glisser le doigt sur le graphique</div><div class="rp">Les moyennes du jour pointé et les sondages publiés autour de cette date s’affichent ici.</div>`;return;}
  const i=Math.max(0,Math.min(trendCache.days.length-1,Math.round(day/7)));
  const items=keysOf().filter(k=>visible.has(k)&&trendCache.s[k][i]!=null).sort((a,b)=>trendCache.s[b][i]-trendCache.s[a][i]);
  const near=allPolls().filter(p=>Math.abs((toD(p.d)-T0)/DAY-day)<=3);
  box.innerHTML=`<div class="rd">Semaine du ${dayLabel(trendCache.days[i],{day:"numeric",month:"long",year:"numeric"})} : moyenne</div><div class="rl">${items.map(k=>`<span><i style="background:${ERA.C[k].c}"></i>${esc(nameOf(k))} ${fmt(trendCache.s[k][i])} %</span>`).join("")||"<span>Aucune donnée</span>"}</div>`+
    `<div class="rp">${near.length?"Sondages autour de cette date : "+near.slice(-4).map(p=>`${esc(p.inst)} (${frDate(p.d)})`).join(", "):"Aucun sondage publié dans les 3 jours."}</div>`;
}
const crosshair={id:"crosshair",
  afterEvent(c,args){const e=args.event;if(["mousemove","touchstart","touchmove","click"].includes(e.type)&&e.x>=c.chartArea.left&&e.x<=c.chartArea.right){c.$cx=e.x;readoutAt(c.scales.x.getValueForPixel(e.x));args.changed=true;}
    else if(e.type==="mouseout"){c.$cx=null;args.changed=true;}},
  afterDraw(c){if(c.$cx==null)return;const x=c.$cx,ctx=c.ctx;ctx.save();ctx.strokeStyle=cssVar("--muted");ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,c.chartArea.top);ctx.lineTo(x,c.chartArea.bottom);ctx.stroke();ctx.restore();}};
const voteLine={id:"voteLine",afterDraw(c){if(!ERA.results)return;const x=c.scales.x.getPixelForValue((toD(ERA.results.d)-T0)/DAY);if(x<c.chartArea.left||x>c.chartArea.right)return;
  const ctx=c.ctx;ctx.save();ctx.strokeStyle=cssVar("--ink");ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,c.chartArea.top);ctx.lineTo(x,c.chartArea.bottom);ctx.stroke();ctx.fillStyle=cssVar("--ink");ctx.font="600 11px Public Sans, sans-serif";ctx.textAlign="right";ctx.fillText("Vote",x-4,c.chartArea.top+12);ctx.restore();}};
if(window.ChartZoom){try{Chart.register(window.ChartZoom);}catch(e){}}
function buildTrend(P){
  killCharts(["trend"]);trendCache=computeTrend(P);
  const ds=[];
  keysOf().forEach(k=>{
    const pts=P.filter(p=>p.s[k]!=null).map(p=>({x:(toD(p.d)-T0)/DAY,y:p.s[k]}));
    const line=trendCache.days.map((d,i)=>({x:d,y:trendCache.s[k][i]})).filter(p=>p.y!=null);
    ds.push({key:k,type:"scatter",data:pts,backgroundColor:ERA.C[k].c+"55",borderColor:"transparent",pointRadius:ERA.live?3.5:2.2,hidden:!visible.has(k)});
    ds.push({key:k,type:"line",data:line,borderColor:ERA.C[k].c,backgroundColor:ERA.C[k].c,borderWidth:2.5,pointRadius:0,tension:.3,spanGaps:true,hidden:!visible.has(k)});
    if(ERA.results&&ERA.results.r1[k]!=null)ds.push({key:k,type:"scatter",data:[{x:(toD(ERA.results.d)-T0)/DAY,y:ERA.results.r1[k]}],pointStyle:"star",pointRadius:9,borderWidth:2,borderColor:ERA.C[k].c,backgroundColor:ERA.C[k].c,hidden:!visible.has(k)});
  });
  const grid=cssVar("--line"),txt=cssVar("--muted");
  CH.trend=new Chart(document.getElementById("trend"),{type:"scatter",data:{datasets:ds},plugins:[crosshair,voteLine],
    options:{responsive:true,maintainAspectRatio:false,animation:false,events:["mousemove","mouseout","click","touchstart","touchmove"],
      plugins:{legend:{display:false},tooltip:{enabled:false},
        zoom:{limits:{x:{min:0,max:MAXD,minRange:7}},pan:{enabled:false},
          zoom:{wheel:{enabled:true},pinch:{enabled:true},mode:"x",onZoomComplete:({chart:c})=>setView(c.scales.x.min,c.scales.x.max,true)}}},
      scales:{x:{type:"linear",min:view.min,max:view.max,grid:{color:grid},ticks:{color:txt,stepSize:stepFor(view.max-view.min),
          callback:v=>(view.max-view.min)<=100?dayLabel(v,{day:"numeric",month:"short"}):dayLabel(v,{month:"short",year:"2-digit"})}},
        y:{min:0,max:40,grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"}}}}});
  setView(view.min,view.max);readoutAt(null);
}
function buildChips(){
  const box=document.getElementById("chips");box.innerHTML="";
  keysOf().forEach(k=>{const b=el("button",{class:"chip","aria-pressed":visible.has(k)},`<i style="background:${ERA.C[k].c}"></i>${esc(ERA.C[k].n)}`);
    b.onclick=()=>{visible.has(k)?visible.delete(k):visible.add(k);b.setAttribute("aria-pressed",visible.has(k));CH.trend.data.datasets.forEach(d=>{if(d.key===k)d.hidden=!visible.has(k);});fitY();CH.trend.update("none");};
    box.appendChild(b);});
  const bar=document.getElementById("zoombar");bar.innerHTML="";
  [["1 mois",31],["3 mois",92],["6 mois",183],["Tout",MAXD]].forEach(([l,d])=>{const b=el("button",{class:"chip","data-d":d,"aria-pressed":"false"},l);b.onclick=()=>setView(MAXD-d,MAXD);bar.appendChild(b);});
  const r=el("button",{class:"chip"},"Réinitialiser");r.onclick=()=>{if(CH.trend.resetZoom)CH.trend.resetZoom("none");setView(0,MAXD);};bar.appendChild(r);
  const f=document.getElementById("rFrom"),t=document.getElementById("rTo");
  f.oninput=()=>{let a=+f.value,b=+t.value;if(a>b-7){a=b-7;f.value=a;}setView(a,b);};
  t.oninput=()=>{let a=+f.value,b=+t.value;if(b<a+7){b=a+7;t.value=b;}setView(a,b);};
}
/* ---- tableaux ---- */
function renderConfront(P){
  const ref=ERA.live?ERA._now:ERA.results.r1;
  const cols=keysOf().filter(k=>ref[k]!=null).sort((a,b)=>ref[b]-ref[a]).slice(0,ERA.live?9:7);
  const endT=ERA.live?Math.max(toD(ERA.end),toD(P[P.length-1].d)):toD(ERA.results.d);
  const last={};P.forEach(p=>{const t=toD(p.d);if(t<=endT&&endT-t<=(ERA.live?40:12)*DAY&&(!last[p.inst]||last[p.inst].d<p.d))last[p.inst]=p;});
  const rows=Object.values(last).sort((a,b)=>b.d.localeCompare(a.d));
  document.getElementById("confTitle").textContent=ERA.live?"Confrontation des instituts":"Le dernier sondage de chaque institut, face au résultat";
  document.getElementById("confLede").textContent=ERA.live?"Le dernier sondage de chaque institut, comparé à la moyenne. Vert : plus que la moyenne ; rouge : moins (écart d’au moins 1,5 point).":"Vert : l’institut donnait plus que le résultat réel ; rouge : moins (écart d’au moins 1,5 point). La dernière colonne donne l’erreur moyenne sur les quatre premiers candidats : plus elle est faible, plus l’institut a vu juste.";
  let h=`<thead><tr><th>Institut</th><th>Terrain</th>${cols.map(k=>`<th>${esc(nameOf(k))}</th>`).join("")}${ERA.live?"":"<th>Erreur moy.</th>"}</tr></thead><tbody>`;
  rows.forEach(p=>{h+=`<tr><td>${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.inst)}</a>`:esc(p.inst)}</td><td>${frDate(p.d)}</td>`;
    cols.forEach(k=>{const v=p.s[k],m=ref[k];let c="";if(v!=null&&m!=null){if(v-m>=1.5)c="hi";else if(m-v>=1.5)c="lo";}h+=`<td class="${c}">${fmt(v)}</td>`;});
    if(!ERA.live){const top=cols.slice(0,4).filter(k=>p.s[k]!=null);const e=top.reduce((s,k)=>s+Math.abs(p.s[k]-ref[k]),0)/(top.length||1);h+=`<td><b>${fmt(Math.round(e*10)/10)}</b></td>`;}
    h+="</tr>";});
  h+=`<tr class="avg"><td>${ERA.live?"Moyenne":"Résultat réel"}</td><td></td>${cols.map(k=>`<td>${fmt(Math.round(ref[k]*10)/10)}</td>`).join("")}${ERA.live?"":"<td></td>"}</tr></tbody>`;
  document.getElementById("confront").innerHTML=h;
}
function renderHouse(P){
  const ref=ERA._now, cols=keysOf().filter(k=>ref[k]!=null).sort((a,b)=>ref[b]-ref[a]).slice(0,5);
  const from=ERA.live?toD("2026-07-08"):T0, H={};
  P.forEach(p=>{const t=toD(p.d);if(t<from)return;const o=H[p.inst]||(H[p.inst]={n:0,s:{}});o.n++;
    cols.forEach(k=>{if(p.s[k]==null)return;const a=avgAt(P,k,t,ERA.live?30:21);if(a==null)return;(o.s[k]=o.s[k]||[]).push(p.s[k]-a);});});
  document.getElementById("houseTitle").textContent="Qui tire dans quel sens ?";
  document.getElementById("houseLede").textContent=`Pour chaque institut, l’écart moyen entre ses sondages et la moyenne du moment${ERA.live?", depuis juillet 2026":", sur toute l’année de campagne"}. C’est « l’effet maison » : il vient surtout des choix de méthode. Un écart mesuré sur un ou deux sondages seulement n’est pas significatif.`;
  let h=`<thead><tr><th>Institut</th><th>Sondages</th>${cols.map(k=>`<th>${esc(nameOf(k))}</th>`).join("")}</tr></thead><tbody>`;
  Object.entries(H).sort((a,b)=>b[1].n-a[1].n).forEach(([n,o])=>{h+=`<tr><td>${esc(n)}</td><td>${o.n}</td>`;
    cols.forEach(k=>{const a=o.s[k];if(!a||!a.length){h+="<td>–</td>";return;}const v=Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10;
      const al=Math.min(Math.abs(v)/4,1)*(o.n<3?.45:1),col=v>0?"var(--up)":"var(--down)";h+=`<td class="c" style="background:color-mix(in srgb,${col} ${Math.round(al*38)}%,transparent)">${v>0?"+":""}${fmt(v)}</td>`;});
    h+="</tr>";});
  document.getElementById("house").innerHTML=h+"</tbody>";
}
function renderDuels(){
  const box=document.getElementById("duelBox");box.innerHTML="";killCharts(["duel"]);
  if(ERA.live){
    document.getElementById("duelLede").textContent="Moyenne des mesures des deux derniers mois (ou les plus récentes si le duel est rarement testé).";
    const nm=k=>esc(k),col=k=>couleurDuel(k);
    const wrap=el("div",{class:"duels"});
    RAW.r2_27.forEach(d=>{let a=d.a,b=d.b,va=d.avgA,vb=d.avgB;if(vb>va){[a,b,va,vb]=[b,a,vb,va];}
      wrap.appendChild(el("div",{class:"duel"},`<div class="lab"><strong>${nm(a)} – ${nm(b)}</strong><small>${d.n} mesure${d.n>1?"s":""} · dernière : ${esc(d.last.inst)}, ${frDate(d.last.d)}</small></div><div class="bar"><span style="width:${va}%;background:${col(a)}">${fmt(va)} %</span><span style="width:${vb}%;background:${col(b)}">${fmt(vb)} %</span></div>`));});
    box.appendChild(wrap);return;
  }
  const r2=ERA.results.r2,D=ERA.duels,lastT=toD(D[D.length-1].d),fin=D.filter(x=>lastT-toD(x.d)<=7*DAY),fa=fin.reduce((s,x)=>s+x.m,0)/fin.length;
  document.getElementById("duelLede").textContent=`Tous les sondages ${r2.a} – ${r2.b} de l’année, puis le résultat du ${frDate(r2.d)}. Faites glisser le doigt sur le graphique pour lire chaque sondage.`;
  box.appendChild(el("div",{class:"duels"},`<div class="duel"><div class="lab"><strong>Derniers sondages</strong><small>moyenne de la dernière semaine</small></div><div class="bar"><span style="width:${fa}%;background:#D9A400">${r2.a} ${fmt(Math.round(fa*10)/10)} %</span><span style="width:${100-fa}%;background:#2B3F9E">${fmt(Math.round((100-fa)*10)/10)} %</span></div></div>
   <div class="duel"><div class="lab"><strong>Résultat réel</strong><small>${frDate(r2.d)}</small></div><div class="bar"><span style="width:${r2.va}%;background:#D9A400">${r2.a} ${fmt(r2.va)} %</span><span style="width:${r2.vb}%;background:#2B3F9E">${fmt(r2.vb)} %</span></div></div>`));
  const cv=el("div",{class:"small-chart",style:"margin-top:14px"},"<canvas aria-label='Sondages de second tour'></canvas>");box.appendChild(cv);
  CH.duel=new Chart(cv.querySelector("canvas"),{type:"scatter",data:{datasets:[
    {label:r2.a,data:D.map(x=>({x:toD(x.d),y:x.m,inst:x.inst})),backgroundColor:"#D9A40099",pointRadius:3},
    {label:"Résultat",data:[{x:toD(r2.d),y:r2.va}],pointStyle:"star",pointRadius:10,borderColor:"#D9A400",backgroundColor:"#D9A400"}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"nearest",axis:"x",intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{title:it=>new Date(it[0].parsed.x).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),label:it=>`${it.raw.inst||"Résultat"} : ${r2.a} ${fmt(it.raw.y)} % – ${r2.b} ${fmt(Math.round((100-it.raw.y)*10)/10)} %`}}},
      scales:{x:{type:"linear",ticks:{color:cssVar("--muted"),maxTicksLimit:6,callback:v=>new Date(v).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"})},grid:{color:cssVar("--line")}},
        y:{suggestedMin:50,suggestedMax:70,ticks:{color:cssVar("--muted"),callback:v=>v+" %"},grid:{color:cssVar("--line")},title:{display:true,text:`Part de ${r2.a}`,color:cssVar("--muted")}}}}});
}
function renderAll(P){
  const cols=Object.keys(ERA._now||{}).filter(k=>ERA._now[k]!=null).sort((a,b)=>ERA._now[b]-ERA._now[a]).slice(0,8);
  let h=`<thead><tr><th>Institut</th><th>Fin de terrain</th><th>Échant.</th>${cols.map(k=>`<th>${esc(nameOf(k))}</th>`).join("")}</tr></thead><tbody>`;
  [...P].reverse().forEach(p=>{h+=`<tr><td>${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.inst)}</a>`:esc(p.inst)}${p.added?" ✚":""}</td><td>${frDate(p.d)}</td><td>${p.n?(+p.n).toLocaleString("fr-FR"):"–"}</td>${cols.map(k=>{const nm=p.names&&p.names[k]&&ERA.C[k].s?` <small style="color:var(--muted)">${esc(String(p.names[k]).split(" ").pop())}</small>`:"";return `<td>${fmt(p.s[k])}${nm}</td>`;}).join("")}</tr>`;});
  document.getElementById("allpolls").innerHTML=h+"</tbody>";
}
function renderPolls(keepView){
  const P=allPolls();
  T0=toD(ERA.start);const endD=ERA.live?Math.max(toD(ERA.end),toD(P[P.length-1].d)+2*DAY):toD(ERA.results.d)+2*DAY;MAXD=Math.round((endD-T0)/DAY);
  if(!keepView)view={min:0,max:MAXD};else{view.max=Math.min(view.max,MAXD);}
  document.getElementById("pollNote").textContent=ERA.note;
  renderHero(P);buildChips();buildTrend(P);renderConfront(P);renderHouse(P);renderDuels();renderAll(P);
}
/* ================= Tranches d’âge ================= */
function ageStack(canvas,A,unit){
  const txt=cssVar("--muted"),grid=cssVar("--line");
  return new Chart(canvas,{type:"bar",data:{labels:A.groups,datasets:A.cols.map((c,j)=>({label:c[1],data:A.v.map(r=>r[j]),backgroundColor:c[2],borderRadius:2}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,font:{size:11}}},tooltip:{itemSort:(a,b)=>b.parsed.x-a.parsed.x,filter:it=>it.parsed.x>0,callbacks:{label:it=>`${it.dataset.label} : ${fmt(it.parsed.x)} %`}}},
      scales:{x:{stacked:true,max:unit||100,grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"}},y:{stacked:true,grid:{display:false},ticks:{color:cssVar("--ink"),font:{size:11}}}}}});
}
function renderAgeVote(){
  killCharts(["age1","age2","age3"]);const A=AGE[Y],box=document.getElementById("ageVote");
  const lead=A.groups.map((g,i)=>{let b=-1,bk=0;A.v[i].forEach((x,j)=>{if(x!=null&&x>b){b=x;bk=j;}});return `<b>${g}</b> : ${A.cols[bk][1]} (${fmt(b)} %)`;}).join(" · ");
  box.innerHTML=`<h2>Le vote par tranche d’âge</h2><p class="lede">${ERA.live?"Intentions de vote au premier tour selon l’âge.":"Ce que chaque tranche d’âge a réellement voté au premier tour."} Faites glisser le doigt sur une barre pour lire les scores, du plus fort au plus faible.</p>
    <p class="hint" style="margin-bottom:8px">En tête — ${lead}</p>
    <div class="bars-box" style="height:${A.groups.length*48+110}px"><canvas aria-label="Vote par tranche d’âge"></canvas></div>
    <p class="hint">Source : ${A.src}${ERA.live?" Attention : dans un sondage de 1 000 personnes, il n’y a qu’une centaine de 18-24 ans, soit une marge d’erreur de 8 à 10 points sur cette tranche. C’est pour cela que la page fait la moyenne de plusieurs sondages. Les candidats absents de certains sondages sont moyennés sur ceux où ils sont testés : les totaux ne font donc pas exactement 100 %.":""}</p>`+
    (A.abst?`<h2 style="margin-top:18px;font-size:1.1rem">Qui n’est pas allé voter ?</h2><p class="lede">Part d’abstention dans chaque tranche d’âge au premier tour. Les jeunes votent beaucoup moins : leur poids réel dans le résultat est donc plus faible que leur poids dans la population.</p><div class="small-chart" style="height:230px"><canvas aria-label="Abstention par âge"></canvas></div>`:"")+
    (A.votants?`<h2 style="margin-top:18px;font-size:1.1rem">Qui a vraiment fait l’élection ?</h2><p class="lede">Poids de chaque tranche d’âge parmi les inscrits, puis parmi les votants du premier tour. ${votantsPhrase(A)}</p><div class="small-chart" style="height:250px"><canvas aria-label="Part des votants par âge"></canvas></div><p class="hint">Calcul : part des inscrits × participation de la tranche, ramenée à 100. Inscrits : ${A.votants.src} Abstention : ${A.src}</p>`:"");
  CH.age1=ageStack(box.querySelector("canvas"),A,ERA.live?110:100);
  if(A.abst){const txt=cssVar("--muted");CH.age2=new Chart(box.querySelectorAll("canvas")[1],{type:"bar",data:{labels:A.groups,datasets:[{label:"Abstention",data:A.abst,backgroundColor:A.abst.map(v=>v>=35?"#B23A3A":v>=25?"#D97706":"#64748B"),borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>`Abstention : ${it.parsed.y} %`}}},
      scales:{x:{ticks:{color:txt,font:{size:10}},grid:{display:false}},y:{beginAtZero:true,max:50,ticks:{color:txt,callback:v=>v+" %"},grid:{color:cssVar("--line")}}}}});}
  if(A.votants){const txt=cssVar("--muted"),V=A.votants;CH.age3=new Chart(box.querySelectorAll("canvas")[A.abst?2:1],{type:"bar",data:{labels:A.groups,datasets:[
      {label:"Part des inscrits",data:V.inscrits,backgroundColor:"#94A3B8",borderRadius:3},{label:"Part des votants",data:V.votants,backgroundColor:"#2563EB",borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,font:{size:11}}},
      tooltip:{callbacks:{label:it=>`${it.dataset.label} : ${fmt(it.parsed.y)} %`,afterBody:its=>{const i=its[0].dataIndex,d=V.votants[i]-V.inscrits[i];return `Écart : ${d>0?"+":""}${fmt(Math.round(d*10)/10)} point${Math.abs(d)>=2?"s":""}`;}}}},
      scales:{x:{ticks:{color:txt,font:{size:10}},grid:{display:false}},y:{beginAtZero:true,ticks:{color:txt,callback:v=>v+" %"},grid:{color:cssVar("--line")}}}}});}
}
function votantsPhrase(A){
  const V=A.votants,n=A.groups.length,jeunes=V.votants[0]+V.votants[1],jeunesI=V.inscrits[0]+V.inscrits[1],vieux=V.votants[n-2]+V.votants[n-1],vieuxI=V.inscrits[n-2]+V.inscrits[n-1];
  return `Les moins de 35 ans représentent ${fmt(Math.round(jeunesI*10)/10)} % des inscrits mais seulement ${fmt(Math.round(jeunes*10)/10)} % des votants ; les 60 ans et plus, ${fmt(Math.round(vieuxI*10)/10)} % des inscrits et ${fmt(Math.round(vieux*10)/10)} % des votants.`;
}
function renderAgePop(){
  const box=document.getElementById("popBlocks");
  const b=el("div",{class:"block"});box.insertBefore(b,box.children[1]||null);
  if(!ERA.live){b.innerHTML=`<h2>Popularité par tranche d’âge</h2><p class="lede" style="margin:0">Les séries mensuelles par âge des instituts ne sont pas publiées de façon comparable pour ${Y} : cette rubrique n’existe que pour 2027. En revanche, l’onglet Sondages montre le vote réel de chaque tranche d’âge cette année-là.</p>`;return;}
  const keys=Object.keys(POPAGE.v).sort((a,c)=>POPAGE.v[c][4]-POPAGE.v[a][4]);
  const show=new Set(["rn","bardella","philippe","melenchon","glucksmann","macron","lecornu"]);
  b.innerHTML=`<h2>Popularité par tranche d’âge</h2><p class="lede">Part de bonnes opinions selon l’âge, en octobre 2026. Une ligne qui monte vers la droite : personnalité plus appréciée des seniors ; qui descend : plus appréciée des jeunes. Touchez un nom dans la légende pour l’afficher ou le masquer, glissez le doigt pour lire les chiffres.</p>
   <p class="hint" style="margin-bottom:8px">Écart le plus fort : Jean-Luc Mélenchon passe de ${POPAGE.v.melenchon[0]} % chez les 18-24 ans à ${POPAGE.v.melenchon[4]} % chez les 65 ans et plus ; Sébastien Lecornu fait l’inverse (${POPAGE.v.lecornu[0]} % → ${POPAGE.v.lecornu[4]} %).</p>
   <div class="bars-box tall"><canvas aria-label="Popularité par âge"></canvas></div><p class="hint">Source : ${POPAGE.src} Sous-échantillons de 100 à 300 personnes : marge d’erreur de 5 à 10 points par tranche.</p>`;
  CH.popAge=lineChart(b.querySelector("canvas"),POPAGE.groups,keys.map(k=>({label:POPN[k],data:POPAGE.v[k],borderColor:POPC[k],backgroundColor:POPC[k],borderWidth:2.4,pointRadius:3,tension:.2,hidden:!show.has(k)})));
}
function renderAgeMedia(){
  killCharts(["medAge"]);const b=document.getElementById("ageMedia");
  if(!ERA.live){b.innerHTML=`<h2>L’âge des publics</h2><p class="lede" style="margin:0">Données d’audience par âge disponibles ici pour la période actuelle seulement : passez sur 2027 pour les voir.</p>`;return;}
  b.innerHTML=`<h2>L’âge des publics</h2><p class="lede">Âge moyen des téléspectateurs de chaque chaîne. Les chaînes d’information sont en orange. Plus l’âge est élevé, plus la chaîne parle surtout aux retraités, qui sont aussi ceux qui votent le plus.</p>
   <div class="bars-box" style="height:${TVAGE.length*30+60}px"><canvas aria-label="Âge moyen des téléspectateurs"></canvas></div>
   <ul class="linklist">
    <li><b>Chez les 25-49 ans</b>, BFMTV fait près du double de CNews en septembre 2026 (3 % de part d’audience contre 1,6 %), alors que les deux chaînes sont à égalité sur l’ensemble du public : CNews doit sa place à un public plus âgé.</li>
    <li><b>Les 18-24 ans s’informent ailleurs</b> : 41 % d’entre eux suivent l’actualité via des influenceurs ou comptes spécialisés sur les réseaux sociaux, contre 17 % des 55-64 ans et 4 % des 65 ans et plus (Ipsos).</li>
   </ul>
   <p class="hint">Sources : Médiamétrie, âges moyens fin 2025 tels que relayés publiquement (chaînes d’info : chiffres de fin 2025, à prendre comme ordre de grandeur) ; Médiamat mensuel de septembre 2026 ; Ipsos bva.</p>`;
  const txt=cssVar("--muted");
  CH.medAge=new Chart(b.querySelector("canvas"),{type:"bar",data:{labels:TVAGE.map(x=>x[0]),datasets:[{label:"Âge moyen",data:TVAGE.map(x=>x[1]),backgroundColor:TVAGE.map(x=>x[2]==="i"?"#D97706":"#64748B"),borderRadius:3}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>`Âge moyen : ${fmt(it.parsed.x)} ans`}}},
      scales:{x:{min:40,max:70,ticks:{color:txt,callback:v=>v+" ans"},grid:{color:cssVar("--line")}},y:{ticks:{color:cssVar("--ink")},grid:{display:false}}}}});
}
/* ================= Assemblée nationale ================= */
// [sigle, nom, sièges, couleur, famille, président, position]
const FAM=["Gauche radicale","Écologistes","Socialistes","Centre indépendant","Bloc central","Droite","Extrême droite","Non-inscrits"];
const FAMC=["#C8203E","#2E9E5B","#E8679A","#C9A227","#D9A400","#4A78D0","#2B3F9E","#A3A3A3"];
const ANKEYS=Object.keys(AN).sort(), ERA_AN={"2017":ANKEYS.find(k=>k>="2017")||ANKEYS[0],"2022":ANKEYS.find(k=>k>="2022")||ANKEYS[0],"2027":ANKEYS[ANKEYS.length-1]};
let ANCUR=ANKEYS[ANKEYS.length-1], COAL=new Set();
function seatPositions(N,rows){
  const R0=0.38,pts=[],radii=[];for(let i=0;i<rows;i++)radii.push(R0+(1-R0)*i/(rows-1));
  const tot=radii.reduce((a,b)=>a+b,0);let left=N;const per=radii.map((r,i)=>{const n=i===rows-1?left:Math.round(N*r/tot);left-=n;return n;});
  radii.forEach((r,i)=>{const n=per[i];for(let j=0;j<n;j++){const a=Math.PI-(Math.PI*(j+.5)/n);pts.push({a,x:r*Math.cos(a),y:r*Math.sin(a),r});}});
  return pts.sort((p,q)=>q.a-p.a||p.r-q.r);
}
const SEATS=seatPositions(577,13);
function renderHemi(){
  const A=AN[ANCUR],svg=document.getElementById("hemi"),W=360,H=196,cx=W/2,cy=H-8,S=170;
  const order=[];A.g.forEach((g,i)=>{for(let k=0;k<g[2];k++)order.push(i);});for(let k=0;k<A.vac;k++)order.push(-1);
  let out="";SEATS.forEach((p,i)=>{const gi=order[i];const g=A.g[gi];const fill=gi<0?"var(--line)":g[3];const dim=COAL.size&&gi>=0&&!COAL.has(g[0]);
    out+=`<circle cx="${(cx+p.x*S).toFixed(1)}" cy="${(cy-p.y*S).toFixed(1)}" r="4.1" fill="${fill}" data-g="${gi}" opacity="${dim?.18:1}"/>`;});
  const tot=A.g.reduce((s,g)=>s+g[2],0);
  out+=`<text x="${cx}" y="${cy-30}" text-anchor="middle" style="font:800 26px 'Schibsted Grotesk',sans-serif;fill:var(--ink)">${COAL.size?A.g.filter(g=>COAL.has(g[0])).reduce((s,g)=>s+g[2],0):tot}</text><text x="${cx}" y="${cy-12}" text-anchor="middle" style="font:500 10px 'Public Sans',sans-serif;fill:var(--muted)">${COAL.size?"députés dans votre coalition":"députés en exercice"}</text>`;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.innerHTML=out;
  svg.onclick=e=>{const gi=+e.target.getAttribute("data-g");if(isNaN(gi)||gi<0)return;showGroup(gi);};
  svg.onmousemove=e=>{const gi=+e.target.getAttribute("data-g");if(!isNaN(gi)&&gi>=0)showGroup(gi);};
  document.getElementById("hemiSub").textContent=A.sub;
  renderCoal();
}
function showGroup(gi){const A=AN[ANCUR],g=A.g[gi],tot=A.g.reduce((s,x)=>s+x[2],0);
  document.getElementById("hemiInfo").innerHTML=`<div class="rd"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${g[3]};margin-right:6px"></i>${esc(g[1])} (${g[0]})</div><div class="rl"><span><b>${g[2]}</b> députés</span><span>${fmt(Math.round(g[2]/tot*1000)/10)} % des sièges</span><span>Président·e : ${esc(g[5])}</span><span>${esc(g[6])}</span></div><div class="rp">Famille : ${FAM[g[4]]}. Touchez le groupe dans la liste ci-dessous pour l’ajouter à une coalition.</div>`;}
function renderCoal(){
  const A=AN[ANCUR],box=document.getElementById("coalChips");box.innerHTML="";
  A.g.forEach(g=>{const b=el("button",{class:"chip","aria-pressed":String(COAL.has(g[0]))},`<i style="background:${g[3]}"></i>${g[0]} · ${g[2]}`);
    b.onclick=()=>{COAL.has(g[0])?COAL.delete(g[0]):COAL.add(g[0]);renderHemi();};box.appendChild(b);});
  const tot=A.g.reduce((s,x)=>s+x[2],0)+A.vac,maj=Math.floor(tot/2)+1,sum=A.g.filter(g=>COAL.has(g[0])).reduce((s,g)=>s+g[2],0);
  const pct=Math.min(100,sum/tot*100),mp=maj/tot*100;
  document.getElementById("coalBar").innerHTML=`<div style="position:relative;height:22px;background:var(--soft);border-radius:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${sum>=maj?"var(--up)":"var(--accent)"}"></div><div style="position:absolute;top:0;bottom:0;left:${mp}%;width:2px;background:var(--ink)"></div></div>
   <p class="hint">${COAL.size?`<b>${sum}</b> députés : ${sum>=maj?`majorité absolue atteinte (${sum-maj+1} de marge).`:`il en manque <b>${maj-sum}</b> pour la majorité absolue (${maj}).`}`:`Sélectionnez des groupes pour composer une coalition. Majorité absolue : ${maj} sièges.`}</p>`;
}
function renderANcompare(){
  killCharts(["anFam","anGrp"]);const txt=cssVar("--muted"),grid=cssVar("--line");
  const fam=k=>{const v=FAM.map(()=>0);AN[k].g.forEach(g=>v[g[4]]+=g[2]);return v;};
  CH.anFam=new Chart(document.getElementById("anFam"),{type:"bar",data:{labels:FAM,datasets:ANKEYS.map((k,i)=>({label:AN[k].label,data:fam(k),backgroundColor:["#CBD5E1","#94A3B8","#64748B","#23408E"][i],borderRadius:3}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{callbacks:{label:it=>`${it.dataset.label} : ${it.parsed.x} sièges`}}},
      scales:{x:{grid:{color:grid},ticks:{color:txt}},y:{grid:{display:false},ticks:{color:cssVar("--ink"),font:{size:11}}}}}});
  const a=document.getElementById("anA").value,b=document.getElementById("anB").value,fa=fam(a),fb=fam(b);
  CH.anGrp=new Chart(document.getElementById("anDiff"),{type:"bar",data:{labels:FAM,datasets:[{label:`Évolution ${AN[a].label} → ${AN[b].label}`,data:FAM.map((_,i)=>fb[i]-fa[i]),backgroundColor:FAM.map((_,i)=>fb[i]-fa[i]>=0?"#1F7A4D":"#B23A3A"),borderRadius:3}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>`${fa[it.dataIndex]} → ${fb[it.dataIndex]} sièges (${it.parsed.x>0?"+":""}${it.parsed.x})`}}},
      scales:{x:{grid:{color:grid},ticks:{color:txt,callback:v=>(v>0?"+":"")+v}},y:{grid:{display:false},ticks:{color:cssVar("--ink"),font:{size:11}}}}}});
}
function renderAN(){
  ANCUR=ERA_AN[Y];COAL=new Set();
  const sel=document.getElementById("anDates");sel.innerHTML="";
  ANKEYS.forEach(k=>{const b=el("button",{class:"chip","aria-pressed":String(k===ANCUR)},AN[k].label);b.onclick=()=>{ANCUR=k;COAL=new Set();[...sel.children].forEach(c=>c.setAttribute("aria-pressed",String(c===b)));renderHemi();document.getElementById("hemiInfo").innerHTML="";renderGroupTable();};sel.appendChild(b);});
  const A=document.getElementById("anA"),B=document.getElementById("anB");
  if(!A.options.length){ANKEYS.forEach(k=>{A.add(new Option(AN[k].label,k));B.add(new Option(AN[k].label,k));});A.value=ANKEYS[0];B.value=ANKEYS[ANKEYS.length-1];A.onchange=B.onchange=renderANcompare;}
  renderHemi();document.getElementById("hemiInfo").innerHTML=`<div class="rd">Touchez ou survolez un siège</div><div class="rp">Le groupe, son nombre de députés, sa part et son président s’affichent ici.</div>`;renderGroupTable();renderANcompare();
}
function renderGroupTable(){
  const A=AN[ANCUR],tot=A.g.reduce((s,x)=>s+x[2],0);
  document.getElementById("anTable").innerHTML=`<thead><tr><th>Groupe</th><th>Sièges</th><th>Part</th><th>Président·e</th></tr></thead><tbody>`+A.g.map(g=>`<tr><td><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${g[3]};margin-right:6px"></i>${esc(g[0])} <small style="color:var(--muted)">${esc(g[1])}</small></td><td>${g[2]}</td><td>${fmt(Math.round(g[2]/tot*1000)/10)} %</td><td>${esc(g[5])}</td></tr>`).join("")+(A.vac?`<tr><td>Sièges vacants</td><td>${A.vac}</td><td></td><td></td></tr>`:"")+"</tbody>";
}
/* ================= Comparer ================= */
const FAMS=[
 {n:"Rassemblement national (FN/RN)",m:{"2017":"lepen","2022":"lepen","2027":"rn"},lab:{"2017":"Le Pen","2022":"Le Pen","2027":"Le Pen / Bardella"}},
 {n:"Jean-Luc Mélenchon (LFI)",m:{"2017":"melenchon","2022":"melenchon","2027":"melenchon"},lab:{"2017":"Mélenchon","2022":"Mélenchon","2027":"Mélenchon"}},
 {n:"Bloc central (Macron, puis Philippe)",m:{"2017":"macron","2022":"macron","2027":"philippe"},lab:{"2017":"Macron","2022":"Macron","2027":"Philippe"}},
 {n:"Les Républicains",m:{"2017":"lr","2022":"lr","2027":"retailleau"},lab:{"2017":"candidat LR","2022":"candidat LR","2027":"Retailleau"}},
 {n:"Parti socialiste et alliés",m:{"2017":"ps","2022":"ps","2027":"glucksmann"},lab:{"2017":"candidat PS","2022":"Hidalgo","2027":"Glucksmann"}},
 {n:"Écologistes",m:{"2017":"eelv","2022":"eelv","2027":"tondelier"},lab:{"2017":"Jadot/Duflot","2022":"Jadot","2027":"Tondelier"}},
 {n:"Éric Zemmour (Reconquête)",m:{"2022":"zemmour","2027":"zemmour"},lab:{"2022":"Zemmour","2027":"Zemmour"}}
];
const ERAC={"2017":"#94A3B8","2022":"#64748B","2027":"#23408E"};
function weeklyFor(y,k){
  const E=ERAS[y],P=E.polls;
  const vote=toD(VOTE[y]),start=toD(E.start),end=y==="2027"?Math.max(...P.map(p=>toD(p.d))):vote,win=y==="2027"?45:21,out=[];
  for(let t=start;t<=end;t+=7*DAY){const v=avgAt(P,k,t,win);if(v!=null)out.push({x:Math.round((t-vote)/DAY),y:Math.round(v*10)/10});}
  return out;
}
let CMP={fam:0,a:null,b:null,inst:null,ck:null};
function renderCompare(){
  killCharts(Object.keys(CH).filter(k=>k.startsWith("cmp")));const txt=cssVar("--muted"),grid=cssVar("--line");
  /* 1. trois campagnes */
  const fs=document.getElementById("cmpFam");if(!fs.options.length){FAMS.forEach((f,i)=>fs.add(new Option(f.n,i)));fs.onchange=()=>{CMP.fam=+fs.value;renderCompare();};}
  const F=FAMS[CMP.fam],sets=[];
  Object.keys(F.m).forEach(y=>{const d=weeklyFor(y,F.m[y]);sets.push({label:`${y} · ${F.lab[y]}`,data:d,borderColor:ERAC[y],backgroundColor:ERAC[y],borderWidth:y==="2027"?3.5:2.2,pointRadius:0,tension:.3,showLine:true});
    const R=ERAS[y].results;if(R&&R.r1[F.m[y]]!=null)sets.push({label:`Résultat ${y}`,data:[{x:0,y:R.r1[F.m[y]]}],pointStyle:"star",pointRadius:9,borderColor:ERAC[y],backgroundColor:ERAC[y],showLine:false});});
  const now27=Math.round((Math.max(...allPollsFor27().map(p=>toD(p.d)))-toD(VOTE["2027"]))/DAY);
  CH.cmp1=new Chart(document.getElementById("cmp1"),{type:"scatter",data:{datasets:sets},plugins:[{id:"today",afterDraw(c){const x=c.scales.x.getPixelForValue(now27);const ctx=c.ctx;ctx.save();ctx.strokeStyle=cssVar("--accent");ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,c.chartArea.top);ctx.lineTo(x,c.chartArea.bottom);ctx.stroke();ctx.fillStyle=cssVar("--accent");ctx.font="600 10px Public Sans,sans-serif";ctx.fillText("aujourd’hui",x+3,c.chartArea.top+10);ctx.restore();}}],
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"nearest",axis:"x",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,filter:i=>!i.text.startsWith("Résultat")}},tooltip:{callbacks:{title:it=>`${Math.abs(it[0].parsed.x)} jours avant le 1er tour`,label:it=>`${it.dataset.label} : ${fmt(it.parsed.y)} %`}}},
      scales:{x:{type:"linear",min:-370,max:5,grid:{color:grid},ticks:{color:txt,stepSize:60,callback:v=>v===0?"Vote":`J${v}`}},y:{beginAtZero:true,grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"}}}}});
  const at=y=>{const d=weeklyFor(y,F.m[y]);let best=null;d.forEach(p=>{if(!best||Math.abs(p.x-now27)<Math.abs(best.x-now27))best=p;});return best&&Math.abs(best.x-now27)<15?best.y:null;};
  document.getElementById("cmp1txt").innerHTML=`À ${Math.abs(now27)} jours du vote : `+Object.keys(F.m).map(y=>{const v=at(y);return `<b>${y}</b> ${F.lab[y]} ${v==null?"pas encore testé":fmt(v)+" %"}`;}).join(" · ")+(F.m["2017"]?`. Résultats réels : `+["2017","2022"].filter(y=>F.m[y]&&ERAS[y].results.r1[F.m[y]]!=null).map(y=>`${y} ${fmt(ERAS[y].results.r1[F.m[y]])} %`).join(", "):"")+".";
  /* 2. duel de courbes (élection choisie en haut) */
  const keys=keysOf(),sa=document.getElementById("cmpA"),sb=document.getElementById("cmpB");
  if(!CMP.a||!ERA.C[CMP.a]||!ERA.C[CMP.b]||CMP.y!==Y){CMP.y=Y;const top=Object.keys(ERA._now).filter(k=>ERA._now[k]!=null).sort((a,b)=>ERA._now[b]-ERA._now[a]);CMP.a=top[1]||top[0];CMP.b=top[2]||top[1];}
  sa.innerHTML=sb.innerHTML="";keys.forEach(k=>{sa.add(new Option(ERA.C[k].n,k));sb.add(new Option(ERA.C[k].n,k));});sa.value=CMP.a;sb.value=CMP.b;
  sa.onchange=()=>{CMP.a=sa.value;renderCompare();};sb.onchange=()=>{CMP.b=sb.value;renderCompare();};
  const tr=computeTrend(allPolls()),la=[],lb=[],gap=[];tr.days.forEach((d,i)=>{const x=T0+d*DAY,va=tr.s[CMP.a][i],vb=tr.s[CMP.b][i];la.push({x,y:va});lb.push({x,y:vb});gap.push({x,y:va!=null&&vb!=null?Math.round((va-vb)*10)/10:null});});
  const ca=ERA.C[CMP.a].c,cb=ERA.C[CMP.b].c;
  CH.cmp2=new Chart(document.getElementById("cmp2"),{type:"line",data:{datasets:[
    {label:ERA.C[CMP.a].n,data:la,borderColor:ca,backgroundColor:ca,borderWidth:2.5,pointRadius:0,tension:.3,spanGaps:true,yAxisID:"y"},
    {label:ERA.C[CMP.b].n,data:lb,borderColor:cb,backgroundColor:cb,borderWidth:2.5,pointRadius:0,tension:.3,spanGaps:true,yAxisID:"y"},
    {label:"Écart",data:gap,borderColor:"transparent",backgroundColor:"rgba(100,116,139,.28)",fill:"origin",pointRadius:0,tension:.3,spanGaps:true,yAxisID:"y2"}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},parsing:{xAxisKey:"x",yAxisKey:"y"},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{callbacks:{title:it=>new Date(it[0].parsed.x).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),label:it=>it.parsed.y==null?null:`${it.dataset.label} : ${it.dataset.label==="Écart"&&it.parsed.y>0?"+":""}${fmt(it.parsed.y)}${it.dataset.label==="Écart"?" pt":" %"}`}}},
      scales:{x:{type:"linear",grid:{color:grid},ticks:{color:txt,maxTicksLimit:6,callback:v=>new Date(v).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"})}},
        y:{beginAtZero:true,grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"},title:{display:true,text:"Moyenne",color:txt}},
        y2:{position:"right",grid:{display:false},ticks:{color:txt,callback:v=>(v>0?"+":"")+v},title:{display:true,text:"Écart (zone grise)",color:txt}}}}});
  const P=allPolls().filter(p=>p.s[CMP.a]!=null&&p.s[CMP.b]!=null),ahead=P.filter(p=>p.s[CMP.a]>p.s[CMP.b]).length,g=gap.filter(x=>x.y!=null);
  const mx=g.reduce((m,x)=>Math.abs(x.y)>Math.abs(m.y)?x:m,g[0]||{y:0,x:0}),last=g[g.length-1];
  document.getElementById("cmp2txt").innerHTML=P.length?`<b>${esc(ERA.C[CMP.a].n)}</b> devance <b>${esc(ERA.C[CMP.b].n)}</b> dans <b>${ahead}</b> sondages sur ${P.length} où les deux sont testés. Écart le plus grand : ${mx.y>0?"+":""}${fmt(mx.y)} point${Math.abs(mx.y)>=2?"s":""} (${new Date(mx.x).toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}). Dernier écart : ${last.y>0?"+":""}${fmt(last.y)}.`:"Ces deux candidats n’ont jamais été testés dans le même sondage.";
  /* 3. un institut face à la moyenne */
  const insts=[...new Set(allPolls().map(p=>p.inst))].sort(),si=document.getElementById("cmpI"),sk=document.getElementById("cmpK");
  if(!CMP.inst||!insts.includes(CMP.inst))CMP.inst=insts.includes("Ifop")?"Ifop":insts[0];if(!CMP.ck||!ERA.C[CMP.ck]||CMP.yk!==Y){CMP.yk=Y;CMP.ck=Object.keys(ERA._now).sort((a,b)=>(ERA._now[b]||0)-(ERA._now[a]||0))[0];}
  si.innerHTML="";insts.forEach(i=>si.add(new Option(i,i)));si.value=CMP.inst;sk.innerHTML="";keys.forEach(k=>sk.add(new Option(ERA.C[k].n,k)));sk.value=CMP.ck;
  si.onchange=()=>{CMP.inst=si.value;renderCompare();};sk.onchange=()=>{CMP.ck=sk.value;renderCompare();};
  const k=CMP.ck,ki=keysOf().indexOf(k),avgL=tr.days.map((d,i)=>({x:T0+d*DAY,y:tr.s[k][i]})).filter(p=>p.y!=null);
  const mine=allPolls().filter(p=>p.inst===CMP.inst&&p.s[k]!=null),others=allPolls().filter(p=>p.inst!==CMP.inst&&p.s[k]!=null);
  CH.cmp3=new Chart(document.getElementById("cmp3"),{type:"scatter",data:{datasets:[
    {label:"Moyenne tous instituts",data:avgL,showLine:true,borderColor:ERA.C[k].c,backgroundColor:ERA.C[k].c,borderWidth:2.5,pointRadius:0,tension:.3},
    {label:"Autres instituts",data:others.map(p=>({x:toD(p.d),y:p.s[k],i:p.inst})),backgroundColor:"rgba(148,163,184,.45)",pointRadius:2.5},
    {label:CMP.inst,data:mine.map(p=>({x:toD(p.d),y:p.s[k],i:p.inst})),backgroundColor:"#C2410C",borderColor:"#fff",borderWidth:1,pointRadius:5.5}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"nearest",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{callbacks:{title:it=>new Date(it[0].parsed.x).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),label:it=>`${it.raw.i||it.dataset.label} : ${fmt(it.parsed.y)} %`}}},
      scales:{x:{type:"linear",grid:{color:grid},ticks:{color:txt,maxTicksLimit:6,callback:v=>new Date(v).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"})}},y:{grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"}}}}});
  const diffs=mine.map(p=>{const a=avgAt(allPolls(),k,toD(p.d),ERA.live?30:21);return a==null?null:p.s[k]-a;}).filter(x=>x!=null),md=diffs.length?diffs.reduce((a,b)=>a+b,0)/diffs.length:null;
  document.getElementById("cmp3txt").innerHTML=mine.length?`${esc(CMP.inst)} a publié <b>${mine.length}</b> sondages avec ${esc(ERA.C[k].n)}. En moyenne, il le donne à <b>${md>0?"+":""}${fmt(Math.round(md*10)/10)} point${Math.abs(md)>=2?"s":""}</b> de la moyenne des autres instituts du moment.`:`${esc(CMP.inst)} n’a pas testé ce candidat.`;
  /* 4. popularité des présidents */
  const ps=["2017","2022","2027"].map(y=>{const w=RAW.pop[y].pres[1],s=popSets(w,"#000").avg;return {y,name:RAW.pop[y].pres[0],pts:w.months.map((m,i)=>({x:Math.round((toD(m+"-15")-toD(VOTE[y]))/30.4),y:s[i]})).filter(p=>p.y!=null)};});
  CH.cmp4=new Chart(document.getElementById("cmp4"),{type:"scatter",data:{datasets:ps.map(p=>({label:`${p.name} (${p.y==="2027"?"2025-26":p.y==="2022"?"2021-22":"2016-17"})`,data:p.pts,showLine:true,borderColor:ERAC[p.y],backgroundColor:ERAC[p.y],borderWidth:p.y==="2027"?3.5:2.2,pointRadius:3,tension:.25}))},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"x",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{callbacks:{title:it=>`${Math.abs(it[0].parsed.x)} mois avant le 1er tour`,label:it=>`${it.dataset.label} : ${fmt(it.parsed.y)} %`}}},
      scales:{x:{type:"linear",min:-13,max:0,grid:{color:grid},ticks:{color:txt,stepSize:1,callback:v=>v===0?"Vote":`M${v}`}},y:{beginAtZero:true,grid:{color:grid},ticks:{color:txt,callback:v=>v+" %"}}}}});
}
function allPollsFor27(){return RAW.p27;}
/* ================= Citations dans les médias ================= */
const TCOL={"TV":"#0EA5E9","Radio":"#F59E0B","Presse":"#64748B","Magazine":"#A855F7","En ligne":"#10B981","Autre":"#A3A3A3"};
const BLOCN={extreme_gauche:"Extrême gauche",gauche_radicale:"Gauche radicale",gauche:"Gauche",centre:"Centre",centre_droit:"Centre-droit",droite:"Droite",droite_souverainiste:"Droite souverainiste",extreme_droite:"Extrême droite"};
const BLOCC={extreme_gauche:"#9F1239",gauche_radicale:"#C8203E",gauche:"#E8679A",centre:"#D9A400",centre_droit:"#1E9CC4",droite:"#4A78D0",droite_souverainiste:"#5E7A8C",extreme_droite:"#2B3F9E"};
const NETN={x:"X",instagram:"Instagram",facebook:"Facebook",tiktok:"TikTok",linkedin:"LinkedIn",bluesky:"Bluesky",youtube:"YouTube",threads:"Threads"};
const NETC={x:"#111827",instagram:"#E1306C",facebook:"#1877F2",tiktok:"#14B8A6",linkedin:"#0A66C2",bluesky:"#60A5FA",youtube:"#DC2626",threads:"#6B7280"};
let CIT={per:"12m",met:0,sel:new Set(["Marine Le Pen","Jordan Bardella","Jean-Luc Mélenchon","Édouard Philippe","Bruno Retailleau","Raphaël Glucksmann"]),cand:"Jean-Luc Mélenchon",media:"BFMTV",bloc:"tous"};
const svCol=n=>BLOCC[(SV.c.find(c=>c.n===n)||{}).b]||"#888";
function renderCit(){
  killCharts(Object.keys(CH).filter(k=>k.startsWith("cit")));
  const box=document.getElementById("citBox");
  if(!ERA.live){box.innerHTML=`<div class="block"><h2>Citations dans les médias</h2><p class="lede" style="margin:0">Ces données ne sont mesurées qu’à partir de janvier 2024 : cette rubrique n’existe que pour 2027.</p></div>`;return;}
  const txt=cssVar("--muted"),grid=cssVar("--line"),ink=cssVar("--ink");
  box.innerHTML=`
  <div class="block updater">
    <h2>1. Qui est le plus cité ?</h2>
    <p class="lede">Nombre de publications de journalistes et de médias politiques qui nomment chaque personnalité sur les réseaux sociaux. Choisissez la période, la mesure et le camp. Glissez le doigt sur une barre pour le détail.</p>
    <div class="chips" id="citPer"></div><div class="chips" id="citMet"></div><div class="chips" id="citBloc"></div>
    <p class="hint" id="citPerTxt"></p>
    <div class="bars-box" id="citRankBox"><canvas id="citRank" aria-label="Classement des citations"></canvas></div>
  </div>
  <div class="block">
    <h2>2. Semaine par semaine</h2>
    <p class="lede">Citations par les journalistes et médias, sur les 52 dernières semaines. Touchez des noms pour comparer jusqu’à 8 personnalités.</p>
    <div class="chips" id="citSel"></div>
    <div class="bars-box tall"><canvas id="citWeek" aria-label="Citations par semaine"></canvas></div>
  </div>
  <div class="block updater">
    <h2>3. Par type de média</h2>
    <p class="lede">Pour chaque personnalité, les six médias qui la citent le plus sur 12 mois, regroupés par type. Montre où elle est surtout reprise : à la télé, à la radio, dans la presse ou en ligne.</p>
    <div class="bars-box tall" id="citTypeBox"><canvas id="citType" aria-label="Citations par type de média"></canvas></div>
  </div>
  <div class="block updater">
    <h2>4. Une chaîne ou un journal</h2>
    <p class="lede">Choisissez un média : de qui parle-t-il le plus ? Seules les personnalités pour lesquelles ce média fait partie des six qui la citent le plus sont comptées.</p>
    <label for="citMedia">Média</label><select id="citMedia"></select>
    <p class="hint" id="citMediaTxt" style="margin:8px 0"></p>
    <div class="bars-box" id="citMediaBox"><canvas id="citMed" aria-label="Personnalités citées par ce média"></canvas></div>
  </div>
  <div class="block updater">
    <h2>5. Une personnalité en détail</h2>
    <label for="citCand">Personnalité</label><select id="citCand"></select>
    <div id="citCandTxt" class="hint" style="margin:8px 0"></div>
    <div class="small-chart"><canvas id="citCMed" aria-label="Médias qui la citent"></canvas></div>
    <h3 style="margin:14px 0 4px;font-size:1rem">Sur quels réseaux elle est citée</h3>
    <div class="small-chart" style="height:120px"><canvas id="citCNet" aria-label="Réseaux"></canvas></div>
  </div>
  <div class="block"><h2>Ce que mesurent ces chiffres</h2><p class="lede" style="margin:0">Une « citation » est une publication d’un compte de journaliste ou de média politique (sur X, Instagram, Facebook, TikTok, LinkedIn, Bluesky ou YouTube) qui nomme la personnalité, hors partages. C’est un indicateur de visibilité, pas de temps d’antenne : le temps de parole à la télévision et à la radio est relevé par l’Arcom, qui le publie chaque trimestre. Le relevé couvre 34 personnalités engagées ou pressenties ; les données s’arrêtent au 1er octobre 2026. Source : Saper Vedere, benchmark « Présidentielle 2027 ».</p></div>`;
  // --- 1. classement
  const perB=document.getElementById("citPer");Object.entries(SV.per).forEach(([k,v])=>{const b=el("button",{class:"chip","aria-pressed":String(k===CIT.per)},v.lib);b.onclick=()=>{CIT.per=k;renderCit();};perB.appendChild(b);});
  const metB=document.getElementById("citMet");["Publications","Auteurs différents","Engagement suscité"].forEach((l,i)=>{const b=el("button",{class:"chip","aria-pressed":String(i===CIT.met)},l);b.onclick=()=>{CIT.met=i;renderCit();};metB.appendChild(b);});
  const blB=document.getElementById("citBloc");[["tous","Tous les camps"],...Object.entries(BLOCN)].forEach(([k,l])=>{const b=el("button",{class:"chip","aria-pressed":String(k===CIT.bloc)},l);b.onclick=()=>{CIT.bloc=k;renderCit();};blB.appendChild(b);});
  document.getElementById("citPerTxt").textContent=`Période : ${SV.per[CIT.per].txt}${CIT.per==="tout"?" (citations mesurées depuis janvier 2024)":""}.`;
  const rows=SV.c.filter(c=>(CIT.bloc==="tous"||c.b===CIT.bloc)&&c.ci[CIT.per]).map(c=>({n:c.n,b:c.b,v:c.ci[CIT.per][CIT.met]||0,a:c.ci[CIT.per]})).sort((a,b)=>b.v-a.v).slice(0,20);
  document.getElementById("citRankBox").style.height=(rows.length*26+60)+"px";
  CH.citRank=new Chart(document.getElementById("citRank"),{type:"bar",data:{labels:rows.map(r=>r.n),datasets:[{label:["Publications","Auteurs","Engagement"][CIT.met],data:rows.map(r=>r.v),backgroundColor:rows.map(r=>BLOCC[r.b]),borderRadius:3}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>{const r=rows[it.dataIndex];return [`${(+r.a[0]).toLocaleString("fr-FR")} publications`,`${(+r.a[1]).toLocaleString("fr-FR")} auteurs différents`,`${(+r.a[2]).toLocaleString("fr-FR")} j’aime, commentaires et partages`,BLOCN[r.b]];}}}},
      scales:{x:{grid:{color:grid},ticks:{color:txt,callback:v=>v>=1e6?(v/1e6).toLocaleString("fr-FR")+" M":v>=1e3?(v/1e3).toLocaleString("fr-FR")+" k":v}},y:{grid:{display:false},ticks:{color:ink,font:{size:11}}}}}});
  // --- 2. semaines
  const sb=document.getElementById("citSel");[...SV.c].sort((a,b)=>b.ci["12m"][0]-a.ci["12m"][0]).slice(0,20).forEach(c=>{const b=el("button",{class:"chip","aria-pressed":String(CIT.sel.has(c.n))},`<i style="background:${BLOCC[c.b]}"></i>${esc(c.n)}`);
    b.onclick=()=>{if(CIT.sel.has(c.n))CIT.sel.delete(c.n);else if(CIT.sel.size<8)CIT.sel.add(c.n);renderCit();};sb.appendChild(b);});
  const labs=SV.weeks.slice(-52).map(d=>new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"}));
  const pal=["#2B3F9E","#6274C9","#C8203E","#1E9CC4","#4A78D0","#E8679A","#D9A400","#2E9E5B"];
  CH.citWeek=lineChart(document.getElementById("citWeek"),labs,[...CIT.sel].map((n,i)=>{const c=SV.c.find(x=>x.n===n);return {label:n,data:c.cw.slice(-52),borderColor:pal[i%8],backgroundColor:pal[i%8],borderWidth:2,pointRadius:0,tension:.25};}));
  CH.citWeek.options.scales.y.ticks.callback=v=>v;CH.citWeek.options.plugins.tooltip.callbacks.label=it=>`${it.dataset.label} : ${it.parsed.y} publications`;CH.citWeek.update("none");
  // --- 3. par type
  const top=[...SV.c].filter(c=>c.med.length>=3).sort((a,b)=>b.ci["12m"][0]-a.ci["12m"][0]).slice(0,16),TY=["TV","Radio","Presse","Magazine","En ligne","Autre"];
  document.getElementById("citTypeBox").style.height=(top.length*28+80)+"px";
  CH.citType=new Chart(document.getElementById("citType"),{type:"bar",data:{labels:top.map(c=>c.n),datasets:TY.map(t=>({label:t,data:top.map(c=>c.med.filter(m=>(MTYPE[m[0]]||"Autre")===t).reduce((s,m)=>s+m[2],0)),backgroundColor:TCOL[t],borderRadius:2}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{filter:it=>it.parsed.x>0,callbacks:{label:it=>{const c=top[it.dataIndex];return `${it.dataset.label} : ${it.parsed.x} (${c.med.filter(m=>(MTYPE[m[0]]||"Autre")===it.dataset.label).map(m=>m[0]).join(", ")})`;}}}},
      scales:{x:{stacked:true,grid:{color:grid},ticks:{color:txt}},y:{stacked:true,grid:{display:false},ticks:{color:ink,font:{size:11}}}}}});
  // --- 4. par média
  const counts={};SV.c.forEach(c=>c.med.forEach(m=>{counts[m[0]]=(counts[m[0]]||0)+1;}));
  const medias=Object.keys(counts).filter(m=>counts[m]>=2).sort((a,b)=>counts[b]-counts[a]),sm=document.getElementById("citMedia");
  if(!medias.includes(CIT.media))CIT.media=medias[0];medias.forEach(m=>sm.add(new Option(`${m} (${MTYPE[m]||"autre"})`,m)));sm.value=CIT.media;sm.onchange=()=>{CIT.media=sm.value;renderCit();};
  const mr=SV.c.map(c=>{const f=c.med.find(m=>m[0]===CIT.media);return f?{n:c.n,b:c.b,v:f[2]}:null;}).filter(Boolean).sort((a,b)=>b.v-a.v);
  document.getElementById("citMediaTxt").innerHTML=`<b>${esc(CIT.media)}</b> · ${MTYPE[CIT.media]||"autre"} · propriétaire : ${esc(MOWN[CIT.media]||"non renseigné")}. Il fait partie des six médias qui citent le plus <b>${mr.length}</b> personnalité${mr.length>1?"s":""}.`;
  document.getElementById("citMediaBox").style.height=(mr.length*26+60)+"px";
  CH.citMed=new Chart(document.getElementById("citMed"),{type:"bar",data:{labels:mr.map(r=>r.n),datasets:[{label:"Publications sur 12 mois",data:mr.map(r=>r.v),backgroundColor:mr.map(r=>BLOCC[r.b]),borderRadius:3}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>`${it.parsed.x} publications · ${BLOCN[mr[it.dataIndex].b]}`}}},
      scales:{x:{grid:{color:grid},ticks:{color:txt}},y:{grid:{display:false},ticks:{color:ink,font:{size:11}}}}}});
  // --- 5. une personnalité
  const sc=document.getElementById("citCand");[...SV.c].sort((a,b)=>b.ci["12m"][0]-a.ci["12m"][0]).forEach(c=>sc.add(new Option(c.n,c.n)));sc.value=CIT.cand;sc.onchange=()=>{CIT.cand=sc.value;renderCit();};
  const c=SV.c.find(x=>x.n===CIT.cand),y=c.ci["12m"],m30=c.ci["30j"]||[0,0,0],rank=[...SV.c].sort((a,b)=>b.ci["12m"][0]-a.ci["12m"][0]).findIndex(x=>x.n===c.n)+1;
  document.getElementById("citCandTxt").innerHTML=`<b>${rank}<sup>e</sup></b> sur ${SV.c.length} sur 12 mois : <b>${y[0].toLocaleString("fr-FR")}</b> publications de ${y[1]} journalistes et médias différents (${m30[0].toLocaleString("fr-FR")} sur les 30 derniers jours).${c.jour.length?` Journalistes qui la citent le plus : ${c.jour.slice(0,3).map(j=>`${esc(j[0])} (${j[2]})`).join(", ")}.`:""}`;
  CH.citCMed=new Chart(document.getElementById("citCMed"),{type:"bar",data:{labels:c.med.map(m=>m[0]),datasets:[{label:"Publications sur 12 mois",data:c.med.map(m=>m[2]),backgroundColor:c.med.map(m=>TCOL[MTYPE[m[0]]||"Autre"]),borderRadius:3}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:it=>{const m=c.med[it.dataIndex][0];return [`${it.parsed.x} publications`,`${MTYPE[m]||"Autre"} · ${MOWN[m]||"propriétaire non renseigné"}`];}}}},
      scales:{x:{grid:{color:grid},ticks:{color:txt}},y:{grid:{display:false},ticks:{color:ink}}}}});
  const nets=c.cir&&c.cir["12m"]?c.cir["12m"]:{},nk=Object.keys(nets);
  CH.citCNet=new Chart(document.getElementById("citCNet"),{type:"bar",data:{labels:["Réseaux"],datasets:nk.map(k=>({label:NETN[k]||k,data:[nets[k]],backgroundColor:NETC[k]||"#888"}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10}},tooltip:{callbacks:{label:it=>`${it.dataset.label} : ${it.parsed.x} publications`}}},
      scales:{x:{stacked:true,display:false},y:{stacked:true,display:false}}}});
}
/* ================= Popularité ================= */
function lineChart(canvas,labels,sets,yTitle){
  const txt=cssVar("--muted"),grid=cssVar("--line");
  return new Chart(canvas,{type:"line",data:{labels,datasets:sets},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,font:{size:11}}},
        tooltip:{itemSort:(a,b)=>b.parsed.y-a.parsed.y,callbacks:{label:it=>it.parsed.y==null?null:`${it.dataset.label} : ${fmt(it.parsed.y)} %`}}},
      scales:{x:{ticks:{color:txt,maxTicksLimit:7},grid:{color:grid}},y:{ticks:{color:txt,callback:v=>v+" %"},grid:{color:grid},title:{display:!!yTitle,text:yTitle||"",color:txt}}}}});
}
const monthLab=m=>new Date(m+"-15T12:00:00").toLocaleDateString("fr-FR",{month:"short",year:"2-digit"});
const PALS=["#94A3B8","#A3A3A3","#B6A58F","#8FA9B6","#A79BC0","#9DB59A","#C0A1A1","#A6B0BF","#BDB08F","#9AB0C0"];
function popSets(w,main){
  const names=Object.keys(w.series),avg=w.months.map((_,i)=>{const v=names.map(n=>w.series[n][i]).filter(x=>x!=null);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10:null;});
  const sets=names.map((n,j)=>({label:n,data:w.series[n],borderColor:PALS[j%PALS.length],backgroundColor:PALS[j%PALS.length],borderWidth:1.2,pointRadius:1.5,spanGaps:true,tension:.2}));
  sets.unshift({label:"Moyenne",data:avg,borderColor:main,backgroundColor:main,borderWidth:3.5,pointRadius:2.5,spanGaps:true,tension:.2});
  return {sets,avg};
}
function renderPop(){
  killCharts(Object.keys(CH).filter(k=>k.startsWith("pop")));
  const box=document.getElementById("popBlocks");box.innerHTML="";const P=RAW.pop[Y];
  const block=(title,lede)=>{const b=el("div",{class:"block"},`<h2>${title}</h2><p class="lede">${lede}</p>`);box.appendChild(b);return b;};
  const pres=P.pres[1],ps=popSets(pres,"#B8860B"),first=ps.avg.find(x=>x!=null),last=[...ps.avg].reverse().find(x=>x!=null);
  const b1=block(`${P.pres[0]}, président de la République`,`Moyenne de ${fmt(last)} % d’opinions positives en ${monthLab(pres.months[pres.months.length-1])}, contre ${fmt(first)} % un an plus tôt (${last-first>0?"+":""}${fmt(Math.round((last-first)*10)/10)} points).`);
  const c1=el("div",{class:"bars-box tall"},"<canvas></canvas>");b1.appendChild(c1);CH.pop1=lineChart(c1.querySelector("canvas"),pres.months.map(monthLab),ps.sets);
  // Premiers ministres
  const months=[...new Set(P.pm.flatMap(x=>x[1].months))].sort();
  const pmSets=P.pm.map(([n,w],i)=>{const s=popSets(w,"#000");return {label:n,data:months.map(m=>{const j=w.months.indexOf(m);return j<0?null:s.avg[j];}),borderColor:["#0F766E","#7C3AED"][i],backgroundColor:["#0F766E","#7C3AED"][i],borderWidth:3,pointRadius:2.5,spanGaps:false,tension:.2};});
  const b2=block(P.pm.length>1?"Les Premiers ministres":`${P.pm[0][0]}, Premier ministre`,"Moyenne de tous les instituts, mois par mois."+(P.pm.length>1?" Manuel Valls quitte Matignon en décembre 2016 pour se présenter à la primaire, Bernard Cazeneuve lui succède.":""));
  const c2=el("div",{class:"small-chart"},"<canvas></canvas>");b2.appendChild(c2);CH.pop2=lineChart(c2.querySelector("canvas"),months.map(monthLab),pmSets);
  if(P.cand){
    const ms=[...new Set(Object.values(P.cand).flatMap(o=>Object.keys(o)))].sort(),last=ms[ms.length-1],prev=ms[ms.length-2];
    const moisLong=m=>{const t=new Date(m+"-15T12:00:00").toLocaleDateString("fr-FR",{month:"long",year:"numeric"});return t.charAt(0).toUpperCase()+t.slice(1);};
    const keys=Object.keys(P.cand).filter(k=>P.cand[k][last]!=null).sort((a,b)=>P.cand[b][last]-P.cand[a][last]);
    const b3=block("Les personnalités candidates ou candidates possibles",esc(PARAM.popularite_source||"Part de « bonnes opinions » dans le baromètre mensuel Ifop-Fiducial pour Paris Match et Sud Radio.")+(PARAM.popularite_commentaire?" "+esc(PARAM.popularite_commentaire):""));
    const c3=el("div",{class:"bars-box"},"<canvas></canvas>");b3.appendChild(c3);
    CH.pop3=new Chart(c3.querySelector("canvas"),{type:"bar",data:{labels:keys.map(k=>POPN[k]||k),datasets:[
      {label:moisLong(last),data:keys.map(k=>P.cand[k][last]),backgroundColor:keys.map(k=>POPC[k]||"#888"),borderRadius:3},
      {label:prev?moisLong(prev):"",data:keys.map(k=>prev?P.cand[k][prev]??null:null),backgroundColor:cssVar("--line"),borderRadius:3}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
        plugins:{legend:{position:"bottom",labels:{color:cssVar("--muted"),boxWidth:10}},tooltip:{callbacks:{label:it=>`${it.dataset.label} : ${it.parsed.x} %`,afterBody:it=>{const k=keys[it[0].dataIndex],a=P.cand[k][last],b=prev?P.cand[k][prev]:null;return b==null?"":`Évolution : ${a-b>0?"+":""}${a-b} points`;}}}},
        scales:{x:{min:0,max:60,ticks:{color:cssVar("--muted"),callback:v=>v+" %"},grid:{color:cssVar("--line")}},y:{ticks:{color:cssVar("--ink"),font:{size:11}},grid:{display:false}}}}});
    c3.style.height=(keys.length*34+70)+"px";
    const b4=block(`Leur évolution depuis ${moisLong(ms[0]).toLowerCase()}`,"Touchez un nom dans la légende pour l’afficher ou le masquer. Glissez le doigt sur le graphique pour lire chaque mois.");
    const c4=el("div",{class:"bars-box tall"},"<canvas></canvas>");b4.appendChild(c4);
    const show=new Set(["rn","bardella","philippe","melenchon","glucksmann","retailleau","macron"]);
    CH.pop4=lineChart(c4.querySelector("canvas"),ms.map(monthLab),keys.map(k=>({label:POPN[k]||k,data:ms.map(m=>P.cand[k][m]??null),borderColor:POPC[k]||"#888",backgroundColor:POPC[k]||"#888",borderWidth:2.2,pointRadius:2,spanGaps:true,tension:.25,hidden:!show.has(k)})));
  }
}
/* ================= Instituts ================= */
function renderInst(){
  document.getElementById("instNote").textContent=`Aucun institut ne revendique de couleur politique, et tous sont contrôlés par la Commission des sondages. Voici, pour ${Y}, qui les possédait, qui leur commandait des sondages, les liens documentés avec des milliardaires ou des responsables politiques, et l’écart mesuré dans leurs chiffres.`;
  const box=document.getElementById("instcards");box.innerHTML="";
  const P=allPolls(),ref=ERA._now,cols=keysOf().filter(k=>ref[k]!=null).sort((a,b)=>ref[b]-ref[a]).slice(0,4);
  const from=ERA.live?toD("2026-07-08"):T0;
  ERA.inst.forEach(i=>{
    const mine=P.filter(p=>p.inst===i.k&&toD(p.d)>=from);let he="<dd>Pas de sondage d’intentions de vote sur la période.</dd>";
    if(mine.length){he=`<div class="he">${cols.map(k=>{const a=mine.filter(p=>p.s[k]!=null).map(p=>p.s[k]-(avgAt(P,k,toD(p.d),ERA.live?30:21)??p.s[k]));if(!a.length)return"";const v=Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10;return `<span>${esc(nameOf(k))} ${v>0?"+":""}${fmt(v)}</span>`;}).join("")}</div><dd style="font-size:.8rem;color:var(--muted)">sur ${mine.length} sondage${mine.length>1?"s":""}</dd>`;}
    box.appendChild(el("article",{class:"card"},`<h3>${i.n}</h3><div>${i.tags.map(t=>`<span class="tag ${i.bill?"bill":""}">${t}</span>`).join(" ")}</div>
      <dl><dt>Propriétaire en ${Y}</dt><dd>${i.own}</dd><dt>Dirigeants</dt><dd>${i.who}</dd><dt>Principaux commanditaires</dt><dd>${i.cli}</dd><dt>Liens et critiques documentés</dt><dd>${i.links}</dd><dt>Écart moyen à la moyenne (points)</dt><dd>${he}</dd></dl>`));
  });
  const pb=document.getElementById("pubcards");pb.innerHTML="";
  PUB.forEach(p=>pb.appendChild(el("article",{class:"card"},`<h3>${p.n}</h3><div><span class="tag">${p.t}</span></div><p style="margin:0;font-size:.93rem">${p.r}</p>`)));
}
/* ================= Médias ================= */
let MCUR="Tous";
function renderMedia(){
  killCharts(["orient","owner"]);const MEDIA=ERA.media;
  document.getElementById("medTitle").textContent=`Qui possédait quoi en ${Y==="2027"?"2026":Y}`;
  const all=MEDIA.flatMap(g=>g.m.map(x=>({o:g.o,n:x[0],t:x[1],p:x[2]}))),txt=cssVar("--muted"),grid=cssVar("--line");
  const TC={"TV":"#0EA5E9","Radio":"#F59E0B","Presse":"#64748B","Magazine":"#A855F7","En ligne":"#10B981"};
  CH.orient=new Chart(document.getElementById("orientChart"),{type:"bar",data:{labels:POS,datasets:TYPES.map(t=>({label:t,data:POS.map((_,i)=>all.filter(m=>m.p===i&&m.t===t).length),backgroundColor:TC[t],borderRadius:3}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:12}},tooltip:{filter:it=>it.parsed.x>0,callbacks:{label:it=>`${it.dataset.label} : ${all.filter(m=>m.p===it.dataIndex&&m.t===it.dataset.label).map(m=>m.n).join(", ")}`}}},
      scales:{x:{stacked:true,grid:{color:grid},ticks:{color:txt,precision:0}},y:{stacked:true,grid:{display:false},ticks:{color:txt}}}}});
  const owners=MEDIA.filter(g=>g.m.length);
  document.querySelector("#ownerChart").parentElement.style.height=(owners.length*30+90)+"px";
  CH.owner=new Chart(document.getElementById("ownerChart"),{type:"bar",data:{labels:owners.map(g=>g.o),datasets:POS.map((p,i)=>({label:p,data:owners.map(g=>g.m.filter(x=>x[2]===i).length),backgroundColor:POSC[i],borderRadius:2}))},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:12,font:{size:11}}},tooltip:{filter:it=>it.parsed.x>0,callbacks:{label:it=>`${it.dataset.label} : ${owners[it.dataIndex].m.filter(x=>x[2]===it.datasetIndex).map(x=>x[0]).join(", ")}`}}},
      scales:{x:{stacked:true,grid:{color:grid},ticks:{color:txt,precision:0}},y:{stacked:true,grid:{display:false},ticks:{color:txt,font:{size:11},callback:function(v){const l=this.getLabelForValue(v);return l.length>22?l.slice(0,21)+"…":l;}}}}}});
  const fb=document.getElementById("mfilters"),box=document.getElementById("owners");fb.innerHTML="";
  function render(){box.innerHTML="";MEDIA.forEach(g=>{const list=g.m.filter(x=>MCUR==="Tous"||x[1]===MCUR);if(!list.length)return;
    const div=el("div",{class:"owner"},`<div class="owner-head"><h3>${g.o}</h3><span class="who">${g.w}</span></div>${g.d?`<p>${g.d}</p>`:""}`);const gr=el("div",{class:"outlets"});
    list.forEach(([n,t,p,c,ds])=>gr.appendChild(el("div",{class:"outlet"},`<div class="on2">${n}</div><div class="ty">${t} · ${POS[p]}${c==="discuté"?' <span class="conf">(discuté)</span>':""}</div><div class="pos">${[0,1,2,3,4,5,6].map(i=>`<i style="${i===p?"background:"+POSC[p]:""}"></i>`).join("")}</div><div class="ds">${ds}</div>`)));
    div.appendChild(gr);box.appendChild(div);});}
  ["Tous",...TYPES].forEach(t=>{const b=el("button",{class:"chip","aria-pressed":t===MCUR},t);b.onclick=()=>{MCUR=t;[...fb.children].forEach(c=>c.setAttribute("aria-pressed",c===b));render();};fb.appendChild(b);});
  render();
}
/* ================= Liens ================= */
function renderLinks(){
  const LEFT=ERA.left,RIGHT=ERA.right,EDGES=ERA.edges,svg=document.getElementById("linksvg"),W=380,gap=46,H=Math.max(LEFT.length,RIGHT.length)*gap+10,xl=150,xr=236;
  document.getElementById("linkTitle").textContent=`Qui commandait à qui, qui possédait qui (${Y})`;
  document.getElementById("linkTake").innerHTML=ERA.take;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const lg=(H-40)/Math.max(LEFT.length-1,1),rg=(H-40)/Math.max(RIGHT.length-1,1),L={},R={};LEFT.forEach((n,i)=>L[n[0]]=20+i*lg);RIGHT.forEach((n,i)=>R[n[0]]=20+i*rg);
  let out="";
  EDGES.forEach(e=>{const y1=L[e[0]],y2=R[e[1]],off=e[2]==="capital"?-2:e[2]==="partenariat"?2:0;
    out+=`<path data-a="${e[0]}" data-b="${e[1]}" d="M${xl+6},${y1+off} C${(xl+xr)/2},${y1+off} ${(xl+xr)/2},${y2+off} ${xr-6},${y2+off}" stroke="${KC[e[2]]}" stroke-width="${e[2]==="capital"?4:e[2]==="partenariat"?2.5:1.6}" ${e[2]==="partenariat"?'stroke-dasharray="4 3"':""}/>`;});
  LEFT.forEach(n=>{const y=L[n[0]];out+=`<g class="node" data-n="${n[0]}" tabindex="0"><circle cx="${xl+3}" cy="${y}" r="5" fill="var(--accent)"/><text x="${xl-6}" y="${y-2}" text-anchor="end" font-weight="700">${n[1]}</text><text x="${xl-6}" y="${y+11}" text-anchor="end" style="fill:var(--muted);font-size:9.5px">${n[2].length>30?n[2].slice(0,29)+"…":n[2]}</text></g>`;});
  RIGHT.forEach(n=>{const y=R[n[0]];out+=`<g class="node" data-n="${n[0]}" tabindex="0"><circle cx="${xr-3}" cy="${y}" r="6" fill="var(--ink)"/><text x="${xr+8}" y="${y+4}" font-weight="700" style="font-size:12px">${n[1]}</text></g>`;});
  svg.innerHTML=out;
  const name=id=>(LEFT.find(n=>n[0]===id)||RIGHT.find(n=>n[0]===id))[1];
  const list=f=>{document.getElementById("linklist").innerHTML=EDGES.filter(e=>!f||e[0]===f||e[1]===f).map(e=>`<li><b>${name(e[0])}</b> → <b>${name(e[1])}</b><span class="kind k-${e[2]}">${KL[e[2]]}</span><br>${e[3]}</li>`).join("");};
  let sel=null;const pick=id=>{sel=sel===id?null:id;svg.querySelectorAll("path").forEach(p=>p.classList.toggle("dim",!!sel&&p.dataset.a!==sel&&p.dataset.b!==sel));
    svg.querySelectorAll(".node").forEach(g=>{const on=!sel||g.dataset.n===sel||EDGES.some(e=>(e[0]===sel&&e[1]===g.dataset.n)||(e[1]===sel&&e[0]===g.dataset.n));g.style.opacity=on?1:.3;});list(sel);};
  svg.querySelectorAll(".node").forEach(g=>{g.onclick=()=>pick(g.dataset.n);g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(g.dataset.n);}};});
  list(null);
}
/* ================= Patrimoine ================= */
const eur=v=>v==null?"–":(v<0?"−":"")+(Math.abs(v)>=1e6?(Math.abs(v)/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+"\u00a0M€":Math.round(Math.abs(v)).toLocaleString("fr-FR")+"\u00a0€");
function renderPatri(){
  killCharts(["patri"]);
  const box=document.getElementById("patriBox"),L=PATRI[Y]||[],chiffres=L.filter(x=>x.total!=null),sans=L.filter(x=>x.total==null);
  const coul=k=>(ERA.C[k]&&ERA.C[k].c)||"#64748B",r1=k=>ERA.results&&ERA.results.r1[k]!=null?`1<sup>er</sup> tour : ${fmt(ERA.results.r1[k])} %`:"";
  const sources=[...new Set(L.map(x=>x.lien?`<a href="${esc(x.lien)}" target="_blank" rel="noopener">${esc(x.src)}</a>`:esc(x.src)).filter(Boolean))].join("<br>");
  let h=`<h2>Le patrimoine des candidats en ${Y}</h2>`;
  if(chiffres.length){
    h+=`<p class="lede">Classement sur le total : patrimoine déclaré (immobilier, comptes, placements, véhicules…) plus la fortune estimée hors de la déclaration quand la presse en a publié une estimation. Les dettes sont indiquées à part et ne changent pas le classement.</p>
      <div class="bars-box" style="height:${chiffres.length*34+80}px"><canvas aria-label="Classement du patrimoine des candidats"></canvas></div>
      <p class="hint">Touchez « Détail » sous un candidat pour voir ce que contient sa déclaration.</p>`;
  }else if(sans.some(x=>x.rang!=null)){
    h+=`<p class="lede">Les déclarations de ${Y} ne sont plus en ligne et la presse n’en a pas publié les totaux : voici l’ordre publié, du patrimoine déclaré le plus élevé au plus faible, avec les montants connus.</p>`;
  }else{
    h+=`<p class="lede">Pas encore de déclaration publiée pour ${Y}. Les candidats la déposent avec leurs parrainages ; la HATVP la publie au moins 15 jours avant le premier tour. Le classement se remplit alors tout seul : le Google Sheet vérifie les publications de la HATVP toutes les 6 heures.</p>`;
  }
  if(L.length){
    let i=0;
    const ligne=(t,v,c="")=>`<div${c?` class="${c}"`:""}><dt>${t}</dt><dd>${v}</dd></div>`;
    h+=`<ol class="patri">${L.map(x=>{const n=x.total!=null||x.rang!=null?++i:"";
      const det=x.total==null?"":`<dl class="mt">${ligne("Patrimoine déclaré",eur(x.p))}${x.f?ligne("Fortune estimée",eur(x.f)):""}${ligne("Dettes",x.d==null?"non publiées":eur(x.d))}${x.net!=null?ligne("Net (après dettes)",eur(x.net),x.net<0?"neg":""):""}</dl>`;
      return `<li><span class="rg">${n}</span><i style="background:${coul(x.cle)}"></i><div class="c"><div class="hd"><b>${esc(x.nom)}</b>${x.total!=null?`<span class="tt">${eur(x.total)}</span>`:""}</div>${det}${r1(x.cle)?`<div class="dt">${r1(x.cle)}</div>`:""}${x.com?`<details><summary>Détail</summary><div class="dt">${esc(x.com)}</div></details>`:""}</div></li>`;}).join("")}</ol>`;
  }
  if(sources)h+=`<p class="hint">Sources : ${sources}</p>`;
  box.innerHTML=h;
  if(chiffres.length){
    const txt=cssVar("--muted"),grid=cssVar("--line");
    CH.patri=new Chart(box.querySelector("canvas"),{type:"bar",data:{labels:chiffres.map(x=>x.nom),datasets:[
        {label:"Patrimoine déclaré",data:chiffres.map(x=>x.p),backgroundColor:chiffres.map(x=>coul(x.cle)),borderRadius:3},
        ...(chiffres.some(x=>x.f)?[{label:"Fortune estimée hors déclaration",data:chiffres.map(x=>x.f||0),backgroundColor:chiffres.map(x=>coul(x.cle)+"66"),borderRadius:3}]:[])]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
        plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,font:{size:11}}},tooltip:{filter:it=>it.parsed.x>0,callbacks:{label:it=>`${it.dataset.label} : ${eur(it.parsed.x)}`,footer:its=>`Total : ${eur(chiffres[its[0].dataIndex].total)}`}}},
        scales:{x:{stacked:true,grid:{color:grid},ticks:{color:txt,callback:v=>v>=1e6?v/1e6+" M€":v>0?v/1e3+" k€":"0"}},y:{stacked:true,grid:{display:false},ticks:{color:cssVar("--ink"),font:{size:11}}}}}});
  }
}
/* ================= Justice ================= */
const JST={definitive:["Condamnation définitive","#B23A3A"],non_definitive:["Condamnation non définitive","#D97706"],civile:["Condamnation civile ou sanction","#7C3AED"],
  en_cours:["Procédure en cours","#2563EB"],relaxe:["Relaxe","#1F7A4D"],non_lieu:["Non-lieu","#1F7A4D"],classee:["Classée sans suite","#64748B"]};
const FERMEES=new Set(["relaxe","non_lieu","classee"]);
const moisTxt=m=>m==null?"":m%12===0?`${m/12} an${m>12?"s":""}`:`${m} mois`;
// Noms complets des candidats 2027 (l'onglet candidats ne garde que le nom de famille)
const NOMS_2027={rn:"Marine Le Pen / Jordan Bardella",melenchon:"Jean-Luc Mélenchon",philippe:"Édouard Philippe",glucksmann:"Raphaël Glucksmann",retailleau:"Bruno Retailleau",
  attal:"Gabriel Attal",lisnard:"David Lisnard",zemmour:"Éric Zemmour",tondelier:"Marine Tondelier",roussel:"Fabien Roussel","dupont-aignan":"Nicolas Dupont-Aignan",arthaud:"Nathalie Arthaud"};
function justiceBilan(L){
  const n=st=>L.filter(a=>a.statut===st).length,actives=L.filter(a=>!FERMEES.has(a.statut));
  return {def:n("definitive"),nd:n("non_definitive"),civ:n("civile"),enc:n("en_cours"),
    amendes:actives.filter(a=>a.statut!=="en_cours").reduce((t,a)=>t+(a.amende||0),0),sommes:actives.reduce((t,a)=>t+(a.sommes||0),0)};
}
function justiceCandidats(){
  // candidats réellement présents (résultats) pour 2017 et 2022, candidats affichés pour 2027
  const ks=ERA.results?Object.keys(ERA.results.r1).sort((a,b)=>ERA.results.r1[b]-ERA.results.r1[a]):Object.keys(ERA.C);
  const nomP=k=>((PATRI[Y]||[]).find(x=>x.cle===k)||{}).nom||(Y==="2027"?NOMS_2027[k]:"");
  return ks.map(k=>{const L=(JUSTICE[Y]||{})[k]||[];
    return {k,nom:nomP(k)||(ERA.C[k]?ERA.C[k].n:k),L,perso:justiceBilan(L.filter(a=>a.type!=="parti")),parti:justiceBilan(L.filter(a=>a.type==="parti")),
      nomParti:(L.find(a=>a.type==="parti")||{}).nom};})
    .sort((a,b)=>b.perso.def-a.perso.def||b.perso.nd-a.perso.nd||b.perso.civ-a.perso.civ||b.perso.enc-a.perso.enc||
      (b.parti.def+b.parti.nd+b.parti.civ+b.parti.enc)-(a.parti.def+a.parti.nd+a.parti.civ+a.parti.enc));
}
function renderJustice(){
  killCharts(["justice"]);
  const box=document.getElementById("justiceBox"),C=justiceCandidats(),tot=b=>b.def+b.nd+b.civ+b.enc,avec=C.filter(c=>tot(c.perso)+tot(c.parti)>0);
  const carte=a=>{const[lab,col]=JST[a.statut]||[a.statut,"#64748B"];
    const peines=[a.ferme?`${moisTxt(a.ferme)} de prison ferme`:"",a.sursis?`${moisTxt(a.sursis)} avec sursis`:"",a.amende?`amende ${eur(a.amende)}`:"",a.inelig?`${moisTxt(a.inelig)} d’inéligibilité`:"",a.sommes?`à verser ${eur(a.sommes)}`:""].filter(Boolean);
    return `<li class="aff"><div class="ah"><span class="badge" style="background:${col}">${lab}</span>${a.type==="parti"?'<span class="tag">Parti</span>':""}<span class="dt">${a.date?new Date(a.date+"T12:00:00").toLocaleDateString("fr-FR",{month:"long",year:"numeric"}):""}</span></div>
      <b>${esc(a.affaire)}</b><div class="dt">${esc(a.nom)} · ${esc(a.infraction)}</div>
      ${peines.length?`<div class="pn">${peines.map(p=>`<span>${p}</span>`).join("")}</div>`:""}
      ${a.peine?`<div class="dt">${esc(a.peine)}</div>`:""}
      ${a.resume||a.sommesDetail||a.src?`<details><summary>Détail et source</summary>${a.resume?`<p>${esc(a.resume)}</p>`:""}${a.sommesDetail?`<p>${esc(a.sommesDetail)}</p>`:""}<p class="dt">Source : ${a.lien?`<a href="${esc(a.lien)}" target="_blank" rel="noopener">${esc(a.src||"lien")}</a>`:esc(a.src)}</p></details>`:""}</li>`;};
  const resume=(b,vide)=>{const chips=[b.def?`${b.def} condamnation${b.def>1?"s":""} définitive${b.def>1?"s":""}`:"",b.nd?`${b.nd} condamnation${b.nd>1?"s":""} non définitive${b.nd>1?"s":""}`:"",
      b.civ?`${b.civ} condamnation${b.civ>1?"s":""} civile${b.civ>1?"s":""} ou sanction${b.civ>1?"s":""}`:"",b.enc?`${b.enc} procédure${b.enc>1?"s":""} en cours`:""].filter(Boolean);
    const argent=[b.amendes?`amendes ${eur(b.amendes)}`:"",b.sommes?`dommages, remboursements et confiscations ${eur(b.sommes)}`:""].filter(Boolean);
    return (chips.length?chips.join(" · "):vide)+(argent.length?`<br>Sommes en jeu : ${argent.join(" ; ")}`:"");};
  let h=`<h2>Le volet judiciaire des candidats de ${Y}</h2>
    <p class="lede">Pour chaque candidat : ses condamnations (définitives ou non), les procédures en cours le visant, celles visant son parti, et ce qu’il a été condamné à payer. Classement par nombre de condamnations définitives du candidat lui-même. Situation au 27 octobre 2026.</p>`;
  if(avec.length)h+=`<div class="bars-box" style="height:${avec.length*34+100}px"><canvas aria-label="Nombre d’affaires par candidat"></canvas></div>`;
  h+=`<div class="jlist">${C.map(c=>{const ouvertes=c.L.filter(a=>!FERMEES.has(a.statut)),fermees=c.L.filter(a=>FERMEES.has(a.statut));
    return `<article class="jc"><div class="jh"><i style="background:${(ERA.C[c.k]&&ERA.C[c.k].c)||"#64748B"}"></i><h3>${esc(c.nom)}</h3></div>
      <dl class="jb"><div><dt>Personnellement</dt><dd>${resume(c.perso,"aucune condamnation ni procédure en cours connue")}</dd></div>
      ${tot(c.parti)?`<div><dt>Son parti${c.nomParti?` (${esc(c.nomParti)})`:""}</dt><dd>${resume(c.parti,"")}</dd></div>`:""}</dl>
      ${ouvertes.length?`<details class="closed"><summary>Voir ${ouvertes.length>1?`les ${ouvertes.length} affaires`:"l’affaire"}</summary><ul class="affs">${ouvertes.map(carte).join("")}</ul></details>`:""}
      ${fermees.length?`<details class="closed"><summary>Relaxes, non-lieux et classements (${fermees.length})</summary><ul class="affs">${fermees.map(carte).join("")}</ul></details>`:""}</article>`;}).join("")}</div>`;
  box.innerHTML=h;
  if(avec.length){const txt=cssVar("--muted"),grid=cssVar("--line");
    const ds=[["def","definitive"],["nd","non_definitive"],["civ","civile"],["enc","en_cours"]].map(([k,st])=>({label:JST[st][0],data:avec.map(c=>c.perso[k]),backgroundColor:JST[st][1],borderRadius:2}));
    ds.push({label:"Affaires visant le parti",data:avec.map(c=>tot(c.parti)),backgroundColor:"#94A3B8",borderRadius:2});
    CH.justice=new Chart(box.querySelector("canvas"),{type:"bar",data:{labels:avec.map(c=>c.nom),datasets:ds},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
        plugins:{legend:{position:"bottom",labels:{color:txt,boxWidth:10,font:{size:11}}},tooltip:{filter:it=>it.parsed.x>0}},
        scales:{x:{stacked:true,grid:{color:grid},ticks:{color:txt,precision:0}},y:{stacked:true,grid:{display:false},ticks:{color:cssVar("--ink"),font:{size:11},callback:function(v){const l=this.getLabelForValue(v);return l.length>24?l.slice(0,23)+"…":l;}}}}}});}
}
/* ================= Navigation ================= */
let TAB="sondages";
function updHash(){try{history.replaceState(null,"","#"+TAB+"-"+Y);}catch(e){}}
function setEra(y,fromLoad){
  Y=y;ERA=ERAS[y];visible=new Set(ERA.visible);killCharts();
  document.getElementById("title").textContent=ERA.title;document.getElementById("eraSub").textContent=ERA.sub;
  document.querySelectorAll(".timewarp button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.y===y)));
  renderPolls();renderAgeVote();renderPop();renderAgePop();renderInst();renderMedia();renderAgeMedia();renderLinks();renderAN();renderCompare();renderCit();renderPatri();renderJustice();if(!fromLoad)updHash();
}
document.querySelectorAll(".timewarp button").forEach(b=>b.onclick=()=>{setEra(b.dataset.y);});
const TABS=[...document.querySelectorAll('[role="tab"]')];
function showTab(id,push){TAB=id;TABS.forEach(b=>{const on=b.getAttribute("aria-controls")===id;b.setAttribute("aria-selected",on);document.getElementById(b.getAttribute("aria-controls")).classList.toggle("on",on);});
  Object.values(CH).forEach(c=>c.resize());if(push){updHash();window.scrollTo({top:0});}}
TABS.forEach(b=>b.onclick=()=>showTab(b.getAttribute("aria-controls"),true));
/* ================= Démarrage ================= */
(function start(){
  const h=(location.hash||"").slice(1).split("-");let y="2027",t="sondages";
  if(["sondages","popularite","assemblee","comparer","patrimoine","justice","citations","instituts","medias","liens"].includes(h[0]))t=h[0];if(ERAS[h[1]])y=h[1];
  setEra(y,true);showTab(t,false);
  if(window.matchMedia)window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>setEra(Y,true));
})();
}
