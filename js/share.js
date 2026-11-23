/* 보기 전용: 다른 사람이 내 꽃밭을 보기만 하는 화면. 아무것도 저장하지 않고, 책을 먹거나 꽃을 자를 수 없음
   - 고정 주소 /view (모음 페이지는 /archive?view): 서버(/api/garden)에 올려 둔 최신 꽃밭을 읽음
     주인 화면에서 링크 버튼을 처음 누르면 그 브라우저가 주인으로 등록되고, 그 뒤로 책을 먹거나 메모를 쓸 때마다 자동으로 올라감
   - 예전 링크 ?view=<압축한 내용> 도 계속 열림 (그 링크를 만든 순간의 모습) */
const VIEW_RAW=new URLSearchParams(location.search).get('view');
const VIEW_SERVER=/^\/view(\/|$)/.test(location.pathname) || VIEW_RAW==='';
const VIEW=VIEW_SERVER || VIEW_RAW!=null;
function b64u(bytes){ let s=''; for (const b of bytes) s+=String.fromCharCode(b); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64u(str){ const s=atob(str.replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(s,c=>c.charCodeAt(0)); }
async function packView(obj){
  const raw=new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream==='undefined') return 'j'+b64u(raw);
  const buf=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  return 'z'+b64u(new Uint8Array(buf));
}
async function unpackView(str){
  try {
    const kind=str[0], bytes=unb64u(str.slice(1));
    let raw=bytes;
    if (kind==='z') raw=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    const o=JSON.parse(new TextDecoder().decode(raw));
    return { p:Array.isArray(o.p)?o.p:[], a:Array.isArray(o.a)?o.a:[], m:(o.m&&typeof o.m==='object')?o.m:{}, b:Array.isArray(o.b)?o.b:[] };
  } catch(e){ return {p:[],a:[],m:{},b:[]}; }
}
let viewLoadFailed=false;   // /view 에서 꽃밭을 못 불러왔을 때 (저장소 미연결·네트워크) 안내용
async function fetchGarden(){
  try { const r=await fetch('/api/garden',{cache:'no-store'}); if (!r.ok) throw 0; const o=await r.json();
    return { p:Array.isArray(o.p)?o.p:[], a:Array.isArray(o.a)?o.a:[], m:(o.m&&typeof o.m==='object')?o.m:{}, b:Array.isArray(o.b)?o.b:[] };
  } catch(e){ viewLoadFailed=true; return {p:[],a:[],m:{},b:[]}; }
}
const viewReady = !VIEW ? Promise.resolve(null) : VIEW_SERVER ? fetchGarden() : unpackView(VIEW_RAW);
/* 지금 이 브라우저의 꽃밭 (주인 화면에서 서버로 올릴 내용) */
function gardenSnapshot(){
  const get=(k,d)=>{ try { return JSON.parse(localStorage.getItem(k)||d); } catch(e){ return JSON.parse(d); } };
  const p=get('peakaboo-pile','[]'), arch=get('peakaboo-archive','[]'), memos=get('peakaboo-memo','{}'), bq=get('peakaboo-bouquets','[]');
  const keep=new Set([...p,...arch.map(r=>r.s)]), m={};
  for (const k in memos) if (keep.has(k) && String(memos[k]).trim()) m[k]=memos[k];
  return {p, a:arch.map(r=>[r.s,r.t]), m, b:bq.map(q=>({t:q.t,b:q.b}))};
}
/* 이 브라우저의 '꽃밭 주인 표'. 링크 버튼을 처음 누른 브라우저가 주인으로 등록되고(서버), 그 뒤로 이 브라우저의 변화만 /view 에 올라감 */
const OWNER_STORE='peakaboo-owner', OWNED_STORE='peakaboo-owned';
function ownerToken(){
  try { let t=localStorage.getItem(OWNER_STORE);
    if (!t){ t=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))+Math.random().toString(36).slice(2); localStorage.setItem(OWNER_STORE,t); }
    return t; } catch(e){ return null; }
}
function isOwner(){ try { return localStorage.getItem(OWNED_STORE)==='1'; } catch(e){ return false; } }
/* 서버에 올리기. 결과: 'ok' | 'not-owner' | 'wrong-key' | 'not-set-up' | 'fail'.  key = 비상용 GARDEN_KEY (브라우저를 바꿨을 때만) */
async function publishGarden(key){
  const tok=ownerToken(); if (!tok) return 'fail';
  try {
    const h={'Content-Type':'application/json','x-garden-owner':tok}; if (key) h['x-garden-key']=key;
    const r=await fetch('/api/garden',{method:'POST',headers:h,body:JSON.stringify(gardenSnapshot())});
    if (r.ok){ try { localStorage.setItem(OWNED_STORE,'1'); } catch(e){} return 'ok'; }
    if (r.status===403){ try { localStorage.removeItem(OWNED_STORE); } catch(e){} return key?'wrong-key':'not-owner'; }
    if (r.status===503) return 'not-set-up';
    return 'fail';
  } catch(e){ return 'fail'; }
}
let pubTimer=0;
function schedulePublish(){      // 꽃밭이 바뀔 때마다 (주인으로 등록된 브라우저에서만) 조금 기다렸다 올림
  if (VIEW || !isOwner()) return;
  clearTimeout(pubTimer); pubTimer=setTimeout(()=>publishGarden(), 1500);
}
const VIEW_URL=location.origin+'/view';
function viewQuery(){ return !VIEW ? '' : VIEW_SERVER ? '?view' : '?view='+encodeURIComponent(VIEW_RAW); }
function viewHome(){ return !VIEW ? './' : VIEW_SERVER ? '/view' : './'+viewQuery(); }
