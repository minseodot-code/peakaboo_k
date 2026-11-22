/* 먹은 책 모음 페이지 (archive.html)
   여우가 먹은 책 기록(localStorage 'peakaboo-archive')과 받은 꽃다발('peakaboo-bouquets')을 보여줌.
   책을 누르면 index.html#book-제목 으로 가서 그 책의 꿈을 바로 펼침. 꽃 모양·색은 main.js 와 같은 계산 */
const ARCHIVE_KEY='peakaboo-archive', BOUQUET_KEY='peakaboo-bouquets', PILE_KEY='peakaboo-pile';
const FLOWERS=['f1','f2','f3','f4','f5','f6','f7','f8','f9'], FLOWER_AR={f1:.493,f2:.31,f3:.403,f4:.303,f5:.923,f6:.573,f7:.863,f8:.43,f9:.947};
const PALETTE=['#8FA2B3','#7D8FA0','#A9B6C0','#C9A46A','#D6BF95','#E2D3B4','#C79A8E','#B48478','#A4AE92','#8E9C85','#9C7C5E','#B39573','#7F9894','#A7A196'];
const $=s=>document.querySelector(s);
function hash(str){ let h=2166136261; for (const ch of str){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function bookSlug(b){ return String(b.title||'').normalize('NFC').trim().replace(/\s+/g,'-'); }
function bookColor(b){ return b && typeof b.color==='string' && CSS.supports('color', b.color) ? b.color : null; }
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function readList(k){ try { const v=JSON.parse(localStorage.getItem(k)||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
const dateFmt=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric'});
function flowerHTML(slug, color, h){
  const f=FLOWERS[hash(slug+'#flower')%FLOWERS.length], w=Math.round(h*FLOWER_AR[f]);
  return `<span class="fl" style="width:${w}px;height:${h}px;background-image:url(assets/flowers/${f}.webp);--c:${color}"><i style="-webkit-mask-image:url(assets/flowers/${f}m.webp);mask-image:url(assets/flowers/${f}m.webp)"></i></span>`;
}
async function main(){
  let BOOKS=[];
  try { BOOKS=await (await fetch('data/books.json')).json(); } catch(e){}
  const bySlug=new Map(BOOKS.map((b,i)=>[bookSlug(b),{b,i}]));
  const color=sl=>{ const r=bySlug.get(sl); return r ? (bookColor(r.b)||PALETTE[(r.i*5)%PALETTE.length]) : '#B39573'; };
  // 예전 방문에서 쌓인 더미도 기록에 포함
  const arch=readList(ARCHIVE_KEY), seen=new Set(arch.map(r=>r.s));
  for (const s of readList(PILE_KEY)) if (!seen.has(s)){ arch.push({s,t:0}); seen.add(s); }
  const rows=arch.filter(r=>bySlug.has(r.s)).sort((a,b)=>b.t-a.t);
  $('#sum').textContent = rows.length
    ? `여우가 먹고 꿈꾼 책 ${rows.length}권. 책을 누르면 그 꿈을 다시 펼쳐요.`
    : '아직 여우가 먹은 책이 없어요. 언덕으로 돌아가 책장을 눌러 보세요.';
  $('#books').innerHTML=rows.map(r=>{
    const {b}=bySlug.get(r.s), q=(b.quotes&&b.quotes[0])||{t:'',p:''}, c=color(r.s);
    return `<a class="card" href="index.html#book-${encodeURIComponent(r.s)}" style="--c:${c}">
      <span class="flw">${flowerHTML(r.s,c,92)}</span>
      <span class="txt">
        <strong>${esc(b.title)}</strong>
        <em>${esc(b.author||'')}</em>
        <q>${esc(q.t)}</q>
        <small>${r.t?dateFmt.format(r.t)+'에 먹음 · ':''}구절 ${(b.quotes||[]).length}개</small>
      </span></a>`;
  }).join('');
  const bqs=readList(BOUQUET_KEY).slice().reverse();
  if (bqs.length){
    $('#bqSec').hidden=false;
    $('#bouquets').innerHTML=bqs.map(q=>{
      const sl=(q.b||[]).filter(s=>bySlug.has(s));
      return `<li><span class="bunch" aria-hidden="true">${sl.map((s,k)=>`<span style="transform:rotate(${((k-(sl.length-1)/2)*12).toFixed(0)}deg)">${flowerHTML(s,color(s),58)}</span>`).join('')}</span>
        <span><b>${dateFmt.format(q.t)} · ${sl.length}송이</b><br><small>${sl.map(s=>esc(bySlug.get(s).b.title)).join(' · ')}</small></span></li>`;
    }).join('');
  }
  $('#clear').hidden=!(rows.length||bqs.length);
}
$('#clearAsk').addEventListener('click',()=>{ $('#clearAsk').hidden=true; $('#clearConfirm').hidden=false; $('#clearNo').focus(); });
$('#clearNo').addEventListener('click',()=>{ $('#clearConfirm').hidden=true; $('#clearAsk').hidden=false; $('#clearAsk').focus(); });
$('#clearYes').addEventListener('click',()=>{
  try { [ARCHIVE_KEY,BOUQUET_KEY,PILE_KEY].forEach(k=>localStorage.removeItem(k)); } catch(e){}
  $('#clearConfirm').hidden=true; $('#clearAsk').hidden=false; main();
});
main();
