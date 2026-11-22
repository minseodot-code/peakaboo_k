/* =========================================================
   1) 그림 교체용 설정
   포즈별 이미지(투명 PNG 또는 WebM 대신 PNG 정지컷)를 넣으면
   임시 실루엣 대신 그 이미지가 나와요. 모든 포즈는 "왼쪽을 보는" 방향.
   ========================================================= */
const ASSETS = {
  crawl: '',  // 네 발로 기어가기 (옆모습)
  walk:  '',  // 두 발로 걷기 (옆모습)
  stand: '',  // 두 발로 서 있기
  reach: '',  // 책장 뒤적이기 (한 손 위로)
  sit:   '',  // 앉아서 책 펼치기 / 넘기기
  eat:   '',  // 두 손으로 책 잡고 뜯어 먹기
  sleep: ''   // 발라당 누워 자기
};

/* =========================================================
   2) 책 데이터: data/books.json
   실제 책은 책장 맨 앞 칸 첫 줄부터 순서대로 꽂히고, 그 뒤는 장식용 책.
   color(선택)를 넣으면 그 색 책등, 없으면 랜덤.
   ========================================================= */
let BOOKS = [];  // data/books.json 에서 불러와요
const NO_BOOKS=[{title:'책 데이터를 불러오지 못했어요',author:'',tags:[],quotes:[{t:'data/books.json 을 확인해 주세요.',p:''}],note:'',blog:''}];
function loadBooks(){
  return fetch('data/books.json').then(r=>r.json()).then(b=>{ BOOKS=Array.isArray(b)&&b.length?b:NO_BOOKS; })
    .catch(()=>{ BOOKS=NO_BOOKS; });
}
function bookColor(b){ return b && typeof b.color==='string' && CSS.supports('color', b.color) ? b.color : null; }
const eatenBooks = new Set();  // 꿈에서 이미 보여준 실제 책 번호
/* 먹은 책 더미: 꿈에서 깰 때마다 그 책이 입구 근처 바닥에 쌓임. 이 브라우저에 기억돼서 다음에 와도 남아 있음.
   더미의 책을 누르면 여우가 그 책을 다시 꿈꿈 */
const PILE_KEY='peakaboo-pile', PILE={x:300, z:-90}, PILE_PER_STACK=12;
let pile=[], lastDreamBook=null;
const pileEl=document.createElement('div'); pileEl.id='pile'; pileEl.setAttribute('role','group'); pileEl.setAttribute('aria-label','여우가 먹은 책 더미');
let viewData=null;   // 보기 전용 링크의 내용 (js/share.js). 보기 전용이면 localStorage 대신 이것만 읽고, 아무것도 저장하지 않음
function loadPile(){
  try { const slugs=VIEW ? viewData.p : JSON.parse(localStorage.getItem(PILE_KEY)||'[]');
        pile=[...new Set(slugs.map(sl=>BOOKS.findIndex(b=>bookSlug(b)===sl)).filter(i=>i>=0))]; }
  catch(e){ pile=[]; }
  recordArchive(pile);   // 예전에 먹은 책도 기록에 옮겨 둠
}
/* 먹은 책 기록(아카이브): 꽃을 잘라도 남음. archive.html 이 이 기록으로 '먹은 책 모음' 페이지를 그림. [{s:책 slug, t:처음 먹은 시각}] */
const ARCHIVE_KEY='peakaboo-archive', BOUQUET_KEY='peakaboo-bouquets';
function readList(key){ if (VIEW) return key===ARCHIVE_KEY ? viewData.a.map(([s,t])=>({s,t})) : key===BOUQUET_KEY ? viewData.b : []; try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function writeList(key,v){ if (VIEW) return; try { localStorage.setItem(key, JSON.stringify(v)); } catch(e){} }
function recordArchive(idx){
  const a=readList(ARCHIVE_KEY), have=new Set(a.map(r=>r.s)); let ch=false;
  for (const i of idx){ const sl=bookSlug(BOOKS[i]); if (!have.has(sl)){ a.push({s:sl,t:Date.now()}); have.add(sl); ch=true; } }
  if (ch) writeList(ARCHIVE_KEY,a);
}
function savePile(){ if (VIEW) return; try { localStorage.setItem(PILE_KEY, JSON.stringify(pile.map(i=>bookSlug(BOOKS[i])))); } catch(e){} }
function pileBook(i,k){
  const b=BOOKS[i], r=rng(k*131+7), el=document.createElement('button');
  el.type='button'; el.className='pbook'; el.dataset.b=i; el.title=b.title;
  el.setAttribute('aria-label',`${b.title} 다시 꿈꾸기`);
  el.style.setProperty('--c', bookColor(b)||PALETTE[(i*5)%PALETTE.length]);
  el.style.width=Math.round(100+r()*34)+'px'; el.style.height=Math.round(19+r()*7)+'px';
  el.style.setProperty('--rot',(r()*7-3.5).toFixed(1)+'deg'); el.style.setProperty('--off',Math.round(r()*14-7)+'px');
  return el;
}
function renderPile(){
  pileEl.innerHTML=''; let tallest=0;
  for (let s0=0; s0<pile.length; s0+=PILE_PER_STACK){
    const st=document.createElement('div'); st.className='pstack'; let hsum=0;
    pile.slice(s0,s0+PILE_PER_STACK).forEach((i,k)=>{ const el=pileBook(i,s0+k); hsum+=parseFloat(el.style.height); st.appendChild(el); });
    tallest=Math.max(tallest,hsum); pileEl.appendChild(st);
  }
  // 라벨은 더미 위에 띄움 (바닥 아래로 내려가면 바닥 판에 가려짐)
  const lab=document.createElement('div'); lab.className='plabel'; lab.style.bottom=(tallest+16)+'px';
  lab.textContent=pile.length?`여우가 먹은 책 ${pile.length}권`:''; pileEl.appendChild(lab);
}
function placePile(){
  const pz=PILE.z+cam;                       // 안쪽으로 들어가면 더미는 입구에 남아 뒤로 멀어짐
  pileEl.style.display = (pz>520 || !pile.length) ? 'none' : '';
  pileEl.style.transform=`translate3d(${PILE.x-150}px,${FLOOR-420}px,${pz}px)`;
}
/* 책꽃: 여우가 먹은 책마다 언덕에 그 책 색의 꽃이 한 송이 핌. 먹은 책 더미(pile)와 같은 목록을 써서 다음에 와도 남아 있음.
   꽃 모양·위치는 책 제목으로 정해져서 늘 같은 자리에 같은 꽃이 핌. 꽃을 누르면 그 책을 다시 꿈꿈 */
const FLOWERS=[{"f": "f1", "ar": 0.493}, {"f": "f2", "ar": 0.31}, {"f": "f3", "ar": 0.403}, {"f": "f4", "ar": 0.303}, {"f": "f5", "ar": 0.923}, {"f": "f6", "ar": 0.573}, {"f": "f7", "ar": 0.863}, {"f": "f8", "ar": 0.43}, {"f": "f9", "ar": 0.947}];
const gardenEl=document.createElement('div'); gardenEl.id='garden';
function hash(str){ let h=2166136261; for (const ch of str){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function flowerSpot(i){
  const r=rng(hash(bookSlug(BOOKS[i]))); let x,z,t=0;
  do { x=-300+r()*860; z=-650+r()*820; t++; }
  while (t<20 && (Math.hypot(x-PILE.x,z-PILE.z)<220 || Math.hypot(x-SEAT.x,z-SEAT.z)<130));
  return {x,z,type:flowerType(bookSlug(BOOKS[i])),h:Math.round(100+r()*45),tilt:(r()*8-4).toFixed(1)};
}
/* 꽃 모양은 책 제목만으로 정함 (archive.js 도 같은 계산을 씀) */
function flowerType(slug){ return FLOWERS[hash(slug+'#flower')%FLOWERS.length]; }
/* 꽃 색: 책 색의 색조만 살리고 채도를 올림 (흐린 책 색을 그대로 곱하면 꽃이 시든 색이 됨).
   꽃잎에는 mix-blend-mode:color 로 입혀서 밝기·결은 원래 꽃 그림을 따름 */
function bloomColor(css){
  const c=document.createElement('canvas').getContext('2d'); c.fillStyle='#b39573'; c.fillStyle=css; const h=c.fillStyle;
  if (!/^#[0-9a-f]{6}$/i.test(h)) return css;
  const r=parseInt(h.slice(1,3),16)/255, g=parseInt(h.slice(3,5),16)/255, b=parseInt(h.slice(5,7),16)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn; let hu=0, s=0;
  if (d){ s=d/(1-Math.abs(2*l-1)); hu=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; hu*=60; if (hu<0) hu+=360; }
  return `hsl(${hu.toFixed(0)} ${Math.round(Math.min(.7,Math.max(.5,s*1.8))*100)}% ${Math.round(Math.min(.6,Math.max(.5,l))*100)}%)`;
}
function makeFlower(i){
  const sp=flowerSpot(i), b=BOOKS[i], w=Math.round(sp.h*sp.type.ar);
  const el=document.createElement('button'); el.type='button'; el.className='bflower'; el.dataset.b=i; el.title=b.title;
  el.setAttribute('aria-label',`${b.title} 꽃: 다시 꿈꾸기`);
  el.style.width=w+'px'; el.style.height=sp.h+'px';
  el.style.backgroundImage=`url(assets/flowers/${sp.type.f}.webp)`;
  el.style.setProperty('--c', bloomColor(bookColor(b)||PALETTE[(i*5)%PALETTE.length]));
  el.dataset.x=sp.x; el.dataset.z=sp.z; el.dataset.tilt=sp.tilt;
  const tint=document.createElement('i'); const mu=`url(assets/flowers/${sp.type.f}m.webp)`;
  tint.style.webkitMaskImage=mu; tint.style.maskImage=mu; el.appendChild(tint);   // 꽃잎 모양대로 책 색을 입힘
  return el;
}
function placeGarden(){
  for (const el of gardenEl.children){
    const z=+el.dataset.z+cam, w=parseFloat(el.style.width), h=parseFloat(el.style.height);
    el.style.display = z>600 ? 'none' : '';
    el.style.transform=`translate3d(${(+el.dataset.x-w/2).toFixed(1)}px,${(FLOOR-h).toFixed(1)}px,${z.toFixed(1)}px) rotate(${el.dataset.tilt}deg)`;
  }
}
function renderGarden(){ gardenEl.innerHTML=''; for (const i of pile) gardenEl.appendChild(makeFlower(i)); placeGarden(); }
function bloomFlower(i){
  const el=makeFlower(i); gardenEl.appendChild(el); placeGarden();
  el.classList.add('blooming'); setTimeout(()=>el.classList.remove('blooming'), 1700/SPD);
}
gardenEl.addEventListener('click', e=>{ const f=e.target.closest('.bflower'); if (f) dreamAgain(+f.dataset.b); });
async function addToPile(i){
  if (i==null || (VIEW && !pile.includes(i))) return;
  if (pile.includes(i)){                     // 이미 쌓인 책이면 그 책만 살짝 반짝
    const el=pileEl.querySelector(`.pbook[data-b="${i}"]`);
    if (el) el.animate([{filter:'brightness(1)'},{filter:'brightness(1.6)'},{filter:'brightness(1)'}],{duration:900});
    return;
  }
  pile.push(i); savePile(); recordArchive([i]); renderPile(); placePile(); bloomFlower(i);
  const el=pileEl.querySelector(`.pbook[data-b="${i}"]`); if (!el) return;
  const to=el.getBoundingClientRect(), from=headPoint();
  el.style.visibility='hidden';
  const fly=document.createElement('div'); fly.className='flybook';
  fly.style.setProperty('--cover', getComputedStyle(el).getPropertyValue('--c'));
  Object.assign(fly.style,{left:from.x+'px',top:from.y+'px',width:'26px',height:'34px'});
  document.body.appendChild(fly);
  await fly.animate([
    {left:from.x+'px',top:from.y+'px',width:'26px',height:'34px',transform:'rotate(0deg)'},
    {left:((from.x+to.left)/2)+'px',top:(Math.min(from.y,to.top)-90)+'px',width:'40px',height:'26px',transform:'rotate(-160deg)',offset:.55},
    {left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px',transform:'rotate(-360deg)'}
  ],{duration:900/SPD,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}).finished;
  fly.remove(); el.style.visibility='';
  el.animate([{transform:'translateX(var(--off)) translateY(-6px) rotate(var(--rot))'},{transform:'translateX(var(--off)) rotate(var(--rot))'}],{duration:260,easing:'cubic-bezier(.3,1.6,.6,1)'});
}
/* 더미의 책을 누르면: 여우가 자리로 가서 잠들고 그 책의 꿈을 다시 꿈 */
async function dreamAgain(i){
  if (mode!=='idle') return;
  mode='busy'; run++; stopMove(); hideHint();
  setPose('walk'); await moveTo(SEAT.x, SEAT.z, 170);
  face('left'); setPose('sit'); await wait(500);
  setPose('sleep'); startZz(); await wait(1200);
  await enterDream(BOOKS[i]);
}
pileEl.addEventListener('click', e=>{ const b=e.target.closest('.pbook'); if (b) dreamAgain(+b.dataset.b); });
/* 장식용 책을 누르면: 아직 안 먹은 실제 책 중 하나 (다 먹었으면 전체에서) */
function pickUneaten(){
  const all=BOOKS.map((_,i)=>i), left=all.filter(i=>!eatenBooks.has(i)), pool=left.length?left:all;
  return pool[Math.floor(Math.random()*pool.length)];
}

/* =========================================================
   3) 임시 실루엣 (SVG)
   ========================================================= */
const T='#C9A877', G='#8A9BA8', C='#EFE6D2', D='#55606B', S='#5B4330', B='#E6A49B';
const st=`stroke="${S}" stroke-width="1.6" stroke-linejoin="round"`;
function head(cx,cy,mode='open'){
  const eye = ex => mode==='closed'
    ? `<path d="M${ex-7},-1 q7,5 14,0" fill="none" stroke="${S}" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M${ex-8},-4 h16" stroke="${S}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${ex}" cy="-1.4" r="2.3" fill="#2a2018"/>`;
  const mouth = mode==='chew'
    ? `<ellipse cx="0" cy="17" rx="4.5" ry="3.2" fill="#7a3d33"/>`
    : `<path d="M-4.5,16.5 q4.5,1.2 9,0" fill="none" stroke="${S}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<g class="head"><g transform="translate(${cx} ${cy})">
    <path d="M-30,-14 L-24,-46 L-5,-24 Z" fill="${T}" ${st}/>
    <path d="M30,-14 L24,-46 L5,-24 Z" fill="${T}" ${st}/>
    <path d="M-25,-20 L-22,-38 L-12,-24 Z" fill="${C}" opacity=".7"/>
    <path d="M25,-20 L22,-38 L12,-24 Z" fill="${C}" opacity=".7"/>
    <rect x="-34" y="-28" width="68" height="58" rx="16" fill="${T}" ${st}/>
    <rect x="-33" y="-1" width="17" height="29" rx="8" fill="${G}" opacity=".9"/>
    <rect x="16" y="-1" width="17" height="29" rx="8" fill="${G}" opacity=".9"/>
    <path d="M-13,4 Q0,33 13,4 Q0,11 -13,4Z" fill="${C}"/>
    ${eye(-14)}${eye(14)}
    <ellipse cx="-21" cy="9" rx="7" ry="5" fill="${B}" opacity=".75"/>
    <ellipse cx="21" cy="9" rx="7" ry="5" fill="${B}" opacity=".75"/>
    <ellipse cx="0" cy="7.5" rx="4.6" ry="3.5" fill="#231b15"/>
    ${mouth}
  </g></g>`;
}
const wrap = s => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
const SVG = {
  crawl: () => wrap(`
    <path d="M152,124 q44,-8 44,24 q-22,10 -44,-10Z" fill="${D}" ${st}/>
    <rect class="leg l2" x="90" y="144" width="12" height="40" rx="6" fill="${T}" ${st}/>
    <rect class="leg l4" x="148" y="144" width="12" height="40" rx="6" fill="${T}" ${st}/>
    <ellipse cx="114" cy="136" rx="56" ry="27" fill="${G}" ${st}/>
    <ellipse cx="74" cy="142" rx="19" ry="16" fill="${C}"/>
    <rect class="leg l1" x="70" y="146" width="12" height="40" rx="6" fill="${T}" ${st}/>
    <rect class="leg l3" x="130" y="146" width="12" height="40" rx="6" fill="${T}" ${st}/>
    ${head(46,112)}`),
  stand: (reach=false) => wrap(`
    <path d="M118,150 q50,-4 52,32 q-28,8 -52,-18Z" fill="${D}" ${st}/>
    <rect x="114" y="106" width="12" height="32" rx="6" fill="${T}" ${st} transform="rotate(-16 120 108)"/>
    <rect class="leg l1" x="83" y="152" width="14" height="38" rx="6" fill="${T}" ${st}/>
    <rect class="leg l2" x="103" y="152" width="14" height="38" rx="6" fill="${T}" ${st}/>
    <ellipse cx="100" cy="130" rx="32" ry="40" fill="${G}" ${st}/>
    <ellipse cx="96" cy="134" rx="17" ry="28" fill="${C}"/>
    <rect class="arm" x="70" y="104" width="12" height="34" rx="6" fill="${T}" ${st}/>
    ${head(100,70)}`),
  sit: (mode='open') => wrap(`
    <path d="M120,172 q52,2 54,-24 q-30,-8 -54,8Z" fill="${D}" ${st}/>
    <ellipse cx="76" cy="184" rx="22" ry="9" fill="${T}" ${st}/>
    <ellipse cx="124" cy="184" rx="22" ry="9" fill="${T}" ${st}/>
    <ellipse cx="100" cy="148" rx="38" ry="36" fill="${G}" ${st}/>
    <ellipse cx="100" cy="150" rx="22" ry="27" fill="${C}"/>
    <rect x="72" y="122" width="12" height="28" rx="6" fill="${T}" ${st} transform="rotate(-38 78 124)"/>
    <rect x="116" y="122" width="12" height="28" rx="6" fill="${T}" ${st} transform="rotate(38 122 124)"/>
    ${head(100,88,mode)}`),
  sleep: () => wrap(`
    <path d="M150,172 q42,12 46,-8 q-22,-14 -46,0Z" fill="${D}" ${st}/>
    <rect class="leg" x="84" y="108" width="12" height="36" rx="6" fill="${T}" ${st} transform="rotate(-14 90 140)"/>
    <rect class="leg" x="102" y="104" width="12" height="38" rx="6" fill="${T}" ${st} transform="rotate(8 108 140)"/>
    <rect class="leg" x="124" y="106" width="12" height="38" rx="6" fill="${T}" ${st} transform="rotate(-6 130 140)"/>
    <rect class="leg" x="142" y="112" width="12" height="34" rx="6" fill="${T}" ${st} transform="rotate(16 148 142)"/>
    <ellipse cx="114" cy="162" rx="50" ry="26" fill="${G}" ${st}/>
    <ellipse cx="114" cy="152" rx="34" ry="13" fill="${C}"/>
    <g transform="rotate(-90 54 158)">${head(54,158,'closed')}</g>`)
};
SVG.walk = () => SVG.stand(false);
SVG.reach = () => SVG.stand(true);
SVG.eat = () => SVG.sit('chew');
SVG.reachSit = () => SVG.sit();
SVG.rest = () => SVG.stand(false);

/* =========================================================
   4) 동작
   ========================================================= */
const $ = s => document.querySelector(s);
const stage=$('#stage'), fox=$('#fox'), bob=$('#foxBob'), inner=$('#foxInner'),
      held=$('#held'), spread=held.querySelector('.spread'), shelf=$('#shelf'),
      hint=$('#hint'), dream=$('#dream'), ink=$('#ink'), dreamInner=$('#dreamInner'), toast=$('#toast');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPD = RM ? 3 : 1;
// 여우 그림과 같은 수채 톤: 회청·모래·크림·흐린 장미·세이지·옅은 갈색
const PALETTE=['#8FA2B3','#7D8FA0','#A9B6C0','#C9A46A','#D6BF95','#E2D3B4','#C79A8E','#B48478','#A4AE92','#8E9C85','#9C7C5E','#B39573','#7F9894','#A7A196'];
const BEHAV={crawl:'walking',walk:'walking',carry:'walking',reach:'reaching',reachSit:'reaching',eat:'chewing',sleep:'sleeping',rest:'resting'};

/* 방 좌표 (px, z는 화면 쪽이 +) */
const P=1100, ZN=300, WX=-600, FLOOR=300, DEPTH=72, SH_START=250, SH_LEN=1350, FOXS=320;
const FX = WX + DEPTH + 125;          // 책장 앞을 걷는 x
const SEG = 1300;                     // 책장 한 칸(세그먼트) 길이
const ZDEEP = -600, ZFRONT = 130;     // 여우가 걸을 수 있는 앞뒤 한계
let cam = 0;                          // 방 안쪽으로 들어간 거리
const SEAT = {x:-90, z:60};           // 책 먹는 자리
let x=0, z=0, facing='left', pose='crawl', mode='intro', run=0, curAnim=null, pending=false, eaten=0, zzTimer=null, zoomAnim=null, inkAnim=null;
const wait = ms => new Promise(r=>setTimeout(r, ms/SPD));
const foxW = () => fox.offsetWidth;
const rand = (a,b) => a + Math.random()*(b-a);

/* 성능: 여우는 3D 방(#world) 밖의 평면 레이어로 그림.
   방 안 3D 좌표(x, 바닥, z)를 화면 좌표로 직접 계산해 옮기고 원근만큼 크기를 줄임.
   여우가 움직여도 브라우저가 방 전체(바닥·벽·책장)를 다시 그리지 않아서 버벅임이 크게 줄어듦 */
let KS=1;                                   // 방 축척(--k) 캐시
function proj(wx,wy,wz){                    // 방 좌표 → 화면 좌표 (#viewport 의 perspective 1100, origin 50% 42% 와 같은 계산)
  const cx=innerWidth/2, cy=innerHeight/2, oy=innerHeight*0.42, f=P/(P-wz);
  return { x: cx + KS*wx*f, y: oy + (cy + KS*wy - oy)*f, s: KS*f };
}
function tf(px,pz){
  const b=proj(px, FLOOR, pz);
  return `translate3d(${(b.x-FOXS/2*b.s).toFixed(2)}px,${(b.y-FOXS*b.s).toFixed(2)}px,0) scale(${b.s.toFixed(4)})`;
}
let lastBr='';
function place(nx,nz=z){ x=nx; z=nz; fox.style.transform=tf(x,z); const br=(Math.round(Math.max(.9,Math.min(1,.98+z*.0002))*50)/50).toFixed(2); if (br!==lastBr){ lastBr=br; fox.style.setProperty('--br', br); } }   // 밝기는 0.02 단위로만 바꿔 다시 그리기를 줄임
function sx(px,pz){ return px*P/(P-pz); }
function applyClasses(){ fox.className = ['pose-'+pose, BEHAV[pose]||'', facing==='right'?'face-right':'', imgOK?'img-mode':''].join(' ').trim(); }
function face(dir){ facing=dir; inner.style.transform = dir==='left' ? 'none' : 'scaleX(-1)'; applyClasses(); if (typeof positionHeld==='function') positionHeld(); }
/* 여우 그림 설정: 프레임, 초당 프레임 수, 화면 높이(px), 그림자 폭, 머리 위치(비율)
   dx·dy(선택): 그림 위치 보정(px). dx +는 여우가 보는 반대쪽(꼬리 쪽), dy +는 아래
   URL 끝에 #debug 를 붙이면 조정 패널로 눈으로 보며 맞추고 값을 복사할 수 있어요 (js/debug.js) */
const POSES = {
  crawl: { f:['crawl_1','crawl_2','crawl_3','crawl_4'], stride:30, bob:2, h:135, sh:'58%' },
  // 미드저니 영상에서 뽑은 걸음 한 주기(16프레임). 예전 4장짜리로 돌아가려면 f를 ['walk_1','walk_2','walk_3','walk_4'], stride:30, bob:4, bobPer:1 로
  walk:  { f:Array.from({length:16},(_,i)=>'walkv_'+String(i+1).padStart(2,'0')), stride:11, bob:1.5, bobPer:8, h:255, sh:'27%', carry:[.11,.24] },
  stand: { f:['stand'],     h:262, sh:'21%' },
  reach: { f:['reach'],     h:272, sh:'26%', carry:[.25,.155] },
  reachSit:{ f:['reach_sit'], h:225, sh:'40%' },  // 앉아서 뒤적이기
  // 앉아서 쉬기: 지금은 책 없이 앉은 그림이 없어 stand 그림 + 큰 숨쉬기(css .resting)로 임시 처리.
  // 그림이 생기면 f만 ['rest'] 등으로 바꾸고 h·sh를 맞추면 됨
  rest:  { f:['stand'],     h:262, sh:'21%' },
  sit:   { f:['read'],      h:205, sh:'40%' },
  eat:   { f:['eat_1','eat_2'], fps:3, h:215, sh:'40%', mouth:[.44,.3] },
  sleep: { f:['sleep'],     h:118, sh:'74%', head:[.2,.3] }
};
/* 동그란 티벳여우 (기본). 예전 여우를 보려면 주소 끝에 ?fox=old
   걷기는 프레임 대신 뒤뚱 걸음(waddle: 걸음마다 좌우 기울기 tilt°, 통통 튐 bob px, 살짝 눌림)으로 코드가 움직임 */
const ROUND_DEFAULT=true;
const FOX_Q=new URLSearchParams(location.search).get('fox');
const ROUND = FOX_Q==='round' || (ROUND_DEFAULT && FOX_Q!=='old');
if (ROUND){
  const waddle={ waddle:true, stride:24, bob:5, tilt:4, h:235, sh:'30%' };
  Object.assign(POSES,{
    stand: { f:['r_stand'], h:240, sh:'30%' },
    walk:  { f:['r_walk'], ...waddle },
    crawl: { f:['r_walk'], ...waddle, stride:24 },    // 등장도 뒤뚱 걸음으로 (천천히 오니 보폭 좁게)
    carry: { f:['r_carry'], ...waddle, bookAt:[.29,.43] },   // 책을 품에 안고 걷기 (bookAt: 그림 속 책 위치 비율)
    reach: { f:['r_reach'], h:258, sh:'30%' },         // 서서 한 앞발 뻗어 뒤적이기
    reachSit:{ f:['r_reach'], h:258, sh:'30%' },
    rest:  { f:['r_rest'],  h:205, sh:'50%' },         // 꼬리 감고 앉아 졸기
    sitdown:{ f:['r_sitdown'], h:228, sh:'40%' },      // 책 안고 앉는 중
    // 몸 돌리기 중간 그림: 옆모습 ↔ 정면 사이 (turn2 = 거의 옆, turn = 비스듬히)
    turn2: { f:['r_turn_b'], h:244, sh:'30%' },
    turn:  { f:['r_turn'],   h:240, sh:'30%' },
    turnCarry: { f:['r_turn_carry'], h:240, sh:'30%' },
    sit:   { f:['r_bookclose'], h:210, sh:'52%' },     // 꼬리 감고 앉아 책 읽기 (먹기 그림과 같은 자세)
    // 먹기: 지금은 한 장(입 벌림) + 씹는 들썩임(css .chewing). 입 다문 컷·책 줄어드는 단계가 생기면 f에 순서대로 추가하고 fps 지정
    eat:   { f:['r_eat2'],  h:210, sh:'52%', mouth:[.5,.4] },
    // 먹기 단계: 한 입마다 다음 그림으로 → 책이 줄어들다 빈손이 됨 (bookclose=입에 대기, eat2=씹기, eat3=반쪽 깨물기, eat4=반쪽 씹기, eat5=빈손)
    eatSteps: ['r_bookclose','r_eat2','r_bookclose','r_eat2','r_eat3','r_eat4','r_eat3','r_eat4','r_eat5'],
    full:  { f:['r_eat5'],  h:210, sh:'52%' },          // 다 먹고 만족
    sleep: { f:['r_sleep'], h:132, sh:'82%', head:[.3,.33] },
    give:  { f:['r_give'],  h:250, sh:'30%' },          // 꽃다발(빈 포장지)을 두 앞발로 든 정면. 꽃은 코드가 꽂음(makeGiveLayer)
  });
}
const SRC = n => `assets/fox/${n}.webp`;
let imgOK=false, frameTimer=null;
const imgCache={};
function preloadFox(){
  const names=[...new Set([...Object.values(POSES).flatMap(p=>Array.isArray(p)?p:p.f), 'r_give_front','r_give_wrap','r_give_wrapfront'])];   // 꽃다발 장면용 겹침 그림도 미리
  return Promise.all(names.map(n=>new Promise((res,rej)=>{ const im=new Image(); imgCache[n]=im; im.onload=()=>(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(res); im.onerror=rej; im.src=SRC(n); })))
    .then(()=>{ imgOK=true; }).catch(()=>{ imgOK=false; });
}
let curImg=null, curFrame=0, stepDist=0;
/* 포즈의 크기·위치 보정·그림자 폭을 그림에 적용 */
function applyLook(img,c){
  img.style.height=c.h+'px';
  img.style.setProperty('--dx',(c.dx||0)+'px'); img.style.setProperty('--dy',(c.dy||0)+'px');
  fox.style.setProperty('--shw', c.sh);
}
/* 옆모습 포즈와 정면 포즈 사이를 오갈 때 중간 그림(몸 돌리기)을 짧게 끼워 넣음.
   포즈 값은 바로 바뀌고(동작 로직은 그대로), 화면에만 중간 그림이 TURN_MS씩 보였다가 최종 그림으로 넘어감 */
const SIDE=new Set(['walk','crawl','carry','reach','reachSit']), FRONT=new Set(['stand','rest','sit','eat','full','give']);
const TURN_MS=110;
let turnTimer=null;
function turnSeq(from,to){
  if (!ROUND || !POSES.turn) return [];
  if (from==='carry' && to==='sit') return ['turnCarry','sitdown'];   // 책 안고 돌아서 → 앉는 중 → 읽기
  if (SIDE.has(from) && FRONT.has(to)) return from==='carry' ? ['turnCarry'] : ['turn2','turn'];
  if (FRONT.has(from) && SIDE.has(to)) return to==='carry' ? ['turnCarry'] : ['turn','turn2'];
  return [];
}
function setPose(p){
  if (p===pose && (imgOK ? curImg : inner.firstChild)){ applyClasses(); return; }
  const seq=turnSeq(pose,p); clearTimeout(turnTimer);
  pose=p; clearInterval(frameTimer); frameTimer=null; bob.style.transform='';
  if (imgOK){
    const c=POSES[p]; const old=[...inner.querySelectorAll('img')];
    const img=new Image(); img.alt=''; img.draggable=false; img.className='enter';
    img.src=SRC(c.f[0]); applyLook(img,c);
    inner.appendChild(img); curImg=img; curFrame=0; stepDist=0;
    if (seq.length){   // 중간 그림부터 보여주고 순서대로 최종 그림으로
      const show=k=>{ if (curImg!==img) return;
        if (k<seq.length){ const m=POSES[seq[k]]; img.src=SRC(m.f[0]); applyLook(img,m); turnTimer=setTimeout(()=>show(k+1), TURN_MS/SPD); }
        else { img.src=SRC(c.f[0]); applyLook(img,c); positionHeld(); } };
      show(0);
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>img.classList.remove('enter')));
    setTimeout(()=>old.forEach(o=>o.remove()), 170);
    if (c.fps && !c.stride){ let i=0; frameTimer=setInterval(()=>{ i=(i+1)%c.f.length; img.src=SRC(c.f[i]); }, 1000/(c.fps*SPD)); }
  } else { curImg=null; inner.innerHTML = ASSETS[p] ? `<img src="${ASSETS[p]}" alt="">` : SVG[p](); }
  applyClasses(); positionHeld();
}
/* 책을 입에 물고 다니기: 포즈의 carry(그림 안 입 위치 비율)에 책을 붙임 */
function positionHeld(){
  const c=POSES[pose];
  if (!imgOK || !c || !c.carry || !curImg){ held.classList.add('no-anchor'); return; }
  held.classList.remove('no-anchor');
  const ar=(curImg.naturalWidth||1)/(curImg.naturalHeight||1), w=c.h*ar;
  let px=FOXS/2 - w/2 + (c.dx||0) + c.carry[0]*w;
  const py=FOXS - c.h + (c.dy||0) + c.carry[1]*c.h;
  if (facing==='right') px=FOXS-px;
  held.style.left=px.toFixed(1)+'px'; held.style.top=py.toFixed(1)+'px';
}
/* 걸은 거리에 맞춰 다리 프레임과 몸 튐을 넘김 (발 미끄러짐 방지) */
function stepFrames(d){
  const c=POSES[pose]; if (!imgOK || !c || !c.stride || !curImg) return;
  stepDist+=d;
  if (c.waddle){   // 뒤뚱 걸음: 한 걸음(stride)마다 좌우로 기울고, 발 디딜 때 살짝 눌렸다 뜰 때 튐
    const ph=stepDist/c.stride*Math.PI, lift=Math.abs(Math.sin(ph));
    bob.style.transform=`translateY(${(-lift*c.bob).toFixed(2)}px) rotate(${(Math.sin(ph)*c.tilt).toFixed(2)}deg) scale(${(1+.015*lift).toFixed(3)},${(1-.03*(1-lift)).toFixed(3)})`;
    return;
  }
  const i=Math.floor(stepDist/c.stride)%c.f.length;
  if (i!==curFrame){ curFrame=i; curImg.src=SRC(c.f[i]); }
  bob.style.transform=`translateY(${(-Math.abs(Math.sin(stepDist/(c.stride*(c.bobPer||1))*Math.PI))*c.bob).toFixed(2)}px)`;
}
function poseAnchor(name, frac){
  const c=POSES[name], im=imgCache[c.f[0]]; const ar=im?(im.naturalWidth/im.naturalHeight):.8, w=c.h*ar;
  let px=FOXS/2 - w/2 + (c.dx||0) + frac[0]*w; const py=FOXS - c.h + (c.dy||0) + frac[1]*c.h;
  if (facing==='right') px=FOXS-px;
  const r=fox.getBoundingClientRect();
  return {x:r.left+px/FOXS*r.width, y:r.top+py/FOXS*r.height, k:r.width/FOXS};
}
function headPoint(){
  const img=curImg;
  if (imgOK && img){
    const r=img.getBoundingClientRect(), h=POSES[pose].head||[.5,.18];
    const fx=facing==='right'?1-h[0]:h[0];
    return {x:r.left+r.width*fx, y:r.top+r.height*h[1]};
  }
  const hd=inner.querySelector('.head'), r=(hd||fox).getBoundingClientRect();
  return {x:r.left+r.width/2, y:r.top+r.height/2};
}
function mouthRect(){
  const img=curImg;
  if (imgOK && img && POSES[pose].mouth){
    const r=img.getBoundingClientRect(), m=POSES[pose].mouth;
    return {left:r.left+r.width*m[0]-20, top:r.top+r.height*m[1], width:40, height:10};
  }
  return spread.getBoundingClientRect();
}
const ACC=520;            // 가속도 (px/s²): 출발·정지가 부드러워짐
let vel=0, mover=null;
function advance(tx,tz,max,dt,acc=ACC){
  const dx=tx-x, dz=tz-z, d=Math.hypot(dx,dz);
  if (d<0.5){ vel=Math.max(0,vel-acc*dt); return {moved:0,left:d}; }
  const want=Math.min(max, Math.max(18, Math.sqrt(2*acc*d)));
  vel+=Math.sign(want-vel)*Math.min(Math.abs(want-vel), acc*dt);
  const step=Math.min(d, vel*dt*SPD);
  const nx=x+dx/d*step, nz=z+dz/d*step;
  const ds=sx(nx,nz)-sx(x,z); if (Math.abs(ds)>.35) face(ds<0?'left':'right');
  place(nx,nz); stepFrames(step);
  return {moved:step,left:d-step};
}
function moveTo(tx,tz,speed,acc){
  if (Math.hypot(tx-x,tz-z)<2) return Promise.resolve();
  return new Promise(res=>{ mover={tx,tz,speed,acc,res}; });
}
function stopMove(){ if (mover){ const r=mover.res; mover=null; vel=0; r(); } }
function fitRoom(){ KS=+Math.min(innerWidth/1280, innerHeight/760).toFixed(3); document.documentElement.style.setProperty('--k', KS); if (typeof place==='function' && fox.style.transform) place(x,z); }
function showHint(){ hint.classList.add('show'); }
function hideHint(){ hint.classList.remove('show'); }
function flash(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }

/* 책장: 끝없이 이어지는 세그먼트 */
const segs = new Map(); const goneSet = new Set();
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* 책장 책: 손으로 그린 책등 그림 (assets/books). ar=가로/세로 비율, c=평균 색 */
const PAINTED=[{"f": "b01", "c": "#7d8584", "ar": 0.295}, {"f": "b02", "c": "#c2a380", "ar": 0.086}, {"f": "b03", "c": "#c8b49a", "ar": 0.24}, {"f": "b04", "c": "#c6a785", "ar": 0.287}, {"f": "b05", "c": "#c2a78a", "ar": 0.118}, {"f": "b06", "c": "#c29c8e", "ar": 0.203}, {"f": "b07", "c": "#96957f", "ar": 0.259}, {"f": "b08", "c": "#888b82", "ar": 0.131}, {"f": "b09", "c": "#c3ac91", "ar": 0.187}, {"f": "b10", "c": "#d9ccb8", "ar": 0.219}, {"f": "b11", "c": "#b69979", "ar": 0.105}, {"f": "b12", "c": "#b28c75", "ar": 0.134}, {"f": "b13", "c": "#c1a78a", "ar": 0.139}, {"f": "b14", "c": "#657174", "ar": 0.18}, {"f": "b15", "c": "#7b4a51", "ar": 0.295}, {"f": "b16", "c": "#afbaaf", "ar": 0.089}, {"f": "b17", "c": "#a092a9", "ar": 0.241}, {"f": "b18", "c": "#758989", "ar": 0.288}, {"f": "b19", "c": "#ab879c", "ar": 0.119}, {"f": "b20", "c": "#c5866f", "ar": 0.204}, {"f": "b21", "c": "#5d404e", "ar": 0.259}, {"f": "b22", "c": "#738361", "ar": 0.135}, {"f": "b23", "c": "#8692a9", "ar": 0.187}, {"f": "b24", "c": "#baa7b2", "ar": 0.213}, {"f": "b25", "c": "#355051", "ar": 0.114}, {"f": "b26", "c": "#9c5062", "ar": 0.136}, {"f": "b27", "c": "#928e9f", "ar": 0.14}, {"f": "b28", "c": "#afaf87", "ar": 0.182}, {"f": "b29", "c": "#b18a4d", "ar": 0.289}, {"f": "b30", "c": "#848a9f", "ar": 0.086}, {"f": "b31", "c": "#535d47", "ar": 0.226}, {"f": "b32", "c": "#a35f4a", "ar": 0.264}, {"f": "b33", "c": "#cd9d7a", "ar": 0.11}, {"f": "b34", "c": "#3d4e53", "ar": 0.213}, {"f": "b35", "c": "#86a09b", "ar": 0.253}, {"f": "b36", "c": "#bb7e74", "ar": 0.122}, {"f": "b37", "c": "#804b33", "ar": 0.216}, {"f": "b38", "c": "#afa564", "ar": 0.213}, {"f": "b39", "c": "#c08948", "ar": 0.104}, {"f": "b40", "c": "#885e5e", "ar": 0.139}, {"f": "b41", "c": "#99a3b0", "ar": 0.139}, {"f": "b42", "c": "#726268", "ar": 0.197}, {"f": "b43", "c": "#766b79", "ar": 0.289}, {"f": "b44", "c": "#d59980", "ar": 0.083}, {"f": "b45", "c": "#889c95", "ar": 0.23}, {"f": "b46", "c": "#724d59", "ar": 0.261}, {"f": "b47", "c": "#c9806b", "ar": 0.11}, {"f": "b48", "c": "#7d7d92", "ar": 0.213}, {"f": "b49", "c": "#516966", "ar": 0.253}, {"f": "b50", "c": "#af98a8", "ar": 0.119}, {"f": "b51", "c": "#8c3c43", "ar": 0.217}, {"f": "b52", "c": "#798a9f", "ar": 0.218}, {"f": "b53", "c": "#9f9888", "ar": 0.098}, {"f": "b54", "c": "#a26440", "ar": 0.146}, {"f": "b55", "c": "#7d7e76", "ar": 0.136}, {"f": "b56", "c": "#b78082", "ar": 0.205}];
const ROW_H=80;   // 선반 한 칸의 책 높이(px) 기준
function nearestPainted(css){
  const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(css.trim()); if (!m) return PAINTED[0];
  const t=[1,2,3].map(i=>parseInt(m[i],16)); let best=PAINTED[0], bd=1e9;
  for (const p of PAINTED){ const q=[1,3,5].map(i=>parseInt(p.c.slice(i,i+2),16)); const d=(q[0]-t[0])**2+(q[1]-t[1])**2+(q[2]-t[2])**2; if (d<bd){ bd=d; best=p; } }
  return best;
}
let lastCamFx=-1;
function setMask(el,k){ const v=`${cam - k*SEG - 3000}px 0`; el.style.webkitMaskPosition=v; el.style.maskPosition=v; }
function makeSeg(k){
  const r=rng(k*7919+13);
  const seg=document.createElement('div'); seg.className='seg'; seg.dataset.k=k; seg.style.left=(k*SEG)+'px'; seg.style.width=SEG+'px';
  const rowW=SEG-8-8; let n=0, real=0;
  for (let ri=0; ri<6; ri++){
    const row=document.createElement('div'); row.className='row';
    let used=0; const bs=[];
    while (used < rowW){                       // 그린 책 그림을 골라, 그림 비율대로 폭을 정해 채움
      const pb=PAINTED[Math.floor(r()*PAINTED.length)], hp=Math.round(80+r()*17);
      let w=Math.max(7,Math.min(30,Math.round(ROW_H*hp/100*pb.ar)));
      if (rowW-used-w < 7) w=rowW-used; else w=Math.min(w,rowW-used);
      bs.push({pb,hp,w}); used+=w+1;
    }
    for (const {pb:pb0,hp,w} of bs){
      const sp=document.createElement('div'); sp.className='spine';
      const id=k+'-'+n; sp.dataset.id=id;
      sp.style.width=w+'px'; sp.style.height=hp+'%';
      let pb=pb0, bg=pb.c;
      if (k===0 && real<BOOKS.length){   // 맨 앞 칸: 실제 책을 순서대로 (책 color와 가장 비슷한 그림을 씀)
        sp.dataset.b=real; sp.classList.add('real');
        const want=bookColor(BOOKS[real]); if (want){ pb=nearestPainted(want); bg=want; }
        real++;
      }
      sp.style.backgroundImage=`url(assets/books/${pb.f}.webp)`;
      sp.style.setProperty('--c',bg); sp.dataset.c=bg;
      if (goneSet.has(id)) sp.classList.add('gone');
      row.appendChild(sp); n++;
    }
    seg.appendChild(row);
  }
  // 꽃덤불(.clump)은 '책꽃' 기능 전까지 쓰지 않음 (언덕에는 풀만)
  setMask(seg,k);
  shelf.appendChild(seg); segs.set(k,seg);
}
function ensureSegs(){
  const kmin=Math.max(0, Math.floor((cam-400)/SEG)), kmax=Math.ceil((cam+1150)/SEG)-1;
  for (const [k,el] of segs) if (k<kmin||k>kmax){ el.remove(); segs.delete(k); }
  for (let k=kmin;k<=kmax;k++) if (!segs.has(k)) makeSeg(k);
}
const floorEl=document.getElementById('floorP');
function applyCam(){
  shelf.style.transform=`translateX(${-cam}px) translateZ(${DEPTH}px)`;
  floorEl.style.backgroundPosition=`0 ${-cam}px`;
  // 언덕은 아주 천천히(시차), 안개 마스크는 화면 기준 위치에 고정. 상속되는 CSS 변수 대신 속성을 직접 바꿔 스타일 재계산을 줄임
  if (cam!==lastCamFx){ lastCamFx=cam;
    stage.style.setProperty('background-position', `calc(88% - ${Math.min(cam*0.04,90).toFixed(1)}px) 100%`, 'important');
    for (const [k,el] of segs) setMask(el,k);
  }
  ensureSegs(); placePile(); placeGarden(); drawFar(); if (hlTarget) queueHL();
}
/* 먼 책장: 지평선까지 이어지는 책장. 진짜 책(.seg)은 가까운 곳만 만들고, 그 너머는
   책장 한 칸을 찍어 둔 그림(assets/tex/farshelf.webp)을 원근에 맞춰 잘게 나눠 #stage 뒤쪽 캔버스에 그림 (DOM이 늘지 않아 가벼움).
   멀수록 크림색 안개가 짙어져 지평선에서 흐려짐 */
const FAR_FROM=380, FAR_TO=90000, FAR_TEX_LEN=SEG;       // 카메라에서 책장 따라 잰 거리(px) 구간, 그림 한 장이 나타내는 책장 길이
const farCv=document.createElement('canvas'); farCv.id='farShelf'; farCv.setAttribute('aria-hidden','true');
const farCtx=farCv.getContext('2d'); const farTex=new Image(); farTex.src='assets/tex/farshelf.webp';
let farDrawn=null;
function sizeFar(){ const d=Math.min(2,devicePixelRatio||1); farCv.width=Math.round(innerWidth*d); farCv.height=Math.round(innerHeight*d); farCtx.setTransform(d,0,0,d,0,0); farDrawn=null; drawFar(); }
function drawFar(){
  if (!farTex.complete || !farTex.naturalWidth) return;
  if (farDrawn===cam) return; farDrawn=cam;
  farCtx.clearRect(0,0,innerWidth,innerHeight);
  const WXF=WX+DEPTH, TW=farTex.naturalWidth, TH=farTex.naturalHeight, ppx=TW/FAR_TEX_LEN;
  const N=170, r=Math.pow(FAR_TO/FAR_FROM,1/N);
  let d0=FAR_FROM;
  for (let j=0;j<N;j++){
    const d1=d0*r, z0=50-d0, z1=50-d1;
    const a=proj(WXF,-260,z0), b=proj(WXF,FLOOR,z0), c=proj(WXF,-260,z1);
    const w=c.x-a.x; if (w<0.25){ d0=d1; continue; }     // 책장은 화면 왼쪽에서 가운데(소실점)로 모임
    const len=d1-d0, X=cam+d0;
    const sw=Math.min(TW, Math.max(1,len*ppx)); let sx=((X*ppx)%TW+TW)%TW; if (sx+sw>TW) sx=Math.max(0,TW-sw);
    farCtx.globalAlpha=1;
    farCtx.drawImage(farTex, sx,0,sw,TH, a.x,a.y,w+0.6,b.y-a.y);
    const haze=Math.min(.985, 1-Math.exp(-(d0-FAR_FROM)/3600));   // 멀수록 안개, 지평선 끝에서는 거의 사라짐
    farCtx.globalAlpha=haze; farCtx.fillStyle='#efe9d6'; farCtx.fillRect(a.x,a.y,w+0.6,b.y-a.y);
    d0=d1;
  }
  farCtx.globalAlpha=1;
}
farTex.onload=()=>{ farDrawn=null; drawFar(); };
function spineZ(sp){
  const k=+sp.parentNode.parentNode.dataset.k;
  return ZN - (SH_START + k*SEG + 8 + sp.offsetLeft + sp.offsetWidth/2 - cam);
}

/* 시작: 오른쪽에서 네 발로 기어 나오기 */
async function intro(){
  const linked=bookFromHash();
  if (linked!=null){ openFromLink(linked); return; }
  setPose('crawl'); face('left'); place(760,-180);
  await wait(150);
  // 책장 앞까지 약 3초 + 일어서기 0.5초 = 등장에서 서기까지 약 4초. 가속도 A로 출발·정지하면서 T초에 도착하는 최고 속도를 계산
  const d=Math.abs(760-FX), T=8, A=1400;
  const vmax=(A*T - Math.sqrt(Math.max(0,(A*T)**2-4*A*d)))/2;
  await moveTo(FX, -180, vmax, A);
  setPose('stand');
  await bob.animate([{transform:'translateY(8px)'},{transform:'translateY(-8px)'},{transform:'none'}],{duration:520/SPD,easing:'ease-out'}).finished;
  mode='idle'; showHint();
  if (pending){ const p=pending; pending=false; fetchAndEat(p===true?null:(p.classList.contains('gone')?null:p)); } else resumeIdle();
}
function resumeIdle(){ if (pointerIn) startFollow(); else idle(); }

/* 커서가 없을 때: 책장 앞을 혼자 서성이기 */
async function idle(){
  following=false;
  const my=++run;
  while (my===run && mode==='idle'){
    setPose('walk');
    await moveTo(FX+rand(-10,25), rand(-500, ZFRONT-60), 80);
    if (my!==run || mode!=='idle') break;
    const r=Math.random();
    if (r<.42){ face('left'); setPose('reach'); await wait(rand(1300,2200)); }
    else if (r<.65){ face('left'); setPose('reachSit'); await wait(rand(2200,3800)); }
    else { setPose('stand'); await wait(rand(800,1500)); }
  }
}

/* 커서 따라가기 */
let following=false, pointerIn=false, px=0, py=0, lastT=0, stillSince=0;
/* 커서가 오른쪽 버튼·말풍선 같은 화면 UI 위에 있으면 여우는 따라가지 않고 그 자리에 멈춰 섬
   (버튼이 지평선 근처라 그대로 따라가면 '아주 먼 안쪽'으로 읽혀 책장이 계속 흘러갔음) */
const UI_SEL='#tools, #giftCard, #toast';
let uiHold=false, deepSince=0; const DEEP_DWELL=450;
function holdForUI(e){
  let on=!!(e.target && e.target.closest && e.target.closest(UI_SEL));
  if (!on && typeof tools!=='undefined'){   // 버튼 둘레 90px도 포함: 버튼으로 다가가는 길에 여우가 뛰쳐나가지 않게
    const r=tools.getBoundingClientRect();
    on = e.clientX>r.left-90 && e.clientY>r.top-90 && e.clientY<r.bottom+90;
  }
  return uiHold=on;
}
const REST_AFTER=10000;        // 커서가 이만큼(ms) 안 움직이면 앉아서 쉼
let pointerMovedAt=0;          // 마지막으로 커서가 움직인 시각
let reachKind='reach', reachSwapAt=0;  // 책장 앞에 멈춰 있는 동안 서서/앉아서 뒤적이기를 번갈아 고름
function pickReach(t){ reachKind=Math.random()<.35?'reachSit':'reach'; reachSwapAt=t+rand(3500,7000); }
function startFollow(){ following=true; run++; stopMove(); pointerMovedAt=performance.now(); }  // 꿈에서 깬 직후 바로 쉬지 않도록 시계를 새로 시작
function screenToTarget(cx,cy){
  const K=KS;
  const ox=innerWidth/2, oy=innerHeight*0.42, off=innerHeight*0.08;
  const fw=(cx-ox)/(K*(WX+DEPTH));
  if (fw>0){
    const yTop=oy+(K*-260+off)*fw, yBot=oy+(K*FLOOR+off)*fw;
    if (cy>=yTop && cy<=yBot) return {x:FX, z:P-P/fw, onShelf:true};
  }
  const ff=(cy-oy)/(K*FLOOR+off);
  if (ff<=0.02) return {x:null, z:-1e5, onShelf:false};
  return {x:(cx-ox)/(ff*K), z:P-P/ff, onShelf:false};
}
function tick(t){
  requestAnimationFrame(tick);
  const dt=Math.min(.1,(t-lastT)/1000||0); lastT=t;
  if (mover){
    const r=advance(mover.tx,mover.tz,mover.speed,dt,mover.acc);
    if (r.left<0.6){ place(mover.tx,mover.tz); const res=mover.res; mover=null; vel=0; res(); }
    return;
  }
  if (mode!=='idle' || !following) return;
  if (uiHold || !snipAsk.hidden){            // 버튼 위·말풍선이 열린 동안: 부드럽게 멈춰 서서 기다림
    const r=advance(x,z,170,dt);
    if (r.moved>0.05) stillSince=t; else if (t-stillSince>140 && pose!=='stand' && pose!=='rest') setPose('stand');
    return;
  }
  const g=screenToTarget(px,py);
  let tx=g.x==null?x:Math.min(Math.max(g.x,FX),470), tz=g.z, scroll=0;
  // 안쪽으로 들어가기는 커서가 깊은 곳에 잠깐(DEEP_DWELL) 머물렀을 때만: 버튼 쪽으로 가다 스쳐 지나가면 책장이 흐르지 않음
  if (tz<ZDEEP){ if (!deepSince) deepSince=t; if (t-deepSince>DEEP_DWELL/SPD) scroll=Math.min(1,(ZDEEP-tz)/450); tz=ZDEEP; }
  else if (tz>ZFRONT){ deepSince=0; if (cam>0 && tz>ZFRONT+120) scroll=-Math.min(1,(tz-ZFRONT-120)/250); tz=ZFRONT; }
  else deepSince=0;
  const r=advance(tx,tz,170,dt);
  let moving=r.moved>0.05;
  if (scroll && (scroll>0 || cam>0)){
    const dcam=scroll*280*SPD*dt; cam=Math.max(0,cam+dcam); applyCam();
    if (r.left<=3){ face(scroll>0?'right':'left'); stepFrames(Math.abs(dcam)); }
    moving=true;
  }
  if (moving){ if (pose!=='walk') setPose('walk'); stillSince=t; reachSwapAt=0; }
  else if (t-stillSince>140){
    let want='stand';
    if (performance.now()-pointerMovedAt>REST_AFTER) want='rest';
    else if (g.onShelf && Math.abs(x-FX)<8 && t-stillSince>700){
      if (t>=reachSwapAt) pickReach(t);
      want=reachKind;
    }
    if (pose!==want){ if (want==='reach'||want==='reachSit') face('left'); setPose(want); }
  }
}
requestAnimationFrame(tick);

/* 클릭: 근처 책 꺼내기 → 앉기 → 펼치기 → 넘기기 → 먹기 → 잠 → 꿈 */
/* 책 꺼내 먹기는 두 묶음: ① fetchAndSit(책장에서 꺼내 와 앉아 읽기) ② eatAndSleep(끝까지 먹고 누워 잠 → 꿈) */
async function fetchAndEat(chosen){ const book=await fetchAndSit(chosen); await eatAndSleep(book); }
let seatedBook=null;   // 책을 들고 앉아 있는 중(단축키 1 뒤)이면 그 책
async function fetchAndSit(chosen){
  mode='busy'; run++; stopMove(); hideHint();
  let spine=chosen;
  if (!spine){
    const all=[...shelf.querySelectorAll('.spine:not(.gone)')];
    let near=all.filter(sp=>{ const zz=spineZ(sp); return zz>-560 && zz<ZFRONT+60; });
    if (!near.length) near=all;
    spine=near[Math.floor(Math.random()*near.length)];
  }
  const bi=spine.dataset.b!=null ? +spine.dataset.b : pickUneaten();
  const book=BOOKS[bi]; eatenBooks.add(bi);
  const color=spine.dataset.c||spine.style.backgroundColor;
  spine.classList.add('picked');

  if (Math.abs(x-FX)>30){ setPose('walk'); await moveTo(FX, Math.min(z,ZFRONT), 130); }
  const need=ZDEEP+40-spineZ(spine);
  if (need>0){ setPose('walk'); await moveTo(FX, ZDEEP, 140); face('right'); await rollCam(need); }
  const bz=Math.min(ZFRONT, Math.max(ZDEEP, spineZ(spine)+40));
  setPose('walk'); await moveTo(FX, bz, 140);
  face('left'); setPose('reach'); await wait(950);
  let r=spine.getBoundingClientRect();
  held.style.setProperty('--cover', color);
  if (imgOK && POSES.carry){
    // 동그란 여우: 책이 포물선을 그리며 날아와 품에 안김 → 책 안은 그림(carry)으로 바뀜
    held.className='';
    const t=poseAnchor('carry', POSES.carry.bookAt), bw=34*t.k, bh=46*t.k;
    const fly=document.createElement('div'); fly.className='flybook';
    Object.assign(fly.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px','--cover':color});
    document.body.appendChild(fly); spine.classList.add('gone'); goneSet.add(spine.dataset.id);
    await fly.animate([
      {left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',transform:'rotate(0deg)'},
      {left:(r.left+(t.x-bw/2-r.left)*.5)+'px',top:(Math.min(r.top,t.y)-60)+'px',width:bw+'px',height:bh+'px',transform:'rotate(-30deg)',offset:.55},
      {left:(t.x-bw/2)+'px',top:(t.y-bh/2)+'px',width:bw+'px',height:bh+'px',transform:'rotate(0deg)'}
    ],{duration:800/SPD,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}).finished;
    setPose('carry'); fly.animate([{opacity:1},{opacity:0}],{duration:160}).finished.then(()=>fly.remove());
    await wait(300);
  } else if (imgOK){
    // 책장에서 빠져나온 책이 포물선을 그리며 여우 입으로 날아가 물림
    held.className='closed hidden'; positionHeld();
    const hr=held.querySelector('.cover').getBoundingClientRect();
    const fly=document.createElement('div'); fly.className='flybook';
    Object.assign(fly.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px','--cover':color});
    document.body.appendChild(fly); spine.classList.add('gone'); goneSet.add(spine.dataset.id);
    const rot=facing==='right'?16:-16;
    await fly.animate([
      {left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',transform:'rotate(0deg)'},
      {left:(r.left+(hr.left-r.left)*.5)+'px',top:(Math.min(r.top,hr.top)-50)+'px',width:hr.width+'px',height:hr.height+'px',transform:`rotate(${rot*2.5}deg)`,offset:.55},
      {left:hr.left+'px',top:hr.top+'px',width:hr.width+'px',height:hr.height+'px',transform:`rotate(${rot}deg)`}
    ],{duration:800/SPD,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}).finished;
    held.className='closed'; fly.remove();
    await wait(250);
  } else {
    const fly=document.createElement('div'); fly.className='flybook';
    Object.assign(fly.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',background:color});
    document.body.appendChild(fly); spine.classList.add('gone'); goneSet.add(spine.dataset.id);
    const fr=fox.getBoundingClientRect();
    const tx=fr.left+fr.width*0.38-r.left, ty=fr.top+fr.height*0.5-r.top;
    await fly.animate([{transform:'none'},{transform:`translate(${tx}px,${ty-60}px) rotate(40deg)`, offset:.55},{transform:`translate(${tx}px,${ty}px) rotate(90deg) scale(.6)`}],
      {duration:750/SPD,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}).finished;
    fly.remove();
    held.className='closed';
  }

  setPose(POSES.carry?'carry':'walk');
  await moveTo(FX, Math.max(z, -200), 150);
  await moveTo(SEAT.x, SEAT.z, 110);

  face('left'); setPose('sit'); await wait(550);
  if (imgOK){ held.className=''; await wait(2600); }
  else {
    held.className='open'; spread.style.clipPath='none'; await wait(500);
    for (let i=0;i<3;i++){ await flipPage(); await wait(260); }
    await wait(450);
  }
  return book;
}
async function eatAndSleep(book){
  mode='busy'; seatedBook=null; hideHint();
  setPose('eat');
  if (ROUND && POSES.eatSteps){
    for (const n of POSES.eatSteps){ if (curImg) curImg.src=SRC(n); if (n!=='r_bookclose') crumbs(); await wait(430); }
    held.className=''; setPose('full'); await wait(900);
  } else {
    for (let b=1;b<=6;b++){ if (!imgOK) bite(b); crumbs(); await wait(imgOK?650:540); }
    held.className=''; if (ROUND){ setPose('rest'); await wait(450); } else { setPose('sit'); await wait(650); }
  }

  setPose('sleep'); startZz(); await wait(2400);
  await enterDream(book);
}
function rollCam(dist){
  return new Promise(res=>{
    const start=cam, t0=performance.now(), dur=Math.max(400, Math.abs(dist)/300*1000)/SPD;
    (function step(t){
      const k=Math.min(1,(t-t0)/dur); cam=start+dist*k; applyCam();
      if (k<1) requestAnimationFrame(step); else res();
    })(t0);
  });
}
function flipPage(){
  const f=document.createElement('div'); f.className='flip'; spread.appendChild(f);
  return f.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}],{duration:560/SPD,easing:'ease-in-out'}).finished.then(()=>f.remove());
}
function bite(b){
  const y=b*16.5, pts=[];
  for (let i=0;i<=8;i++){ const px=i*12.5; const py=Math.min(100, y + (i%2? rand(4,10) : rand(-3,2))); pts.push(`${px}% ${py}%`); }
  spread.style.clipPath = `polygon(${pts.join(',')},100% 100%,0% 100%)`;
}
/* 먹을 때 떨어지는 종잇조각: 찢긴 모양, 글줄 무늬, 팔랑이며 떨어져 바닥에서 사라짐 */
function crumbs(){
  const r=mouthRect(); const floorY=fox.getBoundingClientRect().bottom-4;
  const n=imgOK?3:4;
  for (let i=0;i<n;i++){
    const c=document.createElement('div'); c.className='crumb';
    const w=rand(5,10), h=w*rand(.55,1.1);
    const pts=Array.from({length:6},(_,k)=>{ const a=k/6*Math.PI*2+rand(-.3,.3), rr=rand(.32,.5); return `${(50+Math.cos(a)*rr*100).toFixed(0)}% ${(50+Math.sin(a)*rr*100).toFixed(0)}%`; });
    Object.assign(c.style,{width:w+'px',height:h+'px',left:(r.left+rand(0,r.width))+'px',top:(r.top+rand(0,r.height*.4))+'px',clipPath:`polygon(${pts.join(',')})`});
    document.body.appendChild(c);
    const fall=floorY-r.top, sway=rand(10,22)*(Math.random()<.5?-1:1), spin=rand(120,320)*(Math.random()<.5?-1:1);
    const dur=rand(1300,1900)/SPD;
    c.animate([
      {transform:'translate(0,0) rotate(0deg) rotateX(0deg)',opacity:0},
      {transform:`translate(${sway}px,${fall*.25}px) rotate(${spin*.3}deg) rotateX(60deg)`,opacity:1,offset:.15},
      {transform:`translate(${-sway*.6}px,${fall*.55}px) rotate(${spin*.6}deg) rotateX(140deg)`,offset:.5},
      {transform:`translate(${sway*.4}px,${fall}px) rotate(${spin}deg) rotateX(180deg)`,opacity:.9,offset:.8},
      {transform:`translate(${sway*.4}px,${fall}px) rotate(${spin}deg) rotateX(180deg)`,opacity:0}
    ],{duration:dur*1.6,easing:'ease-in'}).finished.then(()=>c.remove());
  }
}
function startZz(){
  stopZz();
  zzTimer=setInterval(()=>{
    const hp=headPoint();
    const z=document.createElement('div'); z.className='zz'; z.textContent='z';
    z.style.fontSize=rand(14,22)+'px'; z.style.left=hp.x+'px'; z.style.top=(hp.y-24)+'px';
    document.body.appendChild(z);
    z.animate([{transform:'none',opacity:0},{opacity:1,offset:.2},{transform:`translate(${rand(10,40)}px,-70px)`,opacity:0}],{duration:2200}).finished.then(()=>z.remove());
  }, 700);
}
function stopZz(){ clearInterval(zzTimer); zzTimer=null; }

/* 꿈으로 들어가기 */
let dreamSeq=0;               // 꿈마다 번호: 도중에 깨면 이전 꿈의 남은 연출을 멈추는 데 씀
async function enterDream(book){
  mode='dream'; eaten++; lastDreamBook=BOOKS.indexOf(book);
  const my=++dreamSeq;
  const hp=headPoint(); const cx=hp.x, cy=hp.y;
  renderDream(book); tintDream(book); setDreamHash(book);
  dream.classList.add('active'); dream.style.filter='url(#wobble)'; ink.scrollTop=0;
  stage.style.transformOrigin=`${cx}px ${cy}px`;
  zoomAnim=stage.animate([{transform:'scale(1)',filter:'blur(0px)'},{transform:'scale(3)',filter:'blur(10px)'}],
    {duration:1900/SPD,easing:'cubic-bezier(.6,0,.4,1)',fill:'forwards'});
  const R=Math.hypot(innerWidth,innerHeight)*1.2;
  inkAnim=ink.animate([{clipPath:`circle(0px at ${cx}px ${cy}px)`},{clipPath:`circle(${R}px at ${cx}px ${cy}px)`}],
    {duration:2100/SPD,delay:550/SPD,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'});
  // 번지는 도중 Esc로 깨면 wake()가 inkAnim을 취소해 여기서 에러가 나므로 조용히 멈춤
  try { await inkAnim.finished; } catch(e){ return; }
  if (my!==dreamSeq || mode!=='dream') return;
  dream.style.filter='none'; stopZz();
  revealOnScroll(my);
}

/* 구절이 많아도 화면에 들어온 것부터 차례로 떠오르게: 스크롤하면 다음 구절이 하나씩 */
let revealIO=null;
function revealOnScroll(my){
  if (revealIO) revealIO.disconnect();
  const queue=[]; let running=false, focused=false;
  async function run(){
    if (running) return; running=true;
    while (queue.length){
      if (my!==dreamSeq || mode!=='dream'){ running=false; return; }
      queue.sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
      const el=queue.shift(); el.classList.add('in');
      await wait(el.classList.contains('q') ? 900 : 380);
    }
    running=false;
    // 첫 화면이 다 떠오르면 깨기 버튼에 포커스 (키보드 사용자가 바로 나갈 수 있게). 메모를 쓰는 중이면 건드리지 않음
    if (!focused && my===dreamSeq && mode==='dream' && !(document.activeElement && document.activeElement.id==='memo')){ focused=true; const w=dreamInner.querySelector('#wake'); if (w) w.focus({preventScroll:true}); }
  }
  revealIO=new IntersectionObserver(es=>{
    for (const e of es) if (e.isIntersecting){ revealIO.unobserve(e.target); queue.push(e.target); }
    run();
  },{root:ink, threshold:.15, rootMargin:'0px 0px -6% 0px'});
  dreamInner.querySelectorAll('.rv').forEach(el=>revealIO.observe(el));
}

/* 책 color를 꿈 배경의 번지는 물감에 은은하게 (없으면 기본 색) */
function tintDream(b){
  const c=bookColor(b);
  if (!c){ ink.style.removeProperty('--t1'); ink.style.removeProperty('--t3'); return; }
  const probe=document.createElement('i'); probe.style.color=c; document.body.appendChild(probe);
  const m=getComputedStyle(probe).color.match(/[\d.]+/g); probe.remove();
  if (!m) return;
  // 종이색 쪽으로 살짝 밝혀서 어두운 색도 무겁지 않게
  const [r,g,bl]=m.slice(0,3).map(v=>Math.round(+v+(255-+v)*.22));
  ink.style.setProperty('--t1',`rgba(${r},${g},${bl},.30)`);
  ink.style.setProperty('--t3',`rgba(${r},${g},${bl},.20)`);
}

/* 책마다 공유용 주소: #book-제목 (띄어쓰기는 -) */
function bookSlug(b){ return String(b.title||'').normalize('NFC').trim().replace(/\s+/g,'-'); }
function bookLink(b){ return location.origin+location.pathname+location.search+'#book-'+encodeURIComponent(bookSlug(b)); }
function bookFromHash(){
  const h=location.hash; if (!h.startsWith('#book-')) return null;
  let want; try { want=decodeURIComponent(h.slice(6)).normalize('NFC'); } catch(e){ return null; }
  const i=BOOKS.findIndex(b=>bookSlug(b)===want);
  return i<0 ? null : i;
}
function setDreamHash(b){
  if (location.hash==='#debug' || BOOKS===NO_BOOKS) return;   // 조정 패널을 보는 중이면 주소를 건드리지 않음
  history.replaceState(null,'','#book-'+encodeURIComponent(bookSlug(b)));
}
function clearDreamHash(){
  if (location.hash.startsWith('#book-')) history.replaceState(null,'',location.pathname+location.search);
}
/* 링크로 들어왔을 때: 여우는 이미 책을 먹고 잠든 상태에서 바로 꿈으로 */
async function openFromLink(i){
  mode='busy'; hideHint();
  const sp=shelf.querySelector(`.spine.real[data-b="${i}"]`);
  if (sp){ sp.classList.add('gone'); goneSet.add(sp.dataset.id); }
  eatenBooks.add(i);
  face('left'); place(SEAT.x, SEAT.z); setPose('sleep'); startZz();
  await wait(900);
  await enterDream(BOOKS[i]);
}
/* 페이지를 보는 중에 #book-제목 주소로 바꾸면: 여우가 그 책을 꺼내 먹음 */
addEventListener('hashchange', ()=>{
  const i=bookFromHash(); if (i==null || mode!=='idle') return;
  if (VIEW){ if (pile.includes(i)) dreamAgain(i); return; }
  const sp=shelf.querySelector(`.spine.real[data-b="${i}"]:not(.gone)`);
  if (sp) fetchAndEat(sp); else openFromLink(i);
});
async function copyDreamLink(b){
  const url=bookLink(b);
  try {
    await Promise.race([navigator.clipboard.writeText(url), new Promise((_,rej)=>setTimeout(rej,1500))]);
    flash('이 꿈의 링크를 복사했어요');
  } catch(e){ flash(url); }
}
function esc(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
/* 꿈 페이지: 제목 · 작가 · 인상 깊은 문장(페이지는 있으면) · 메모
   메모는 이 브라우저(localStorage 'peakaboo-memo')에 책마다 저장. 처음엔 books.json 의 note 를 보여줌 */
const MEMO_KEY='peakaboo-memo';
function readMemos(){ if (VIEW) return viewData.m; try { const v=JSON.parse(localStorage.getItem(MEMO_KEY)||'{}'); return v&&typeof v==='object'?v:{}; } catch(e){ return {}; } }
function pageLabel(p){ p=String(p||'').trim(); return !p?'':/^\d+(\s*[-~–]\s*\d+)?$/.test(p)?'p. '+p:p; }
function renderDream(b){
  const slug=bookSlug(b), memos=readMemos(), memo=memos[slug]!=null?memos[slug]:(b.note||'');
  const quotes=(b.quotes||[]).filter(q=>q&&q.t);
  dreamInner.innerHTML = `
    <h1 class="dtitle rv">${esc(b.title)}</h1>
    <p class="dauthor rv">${esc(b.author||'')}</p>
    ${quotes.length?`<h2 class="dlabel rv">인상 깊은 문장</h2>`:''}
    ${quotes.map(q=>{ const pg=pageLabel(q.p); return `<blockquote class="q rv"><p>${esc(q.t)}</p>${pg?`<span>${esc(pg)}</span>`:''}</blockquote>`; }).join('')}
    ${VIEW ? (memo.trim()?`<div class="dmemo rv"><h2 class="dlabel">메모</h2><p class="memo-view">${esc(memo)}</p></div>`:'') : `<div class="dmemo rv">
      <label class="dlabel" for="memo">메모</label>
      <textarea id="memo" rows="3" placeholder="이 책에 대해 짧게 남겨 두세요">${esc(memo)}</textarea>
      <small id="memoState" aria-live="polite">이 브라우저에 저장돼요</small>
    </div>`}
    <div class="actions rv">
      ${b.blog?`<a href="${esc(b.blog)}" target="_blank" rel="noopener">블로그 서평 읽기</a>`:''}
      <button id="share" type="button" class="ghost">이 꿈 링크 복사</button>
      <button id="wake" type="button">꿈에서 깨기</button>
    </div>`;
  dreamInner.querySelector('#wake').addEventListener('click', wake);
  dreamInner.querySelector('#share').addEventListener('click', ()=>copyDreamLink(b));
  const ta=dreamInner.querySelector('#memo'), st=dreamInner.querySelector('#memoState'); let tmr=0;
  if (!ta) return;
  const fit=()=>{ ta.style.height='auto'; ta.style.height=Math.max(ta.scrollHeight,84)+'px'; };
  ta.addEventListener('input', ()=>{ fit(); clearTimeout(tmr); st.textContent='저장하는 중…';
    tmr=setTimeout(()=>{ const m=readMemos(); m[slug]=ta.value; try { localStorage.setItem(MEMO_KEY, JSON.stringify(m)); st.textContent='저장했어요'; } catch(e){ st.textContent='저장하지 못했어요'; } }, 400); });
  ta.addEventListener('keydown', e=>{ if (e.key==='Escape'){ e.stopPropagation(); ta.blur(); } });   // 메모 중 Esc는 글쓰기만 끝냄 (한 번 더 누르면 꿈에서 깸)
  requestAnimationFrame(fit);
}

/* 꿈에서 깨기 */
async function wake(){
  if (mode!=='dream') return;
  mode='waking'; stopZz(); if (revealIO) revealIO.disconnect(); clearDreamHash();
  const fade=dream.animate([{opacity:1},{opacity:0}],{duration:800/SPD,easing:'ease',fill:'forwards'});
  if (zoomAnim){ zoomAnim.cancel(); }
  const back=stage.animate([{transform:'scale(3)',filter:'blur(10px)'},{transform:'scale(1)',filter:'blur(0px)'}],{duration:1100/SPD,easing:'cubic-bezier(.4,0,.2,1)'});
  setPose('sit');
  await fade.finished;
  dream.classList.remove('active'); dream.style.filter='none'; fade.cancel(); if (inkAnim) inkAnim.cancel();
  await back.finished;
  await wait(300);
  setPose('stand');
  await bob.animate([{transform:'scaleY(.94)'},{transform:'scaleY(1.06)'},{transform:'none'}],{duration:600/SPD}).finished;
  await addToPile(lastDreamBook);
  mode='idle'; showHint(); resumeIdle();
}

/* =========================================================
   꽃 자르기 → 꽃다발: 오른쪽 가위 버튼.
   여우가 화면 앞으로 걸어 나와 서면, 언덕의 꽃을 한 송이씩 잘라 품에 모아 꽃다발을 만들고
   화면 너머의 사람에게 건넴. 받으면 언덕은 다시 풀밭, 먹은 책 더미도 비워짐 (먹은 책 기록은 archive.html 에 남음)
   ========================================================= */
const GIVE={x:24, z:ZFRONT-20};             // 꽃다발을 든 여우가 서는 자리 (x는 꽃다발이 화면 가운데에 오도록)
/* r_give(꽃다발 든 여우) 그림 안의 위치 비율: 꽃줄기가 모이는 곳(포장지 안), 포장지 입구 폭 */
const GIVE_STEM=[.357,.566], GIVE_OPEN=.45;
const SCISSORS='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.4 7.8 20 17.5M8.4 16.2 20 6.5"/></svg>';
const tools=$('#tools'), snipBtn=$('#snip'), snipAsk=$('#snipAsk');
/* 꽃다발 층: 여우 그림(r_give) 위에 같은 크기로 겹침. [꽃들] 위에 [앞쪽 포장지·앞발(r_give_front)]을 덮어서 꽃이 포장지 안에 꽂힌 것처럼 보임 */
function makeGiveLayer(n){
  const c=POSES.give, im=imgCache[c.f[0]], ar=im?im.naturalWidth/im.naturalHeight:.66, w=c.h*ar;
  const el=document.createElement('div'); el.id='giveLayer';
  Object.assign(el.style,{left:(FOXS/2-w/2+(c.dx||0))+'px',top:(FOXS-c.h+(c.dy||0))+'px',width:w+'px',height:c.h+'px'});
  el.innerHTML=`<div class="bq-stems" style="left:${(GIVE_STEM[0]*100).toFixed(1)}%;top:${(GIVE_STEM[1]*100).toFixed(1)}%"></div><img class="bq-front" alt="" src="${SRC('r_give_front')}">`;
  const stems=el.querySelector('.bq-stems'), slots=[], r=rng(n*97+3);
  for (let k=0;k<n;k++){    // 가운데가 높고 바깥이 낮은 부채꼴. 줄기 끝이 모두 포장지 안 한 점에 모임
    const u=n===1?0:(k/(n-1))*2-1;
    slots.push({ang:u*Math.min(38,10+n*5)+(r()*6-3), fh:c.h*(.34-.06*Math.abs(u)+r()*.025)});   // 꽃 머리가 코 높이쯤에서 멈춰 눈을 가리지 않게
  }
  const order=slots.map((s,k)=>k).sort((a,b)=>Math.abs(slots[b].ang)-Math.abs(slots[a].ang));   // 바깥 꽃부터 → 가운데 꽃이 앞
  for (const k of order){ const d=document.createElement('div'); d.className='bq-f'; d.dataset.k=k; stems.appendChild(d); }
  bob.appendChild(el);
  return {el,slots};
}
function fillSlot(bq,k,f){       // f: 언덕의 .bflower → 그 꽃 모양·색으로 꽃다발 자리를 채움
  const d=bq.el.querySelector(`.bq-f[data-k="${k}"]`), s=bq.slots[k];
  const ar=parseFloat(f.style.width)/parseFloat(f.style.height);
  d.style.height=s.fh+'px'; d.style.width=(s.fh*ar)+'px';
  d.style.transform=`translateX(-50%) rotate(${s.ang.toFixed(1)}deg)`; d.dataset.ang=s.ang;
  d.style.backgroundImage=f.style.backgroundImage; d.style.setProperty('--c', f.style.getPropertyValue('--c'));
  const t=f.querySelector('i'), i=document.createElement('i');
  i.style.webkitMaskImage=t.style.webkitMaskImage; i.style.maskImage=t.style.maskImage; d.appendChild(i);
  return d;
}
function snipAt(x,y){            // 꽃대 위에서 가위가 싹둑
  const s=document.createElement('div'); s.className='snipfx'; s.innerHTML=SCISSORS;
  s.style.left=x+'px'; s.style.top=y+'px'; document.body.appendChild(s);
  s.animate([{transform:'translate(-50%,-50%) scale(.4) rotate(-30deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.1) rotate(8deg)',opacity:1,offset:.45},
             {transform:'translate(-50%,-50%) scale(1) rotate(-14deg)',opacity:1,offset:.7},{transform:'translate(-50%,-50%) scale(.9) rotate(0deg)',opacity:0}],
            {duration:560/SPD,easing:'ease-out'}).finished.then(()=>s.remove());
}
async function flyToBouquet(f,slotEl){
  const a=f.getBoundingClientRect(); snipAt(a.left+a.width/2, a.bottom-a.height*.22);
  await wait(200);
  const b=slotEl.getBoundingClientRect();
  const fly=f.cloneNode(true); fly.className='bflower flying'; fly.removeAttribute('title');
  Object.assign(fly.style,{position:'fixed',left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px',transform:'none',display:'',zIndex:24});
  document.body.appendChild(fly); f.style.visibility='hidden';
  const dx=b.left+b.width/2-(a.left+a.width/2), dy=b.top+b.height/2-(a.top+a.height/2), sc=b.height/a.height, ang=+slotEl.dataset.ang;
  await fly.animate([{transform:'none'},
    {transform:`translate(${dx*.5}px,${dy*.5-120}px) rotate(${ang*.5-20}deg) scale(${(1+sc)/2})`,offset:.5},
    {transform:`translate(${dx}px,${dy}px) rotate(${ang}deg) scale(${sc})`}],
    {duration:820/SPD,easing:'cubic-bezier(.35,.1,.3,1)',fill:'forwards'}).finished;
  fly.remove(); slotEl.style.visibility='';
  slotEl.animate([{transform:slotEl.style.transform+' scale(1.08)'},{transform:slotEl.style.transform}],{duration:240});
}
function askSnip(){
  if (mode!=='idle'){ flash('여우가 하던 일을 마치면 다시 눌러 주세요'); return; }
  if (!pile.length){ flash('아직 핀 꽃이 없어요. 여우가 책을 먹으면 꽃이 피어요'); return; }
  snipAsk.querySelector('.ask-n').textContent=pile.length;
  snipAsk.hidden=false; snipBtn.setAttribute('aria-expanded','true');
  snipAsk.querySelector('.ask-yes').focus();
}
function closeAsk(){ snipAsk.hidden=true; snipBtn.setAttribute('aria-expanded','false'); }
async function cutFlowers(){
  closeAsk();
  if (mode!=='idle' || !pile.length) return;
  mode='busy'; run++; following=false; stopMove(); hideHint(); tools.classList.add('off');
  const books=pile.slice();
  if (cam>0) await rollCam(-cam);
  setPose('walk'); await moveTo(GIVE.x, GIVE.z, 190);
  face('left'); setPose('give'); await wait(350);
  const bq=makeGiveLayer(books.length);
  // 꽃을 한 송이씩 잘라 꽃다발로 (가까운 꽃부터, 꽃이 많으면 더 빨리)
  const fl=[...gardenEl.querySelectorAll('.bflower')].sort((a,b)=>+b.dataset.z-+a.dataset.z);
  const gap=Math.max(140, Math.min(520, 3600/fl.length));
  const jobs=fl.map((f,j)=>{ const s=fillSlot(bq,j,f); s.style.visibility='hidden'; return wait(j*gap).then(()=>flyToBouquet(f,s)); });
  await Promise.all(jobs);
  // 언덕은 다시 풀밭, 더미도 비움 (먹은 책 기록은 남음)
  pile=[]; savePile(); renderPile(); placePile(); gardenEl.innerHTML='';
  const bqs=readList(BOUQUET_KEY); bqs.push({t:Date.now(), b:books.map(i=>bookSlug(BOOKS[i]))}); writeList(BOUQUET_KEY,bqs);
  await wait(500);
  await giveBouquet(bq, books);
  mode='idle'; tools.classList.remove('off'); showHint(); resumeIdle();
}
/* 화면 너머로 건네기: 카메라가 꽃다발 쪽으로 다가가(#stage 확대) 여우가 꽃다발을 내미는 모습을 크게 보여줌 →
   '꽃다발 받기'를 누르면 꽃다발(포장지+꽃)만 떨어져 화면 아래(받는 사람 손)로 내려가고, 여우는 빈손으로 꾸벅 → 카메라가 돌아옴 */
function giveBouquet(bq, books){
  return new Promise(async res=>{
    const veil=document.createElement('div'); veil.id='giftVeil'; stage.insertBefore(veil, fox);
    veil.animate([{opacity:0},{opacity:1}],{duration:900/SPD,fill:'forwards'});
    const r0=bq.el.getBoundingClientRect(), bx=r0.left+r0.width*GIVE_STEM[0], by=r0.top+r0.height*.42;
    const zs=Math.min(2.6, innerHeight*.78/r0.height);
    // 확대한 화면 가장자리가 비지 않게 이동량을 제한
    const tx=Math.min(0,Math.max(innerWidth*(1-zs), innerWidth/2-zs*bx)), ty=Math.min(0,Math.max(innerHeight*(1-zs), innerHeight*.4-zs*by));
    const zoomIn=[{transform:'none'},{transform:`translate(${tx}px,${ty}px) scale(${zs})`}];
    stage.style.transformOrigin='0 0';
    await stage.animate(zoomIn,{duration:1800/SPD,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'}).finished;
    const card=document.createElement('div'); card.id='giftCard'; card.setAttribute('role','dialog'); card.setAttribute('aria-label','여우가 건넨 꽃다발');
    card.innerHTML=`<p class="g1">여우가 꽃다발을 건네요</p>
      <p class="g2">책 ${books.length}권을 먹고 핀 꽃 ${books.length}송이</p>
      <p class="g3">${books.map(i=>esc(BOOKS[i].title)).join(' · ')}</p>
      <button type="button">꽃다발 받기</button>`;
    document.body.appendChild(card);
    requestAnimationFrame(()=>card.classList.add('show'));
    const btn=card.querySelector('button'); btn.focus();
    const take=async ()=>{
      removeEventListener('keydown',onKey); btn.disabled=true; card.classList.remove('show');
      // 꽃다발만 떼어 내기: 지금 화면 위치 그대로 [포장지만 그림 + 꽃들]을 복제해 띄움
      const r=bq.el.getBoundingClientRect();
      const gift=document.createElement('div'); gift.id='giftAway';
      Object.assign(gift.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
      const stems=bq.el.querySelector('.bq-stems').cloneNode(true);
      const k=r.height/POSES.give.h; stems.style.transform=`scale(${k})`; stems.style.transformOrigin='0 0';
      gift.innerHTML=`<img class="bq-wrapimg" alt="" src="${SRC('r_give_wrap')}"><img class="bq-wrapimg" alt="" src="${SRC('r_give_wrapfront')}">`; gift.insertBefore(stems, gift.lastChild);   // 포장지 뒤 → 꽃 → 포장지 앞
      document.body.appendChild(gift);
      bq.el.remove(); setPose('stand');
      veil.animate([{opacity:1},{opacity:0}],{duration:1000/SPD,fill:'forwards'});
      const back=stage.animate(zoomIn.slice().reverse(),{duration:1600/SPD,delay:500/SPD,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
      bob.animate([{transform:'none'},{transform:'rotate(-6deg) translateY(4px)',offset:.4},{transform:'none'}],{duration:900/SPD,easing:'ease-in-out'});   // 꾸벅
      await gift.animate([{transform:'none',opacity:1},{transform:`translateY(${innerHeight*.6}px) scale(1.25)`,opacity:0}],
        {duration:950/SPD,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'}).finished;
      gift.remove(); card.remove(); await back.finished; back.cancel(); stage.getAnimations().forEach(a=>a.cancel()); stage.style.transformOrigin=''; veil.remove();
      flash('꽃다발을 받았어요. 풀밭은 다시 고요해졌어요');
      res();
    };
    const onKey=e=>{ if (e.key==='Escape') take(); };
    addEventListener('keydown',onKey);
    btn.addEventListener('click',take);
  });
}
snipBtn.addEventListener('click', ()=>{ snipAsk.hidden ? askSnip() : closeAsk(); });
snipAsk.querySelector('.ask-yes').addEventListener('click', cutFlowers);
snipAsk.querySelector('.ask-no').addEventListener('click', ()=>{ closeAsk(); snipBtn.focus(); });
snipAsk.addEventListener('keydown', e=>{ if (e.key==='Escape'){ closeAsk(); snipBtn.focus(); } });

/* 단축키 (영상 찍을 때 등 빠르게):
   1 = 책장에서 책을 꺼내 와 앉아 읽기까지 (그 자리에서 멈춰 기다림)
   2 = 앉아서 끝까지 먹고 누워 잠들기 → 꿈 (앉아 있지 않으면 1부터 이어서 한 번에) */
async function shortcutSit(){
  if (VIEW || mode!=='idle') return;
  const book=await fetchAndSit(null);
  seatedBook=book; mode='seated'; flash('책을 들고 앉았어요 · 2를 누르면 먹어요');
}
async function shortcutEat(){
  if (VIEW) return;
  if (mode==='seated' && seatedBook) return eatAndSleep(seatedBook);
  if (mode==='idle') return fetchAndEat(null);
}
addEventListener('keydown', e=>{
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const t=e.target; if (t && (t.tagName==='TEXTAREA' || t.tagName==='INPUT' || t.isContentEditable)) return;
  if (e.key==='1'){ e.preventDefault(); shortcutSit(); }
  else if (e.key==='2'){ e.preventDefault(); shortcutEat(); }
});

/* 보기 전용 화면: 꽃(과 먹은 책 더미)을 눌러 그 책의 꿈을 보는 것만 가능. 책 먹기·꽃 자르기·메모 쓰기·링크 만들기 없음 */
function setupViewMode(){
  document.body.classList.add('view-only');
  $('#label').textContent='밑줄 먹는 여우 · 보기 전용';
  hint.textContent = pile.length ? '커서를 움직이면 여우가 따라와요 · 풀밭의 꽃을 누르면 그 책의 꿈을 꿔요' : '아직 핀 꽃이 없어요';
  $('#snip').hidden=true; $('#shareView').hidden=true; snipAsk.hidden=true;
  $('#toArchive').href='archive'+viewQuery();   // .html 을 붙이면 서버가 깨끗한 주소로 넘기며 ?view= 를 버릴 수 있음
  shelf.setAttribute('aria-label','책장 (보기 전용)'); shelf.removeAttribute('role');
}
$('#shareView').addEventListener('click', async ()=>{
  if (!pile.length && !readList(ARCHIVE_KEY).length){ flash('아직 먹은 책이 없어요. 책을 먹으면 꽃이 피어요'); return; }
  const url=await makeViewLink();
  try { await Promise.race([navigator.clipboard.writeText(url), new Promise((_,rej)=>setTimeout(rej,1500))]); flash('보기 전용 링크를 복사했어요 · 지금 꽃밭 그대로 보여줘요'); }
  catch(e){ prompt('보기 전용 링크', url); }
});

/* 입력 */
function pickSpine(e){
  let t=e && e.target;
  if (t && t.classList && t.classList.contains('spine') && !t.classList.contains('gone')) return t;
  const row=t && t.closest ? (t.closest('.row') || (t.classList.contains('seg') ? null : null)) : null;
  const pool=row ? [...row.querySelectorAll('.spine:not(.gone)')] : [...shelf.querySelectorAll('.spine:not(.gone)')];
  if (!pool.length || !e || e.clientX==null) return null;
  let best=null, bd=1e9;
  for (const sp of pool){ const r=sp.getBoundingClientRect(); const d=Math.hypot(r.left+r.width/2-e.clientX, r.top+r.height/2-e.clientY); if (d<bd){ bd=d; best=sp; } }
  return best;
}
function onShelf(e){
  if (VIEW){ if (mode==='idle') flash('보기 전용이에요 · 풀밭의 꽃을 누르면 그 책을 볼 수 있어요'); return; }
  const sp=pickSpine(e);
  if (mode==='idle') fetchAndEat(sp);
  else if (mode==='intro'){ pending=sp||true; }
}
shelf.addEventListener('click', onShelf);
shelf.addEventListener('keydown', e=>{ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); onShelf(); } });
addEventListener('keydown', e=>{ if (e.key==='Escape' && mode==='dream' && !(e.target && e.target.id==='memo')) wake(); });
addEventListener('pointermove', e=>{ if (holdForUI(e)) return; px=e.clientX; py=e.clientY; pointerIn=true; pointerMovedAt=performance.now(); if (mode==='idle' && !following) startFollow(); });
/* 커서 아래 책 강조: 평면 레이어 하나를 그 책 위치로 옮김 (한 프레임에 한 번만) */
const spineHL=document.createElement('div'); spineHL.id='spineHL'; stage.appendChild(spineHL);
let hlTarget=null, hlQueued=false;
function updateHL(){
  hlQueued=false;
  const sp=hlTarget;
  if (!sp || sp.classList.contains('gone') || mode==='dream'){ spineHL.classList.remove('on'); return; }
  const r=sp.getBoundingClientRect();
  spineHL.style.transform=`translate(${r.left.toFixed(1)}px,${r.top.toFixed(1)}px)`; spineHL.style.width=r.width.toFixed(1)+'px'; spineHL.style.height=r.height.toFixed(1)+'px';
  spineHL.classList.add('on');
}
function queueHL(){ if (!hlQueued){ hlQueued=true; requestAnimationFrame(updateHL); } }
shelf.addEventListener('pointerover', e=>{ hlTarget=(e.target.closest && e.target.closest('.spine'))||null; queueHL(); });
shelf.addEventListener('pointerleave', ()=>{ hlTarget=null; spineHL.classList.remove('on'); });
addEventListener('pointerdown', e=>{ if (holdForUI(e)) return; px=e.clientX; py=e.clientY; pointerIn=true; pointerMovedAt=performance.now(); if (mode==='idle' && !following) startFollow(); });
document.documentElement.addEventListener('pointerleave', ()=>{ pointerIn=false; if (following){ following=false; if (mode==='idle') idle(); } });

addEventListener('resize', fitRoom);

/* 시작 */
function start(){ stage.insertBefore(farCv, stage.firstChild); sizeFar(); addEventListener('resize', sizeFar); if (held.parentNode!==bob) bob.appendChild(held); if (fox.parentNode!==stage) stage.appendChild(fox); fitRoom(); Promise.all([loadBooks(), preloadFox(), viewReady.then(v=>{ viewData=v; })]).then(()=>{ document.getElementById('world').appendChild(gardenEl); document.getElementById('world').appendChild(pileEl); loadPile(); renderPile(); renderGarden(); if (VIEW) setupViewMode(); applyCam(); intro(); loadDebug(); }); }
/* #debug 일 때만 조정 패널 스크립트를 불러옴 (없으면 패널 코드 자체가 로드되지 않음) */
function loadDebug(){
  if (location.hash!=='#debug') return;
  if (window.FoxDebug){ FoxDebug.show(); return; }
  const sc=document.createElement('script'); sc.src='js/debug.js'; document.body.appendChild(sc);
}
addEventListener('hashchange', ()=>{ if (location.hash==='#debug') loadDebug(); else if (window.FoxDebug) FoxDebug.hide(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
