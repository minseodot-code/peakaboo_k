/* 보기 전용 링크: 내 꽃밭(먹은 책·기록·메모)을 주소 안에 압축해 담음. 서버 없이 링크만으로 다른 사람이 볼 수 있음.
   주소: index.html?view=<압축한 내용>  (archive.html 도 같은 ?view= 를 씀)
   보기 전용에서는 아무것도 저장하지 않고, 책을 먹거나 꽃을 자를 수 없음. 링크는 만든 순간의 모습(스냅숏) */
const VIEW_RAW=new URLSearchParams(location.search).get('view');
const VIEW=VIEW_RAW!=null;
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
const viewReady = VIEW ? unpackView(VIEW_RAW) : Promise.resolve(null);
/* 지금 이 브라우저의 기록으로 보기 전용 링크 만들기 (주인 화면의 공유 버튼) */
async function makeViewLink(){
  const get=(k,d)=>{ try { return JSON.parse(localStorage.getItem(k)||d); } catch(e){ return JSON.parse(d); } };
  const p=get('peakaboo-pile','[]'), arch=get('peakaboo-archive','[]'), memos=get('peakaboo-memo','{}'), bq=get('peakaboo-bouquets','[]');
  const a=arch.map(r=>[r.s,r.t]);
  const keep=new Set([...p,...arch.map(r=>r.s)]), m={};
  for (const k in memos) if (keep.has(k) && String(memos[k]).trim()) m[k]=memos[k];
  const page=location.pathname.replace(/[^/]*$/,'');   // 사이트 첫 화면 주소 (index.html 은 붙이지 않음: 서버가 넘기며 ?view= 를 버릴 수 있음)
  return location.origin+page+'?view='+await packView({p,a,m,b:bq.map(q=>({t:q.t,b:q.b}))});
}
function viewQuery(){ return VIEW ? '?view='+encodeURIComponent(VIEW_RAW) : ''; }
