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
const PALETTE=['#8C6A5A','#A98F6B','#6F7F78','#9AA4AE','#B98B7A','#7B6F8C','#C2A57A','#5F6B73','#A7826A','#8E9C85','#B4A08A','#6E5B4E'];
const BEHAV={crawl:'walking',walk:'walking',reach:'reaching',reachSit:'reaching',eat:'chewing',sleep:'sleeping',rest:'resting'};

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

function tf(px,pz){ return `translate3d(${px-FOXS/2}px,${FLOOR-FOXS}px,${pz}px)`; }
function place(nx,nz=z){ x=nx; z=nz; fox.style.transform=tf(x,z); fox.style.setProperty('--br', Math.max(.5,Math.min(.97,.94+z*.0007)).toFixed(3)); }
function sx(px,pz){ return px*P/(P-pz); }
function applyClasses(){ fox.className = ['pose-'+pose, BEHAV[pose]||'', facing==='right'?'face-right':'', imgOK?'img-mode':''].join(' ').trim(); }
function face(dir){ facing=dir; inner.style.transform = dir==='left' ? 'none' : 'scaleX(-1)'; applyClasses(); }
/* 여우 그림 설정: 프레임, 초당 프레임 수, 화면 높이(px), 그림자 폭, 머리 위치(비율) */
const POSES = {
  crawl: { f:['crawl_1','crawl_2','crawl_3','crawl_4'], stride:22, bob:2, h:135, sh:'58%' },
  walk:  { f:['walk_1','walk_2','walk_3','walk_4'],     stride:30, bob:4, h:255, sh:'27%' },
  stand: { f:['stand'],     h:262, sh:'21%' },
  reach: { f:['reach'],     h:272, sh:'26%' },
  reachSit:{ f:['reach_sit'], h:225, sh:'40%' },  // 앉아서 뒤적이기
  // 앉아서 쉬기: 지금은 책 없이 앉은 그림이 없어 stand 그림 + 큰 숨쉬기(css .resting)로 임시 처리.
  // 그림이 생기면 f만 ['rest'] 등으로 바꾸고 h·sh를 맞추면 됨
  rest:  { f:['stand'],     h:262, sh:'21%' },
  sit:   { f:['read'],      h:205, sh:'40%' },
  eat:   { f:['eat_1','eat_2'], fps:3, h:215, sh:'40%', mouth:[.44,.3] },
  sleep: { f:['sleep'],     h:118, sh:'74%', head:[.2,.3] }
};
const SRC = n => `assets/fox/${n}.webp`;
let imgOK=false, frameTimer=null;
function preloadFox(){
  const names=[...new Set(Object.values(POSES).flatMap(p=>p.f))];
  return Promise.all(names.map(n=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(res); im.onerror=rej; im.src=SRC(n); })))
    .then(()=>{ imgOK=true; }).catch(()=>{ imgOK=false; });
}
let curImg=null, curFrame=0, stepDist=0;
function setPose(p){
  if (p===pose && (imgOK ? curImg : inner.firstChild)){ applyClasses(); return; }
  pose=p; clearInterval(frameTimer); frameTimer=null; bob.style.transform='';
  if (imgOK){
    const c=POSES[p]; const old=[...inner.querySelectorAll('img')];
    const img=new Image(); img.alt=''; img.draggable=false; img.className='enter';
    img.src=SRC(c.f[0]); img.style.height=c.h+'px';
    inner.appendChild(img); curImg=img; curFrame=0; stepDist=0;
    requestAnimationFrame(()=>requestAnimationFrame(()=>img.classList.remove('enter')));
    setTimeout(()=>old.forEach(o=>o.remove()), 170);
    if (c.fps && !c.stride){ let i=0; frameTimer=setInterval(()=>{ i=(i+1)%c.f.length; img.src=SRC(c.f[i]); }, 1000/(c.fps*SPD)); }
    fox.style.setProperty('--shw', c.sh);
  } else { curImg=null; inner.innerHTML = ASSETS[p] ? `<img src="${ASSETS[p]}" alt="">` : SVG[p](); }
  applyClasses();
}
/* 걸은 거리에 맞춰 다리 프레임과 몸 튐을 넘김 (발 미끄러짐 방지) */
function stepFrames(d){
  const c=POSES[pose]; if (!imgOK || !c || !c.stride || !curImg) return;
  stepDist+=d;
  const i=Math.floor(stepDist/c.stride)%c.f.length;
  if (i!==curFrame){ curFrame=i; curImg.src=SRC(c.f[i]); }
  bob.style.transform=`translateY(${(-Math.abs(Math.sin(stepDist/c.stride*Math.PI))*c.bob).toFixed(2)}px)`;
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
function advance(tx,tz,max,dt){
  const dx=tx-x, dz=tz-z, d=Math.hypot(dx,dz);
  if (d<0.5){ vel=Math.max(0,vel-ACC*dt); return {moved:0,left:d}; }
  const want=Math.min(max, Math.max(18, Math.sqrt(2*ACC*d)));
  vel+=Math.sign(want-vel)*Math.min(Math.abs(want-vel), ACC*dt);
  const step=Math.min(d, vel*dt*SPD);
  const nx=x+dx/d*step, nz=z+dz/d*step;
  const ds=sx(nx,nz)-sx(x,z); if (Math.abs(ds)>.35) face(ds<0?'left':'right');
  place(nx,nz); stepFrames(step);
  return {moved:step,left:d-step};
}
function moveTo(tx,tz,speed){
  if (Math.hypot(tx-x,tz-z)<2) return Promise.resolve();
  return new Promise(res=>{ mover={tx,tz,speed,res}; });
}
function stopMove(){ if (mover){ const r=mover.res; mover=null; vel=0; r(); } }
function fitRoom(){ document.documentElement.style.setProperty('--k', Math.min(innerWidth/1280, innerHeight/760).toFixed(3)); }
function showHint(){ hint.classList.add('show'); }
function hideHint(){ hint.classList.remove('show'); }
function flash(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }

/* 책장: 끝없이 이어지는 세그먼트 */
const segs = new Map(); const goneSet = new Set();
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function makeSeg(k){
  const r=rng(k*7919+13);
  const seg=document.createElement('div'); seg.className='seg'; seg.dataset.k=k; seg.style.left=(k*SEG)+'px'; seg.style.width=SEG+'px';
  const rowW=SEG-8-8; let n=0, real=0;
  for (let ri=0; ri<6; ri++){
    const row=document.createElement('div'); row.className='row';
    let used=0; const ws=[];
    while (used < rowW){
      let w=Math.round(12+r()*15);
      if (rowW-used-w < 12) w=rowW-used; else w=Math.min(w,rowW-used);
      ws.push(w); used+=w+1;
    }
    for (const w of ws){
      const sp=document.createElement('div'); sp.className='spine';
      const id=k+'-'+n; sp.dataset.id=id;
      sp.style.width=w+'px'; sp.style.height=Math.round(80+r()*17)+'%';
      let bg=PALETTE[Math.floor(r()*PALETTE.length)];
      if (k===0 && real<BOOKS.length){   // 맨 앞 칸: 실제 책을 순서대로
        sp.dataset.b=real; sp.classList.add('real'); bg=bookColor(BOOKS[real])||bg; real++;
      }
      sp.style.background=bg;
      sp.style.setProperty('--band', Math.round(8+r()*18)+'%');
      if (goneSet.has(id)) sp.classList.add('gone');
      row.appendChild(sp); n++;
    }
    seg.appendChild(row);
  }
  shelf.appendChild(seg); segs.set(k,seg);
}
function ensureSegs(){
  const kmin=Math.max(0, Math.floor((cam-400)/SEG)), kmax=Math.ceil((cam+2000-SH_START)/SEG)-1;
  for (const [k,el] of segs) if (k<kmin||k>kmax){ el.remove(); segs.delete(k); }
  for (let k=kmin;k<=kmax;k++) if (!segs.has(k)) makeSeg(k);
}
const floorEl=document.getElementById('floorP');
function applyCam(){
  shelf.style.transform=`translateX(${-cam}px) translateZ(${DEPTH}px)`;
  floorEl.style.backgroundPosition=`0 0, 0 0, 0 ${-cam}px, 0 0`;
  ensureSegs();
}
function spineZ(sp){
  const k=+sp.parentNode.parentNode.dataset.k;
  return ZN - (SH_START + k*SEG + 8 + sp.offsetLeft + sp.offsetWidth/2 - cam);
}

/* 시작: 오른쪽에서 네 발로 기어 나오기 */
async function intro(){
  setPose('crawl'); face('left'); place(760,-180);
  await wait(500);
  await moveTo(FX, -180, 170);
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
const REST_AFTER=10000;        // 커서가 이만큼(ms) 안 움직이면 앉아서 쉼
let pointerMovedAt=0;          // 마지막으로 커서가 움직인 시각
let reachKind='reach', reachSwapAt=0;  // 책장 앞에 멈춰 있는 동안 서서/앉아서 뒤적이기를 번갈아 고름
function pickReach(t){ reachKind=Math.random()<.35?'reachSit':'reach'; reachSwapAt=t+rand(3500,7000); }
function startFollow(){ following=true; run++; stopMove(); pointerMovedAt=performance.now(); }  // 꿈에서 깬 직후 바로 쉬지 않도록 시계를 새로 시작
function screenToTarget(cx,cy){
  const K=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k'))||1;
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
  const dt=Math.min(.05,(t-lastT)/1000||0); lastT=t;
  if (mover){
    const r=advance(mover.tx,mover.tz,mover.speed,dt);
    if (r.left<0.6){ place(mover.tx,mover.tz); const res=mover.res; mover=null; vel=0; res(); }
    return;
  }
  if (mode!=='idle' || !following) return;
  const g=screenToTarget(px,py);
  let tx=g.x==null?x:Math.min(Math.max(g.x,FX),470), tz=g.z, scroll=0;
  if (tz<ZDEEP){ scroll=Math.min(1,(ZDEEP-tz)/450); tz=ZDEEP; }
  else if (tz>ZFRONT){ if (cam>0 && tz>ZFRONT+120) scroll=-Math.min(1,(tz-ZFRONT-120)/250); tz=ZFRONT; }
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
async function fetchAndEat(chosen){
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
  const color=spine.style.background;
  spine.classList.add('picked');

  if (Math.abs(x-FX)>30){ setPose('walk'); await moveTo(FX, Math.min(z,ZFRONT), 130); }
  const need=ZDEEP+40-spineZ(spine);
  if (need>0){ setPose('walk'); await moveTo(FX, ZDEEP, 140); face('right'); await rollCam(need); }
  const bz=Math.min(ZFRONT, Math.max(ZDEEP, spineZ(spine)+40));
  setPose('walk'); await moveTo(FX, bz, 140);
  face('left'); setPose('reach'); await wait(950);
  let r=spine.getBoundingClientRect();
  const fly=document.createElement('div'); fly.className='flybook';
  Object.assign(fly.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',background:color});
  document.body.appendChild(fly); spine.classList.add('gone'); goneSet.add(spine.dataset.id);
  const fr=fox.getBoundingClientRect();
  const tx=fr.left+fr.width*0.38-r.left, ty=fr.top+fr.height*0.5-r.top;
  await fly.animate([{transform:'none'},{transform:`translate(${tx}px,${ty-60}px) rotate(40deg)`, offset:.55},{transform:`translate(${tx}px,${ty}px) rotate(90deg) scale(.6)`}],
    {duration:750/SPD,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}).finished;
  fly.remove();

  held.style.setProperty('--cover', color); held.className='closed';
  setPose('walk');
  await moveTo(FX, Math.max(z, -200), 150);
  await moveTo(SEAT.x, SEAT.z, 110);

  face('left'); setPose('sit'); await wait(550);
  if (imgOK){ held.className=''; await wait(2600); }
  else {
    held.className='open'; spread.style.clipPath='none'; await wait(500);
    for (let i=0;i<3;i++){ await flipPage(); await wait(260); }
    await wait(450);
  }

  setPose('eat');
  for (let b=1;b<=6;b++){ if (!imgOK) bite(b); crumbs(); await wait(imgOK?650:540); }
  held.className=''; setPose('sit'); await wait(650);

  setPose('sleep'); startZz(); await wait(2400);
  await enterDream(book);
}
function rollCam(dist){
  return new Promise(res=>{
    const start=cam, t0=performance.now(), dur=Math.max(400, dist/300*1000)/SPD;
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
function crumbs(){
  const r=mouthRect(); const floorY=fox.getBoundingClientRect().bottom;
  for (let i=0;i<5;i++){
    const c=document.createElement('div'); c.className='crumb';
    const s=rand(3,7); Object.assign(c.style,{width:s+'px',height:s*rand(.6,1.4)+'px',left:(r.left+rand(0,r.width))+'px',top:(r.top+rand(0,r.height*.3))+'px'});
    document.body.appendChild(c);
    c.animate([{transform:'none',opacity:1},{transform:`translate(${rand(-40,40)}px,${floorY-r.top}px) rotate(${rand(-200,200)}deg)`,opacity:.2}],
      {duration:rand(800,1300)/SPD,easing:'cubic-bezier(.4,0,.9,.6)'}).finished.then(()=>c.remove());
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
  mode='dream'; eaten++;
  const my=++dreamSeq;
  const hp=headPoint(); const cx=hp.x, cy=hp.y;
  renderDream(book);
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
  const els=[...dreamInner.querySelectorAll('.rv')];
  for (const el of els){
    el.classList.add('in'); await wait(el.classList.contains('q') ? 900 : 380);
    if (my!==dreamSeq || mode!=='dream') return;
  }
  dreamInner.querySelector('#wake').focus({preventScroll:true});
}
function esc(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function renderDream(b){
  dreamInner.innerHTML = `
    <p class="kicker rv">여우가 ${eaten}번째로 먹은 책 · 예시 데이터</p>
    <h1 class="dtitle rv">${esc(b.title)}</h1>
    <p class="dauthor rv">${esc(b.author)}</p>
    ${b.quotes.map(q=>`<blockquote class="q rv"><p>${esc(q.t)}</p><span>${esc(q.p)}</span></blockquote>`).join('')}
    <div class="fnote rv"><small>여우의 한 줄</small><p>${esc(b.note)}</p></div>
    <div class="tags rv">${b.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div>
    <div class="actions rv">
      ${b.blog?`<a href="${esc(b.blog)}" target="_blank" rel="noopener">블로그 서평 읽기</a>`:''}
      <button id="wake" type="button">꿈에서 깨기</button>
    </div>`;
  dreamInner.querySelector('#wake').addEventListener('click', wake);
}

/* 꿈에서 깨기 */
async function wake(){
  if (mode!=='dream') return;
  mode='waking'; stopZz();
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
  mode='idle'; showHint(); resumeIdle();
}

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
  const sp=pickSpine(e);
  if (mode==='idle') fetchAndEat(sp);
  else if (mode==='intro'){ pending=sp||true; }
}
shelf.addEventListener('click', onShelf);
shelf.addEventListener('keydown', e=>{ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); onShelf(); } });
addEventListener('keydown', e=>{ if (e.key==='Escape' && mode==='dream') wake(); });
addEventListener('pointermove', e=>{ px=e.clientX; py=e.clientY; pointerIn=true; pointerMovedAt=performance.now(); if (mode==='idle' && !following) startFollow(); });
addEventListener('pointerdown', e=>{ px=e.clientX; py=e.clientY; pointerIn=true; pointerMovedAt=performance.now(); if (mode==='idle' && !following) startFollow(); });
document.documentElement.addEventListener('pointerleave', ()=>{ pointerIn=false; if (following){ following=false; if (mode==='idle') idle(); } });

addEventListener('resize', fitRoom);

/* 시작 */
function start(){ fitRoom(); Promise.all([loadBooks(), preloadFox()]).then(()=>{ applyCam(); intro(); }); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
