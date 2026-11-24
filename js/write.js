/* 책 기록하기: 책 이름 · 작가 · 구절(페이지) · 짧은 메모 · 책 색을 직접 써서 저장
   - 오른쪽 연필 버튼(#writeBook) = 새 책, 꿈 페이지 '고쳐 쓰기' = 그 책 고치기/지우기
   - 저장: 이 브라우저 localStorage 'peakaboo-books'(책 목록 전체) + 'peakaboo-memo'(메모). 보기 전용 /view 에도 자동으로 올라감(schedulePublish)
   - 처음 저장할 때 지금 책 목록(data/books.json)을 그대로 옮겨 오고, 그 뒤로는 이 목록이 기준. 새 책은 책장 맨 앞에 꽂힘
   - 책 이름을 바꾸면 먹은 책 더미·기록·메모·꽃다발의 이름표(slug)도 같이 바꿈 */
const bookFormEl=document.getElementById('bookForm');
const bf=bookFormEl.querySelector('form'), bfQ=bookFormEl.querySelector('.bf-q-list'), bfSw=bookFormEl.querySelector('.bf-swatches');
const BOOK_COLORS=['#8FA2B3','#7D8FA0','#A4AE92','#7F9894','#C9A46A','#B39573','#C79A8E','#B48478','#9C7C5E','#A092A9','#9C5062','#738361'];
let editIdx=-1, lastFocus=null;

function quoteRow(q={t:'',p:''}){
  const row=document.createElement('div'); row.className='bf-q';
  row.innerHTML=`<textarea rows="2" maxlength="3000" placeholder="마음에 남은 문장" aria-label="구절"></textarea>
    <input type="text" maxlength="30" inputmode="numeric" placeholder="페이지" aria-label="페이지 (선택)">
    <button type="button" class="bf-qdel" aria-label="이 구절 빼기">×</button>`;
  row.querySelector('textarea').value=q.t||''; row.querySelector('input').value=String(q.p||'').replace(/^p\.\s*/,'');
  row.querySelector('.bf-qdel').addEventListener('click', ()=>{ if (bfQ.children.length>1) row.remove(); else { row.querySelector('textarea').value=''; row.querySelector('input').value=''; } });
  return row;
}
function pickColor(c){ for (const b of bfSw.children) b.setAttribute('aria-pressed', String(b.dataset.c===c)); bf.dataset.color=c; }
BOOK_COLORS.forEach(c=>{ const b=document.createElement('button'); b.type='button'; b.className='bf-sw'; b.dataset.c=c; b.style.background=c; b.setAttribute('aria-label','책 색 '+c); b.addEventListener('click',()=>pickColor(c)); bfSw.appendChild(b); });

function openBookForm(idx=-1){
  if (VIEW) return;
  editIdx=idx; lastFocus=document.activeElement;
  const b=idx>=0?BOOKS[idx]:null, memos=readMemos();
  bookFormEl.querySelector('#bfTitle').textContent = b ? '책 고쳐 쓰기' : '책 기록하기';
  bf.title.value=b?b.title:''; bf.author.value=b&&b.author&&b.author!=='예시 저자'?b.author:'';
  bf.memo.value=b ? (memos[bookSlug(b)]!=null?memos[bookSlug(b)]:(b.note||'')) : '';
  bfQ.innerHTML=''; const qs=(b&&b.quotes&&b.quotes.length)?b.quotes:[{t:'',p:''}]; qs.forEach(q=>bfQ.appendChild(quoteRow(q)));
  pickColor(b ? (bookColor(b)||PALETTE[(idx*5)%PALETTE.length]) : BOOK_COLORS[Math.floor(Math.random()*BOOK_COLORS.length)]);
  bookFormEl.querySelector('.bf-feed').hidden=!!b;              // 새 책일 때만 '책장에만 꽂기'와 나눠 둠
  bookFormEl.querySelector('.bf-save').textContent = b ? '저장' : '저장하고 여우에게 건네기';
  bookFormEl.querySelector('.bf-del').hidden=!b; bookFormEl.querySelector('.bf-del').textContent='이 책 지우기'; delete bookFormEl.querySelector('.bf-del').dataset.armed;
  bookFormEl.querySelector('.bf-msg').textContent='';
  bookFormEl.hidden=false; document.body.classList.add('form-open');
  setTimeout(()=>bf.title.focus(), 30);
}
function closeBookForm(){ bookFormEl.hidden=true; document.body.classList.remove('form-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

/* 책 이름표(slug)가 바뀌거나 책이 지워질 때 더미·기록·메모·꽃다발을 맞춤 */
function migrateSlug(from, to){
  const rd=(k,d)=>{ try { return JSON.parse(localStorage.getItem(k)||d); } catch(e){ return JSON.parse(d); } };
  const wr=(k,v)=>{ try { localStorage.setItem(k,JSON.stringify(v)); } catch(e){} };
  const sw=s=>s===from?to:s;
  wr(PILE_KEY, [...new Set(rd(PILE_KEY,'[]').map(sw).filter(Boolean))]);
  wr(ARCHIVE_KEY, rd(ARCHIVE_KEY,'[]').map(r=>({...r,s:sw(r.s)})).filter(r=>r.s));
  wr(BOUQUET_KEY, rd(BOUQUET_KEY,'[]').map(q=>({...q,b:(q.b||[]).map(sw).filter(Boolean)})));
  const m=rd(MEMO_KEY,'{}'); if (from in m){ if (to) m[to]=m[from]; delete m[from]; } wr(MEMO_KEY,m);
}
/* 바뀐 책 목록을 저장하고 화면(책장 맨 앞 칸·더미·꽃밭)을 다시 그림 */
function commitBooks(list, renamed){
  try { localStorage.setItem(MYBOOKS_KEY, JSON.stringify(list)); } catch(e){ return false; }
  // 지금 꿈꾸는 책(깰 때 더미로 갈 책)은 번호가 아니라 이름표로 다시 찾음 (지우면 null)
  let dreamSlug = lastDreamBook!=null && BOOKS[lastDreamBook] ? bookSlug(BOOKS[lastDreamBook]) : null;
  if (renamed && dreamSlug===renamed[0]) dreamSlug=renamed[1];
  BOOKS=list; eatenBooks.clear();
  if (lastDreamBook!=null){ const j=dreamSlug?BOOKS.findIndex(b=>bookSlug(b)===dreamSlug):-1; lastDreamBook=j>=0?j:null; }
  for (const id of [...goneSet]) if (id.startsWith('0-')) goneSet.delete(id);
  const s0=segs.get(0); if (s0){ s0.remove(); segs.delete(0); }
  loadPile(); renderPile(); renderGarden(); ensureSegs(); placePile();
  schedulePublish();
  return true;
}
function currentList(){   // 처음이면 지금 목록(예시 포함)을 색까지 고정해서 옮겨 옴
  return readMyBooks() || BOOKS.filter(b=>b!==NO_BOOKS[0]).map((b,i)=>({title:b.title, author:b.author||'', quotes:(b.quotes||[]).map(q=>({t:q.t,p:q.p||''})), color:bookColor(b)||PALETTE[(i*5)%PALETTE.length], ...(b.note?{note:b.note}:{}), ...(b.blog?{blog:b.blog}:{})}));
}
async function saveBook(feed){
  const title=bf.title.value.trim();
  const msg=bookFormEl.querySelector('.bf-msg');
  if (!title){ msg.textContent='책 이름을 적어 주세요'; bf.title.focus(); return; }
  const quotes=[...bfQ.children].map(r=>({t:r.querySelector('textarea').value.trim(), p:r.querySelector('input').value.trim()})).filter(q=>q.t);
  const list=currentList(), slug=bookSlug({title});
  const oldIdx = editIdx>=0 ? list.findIndex(b=>bookSlug(b)===bookSlug(BOOKS[editIdx])) : -1;
  if (list.some((b,i)=>i!==oldIdx && bookSlug(b)===slug)){ msg.textContent='같은 이름의 책이 이미 있어요. 이름을 조금 바꿔 주세요'; bf.title.focus(); return; }
  const book={...(oldIdx>=0?list[oldIdx]:{}), title, author:bf.author.value.trim(), quotes, color:bf.dataset.color};
  let renamed=null;
  if (oldIdx>=0){ const from=bookSlug(list[oldIdx]); list[oldIdx]=book; if (from!==slug){ migrateSlug(from, slug); renamed=[from,slug]; } }
  else list.unshift(book);                                   // 새 책은 책장 맨 앞
  const m=readMemos(); const memo=bf.memo.value.trim(); if (memo) m[slug]=memo; else delete m[slug];
  try { localStorage.setItem(MEMO_KEY, JSON.stringify(m)); } catch(e){}
  if (!commitBooks(list, renamed)){ msg.textContent='저장하지 못했어요 (브라우저 저장 공간을 확인해 주세요)'; return; }
  closeBookForm();
  const idx=BOOKS.findIndex(b=>bookSlug(b)===slug);
  if (mode==='dream'){ renderDream(BOOKS[idx]); revealOnScroll(dreamSeq); flash('고친 내용을 저장했어요'); return; }
  if (!feed){ flash(`「${title}」을 책장 맨 앞에 꽂았어요`); return; }
  if (mode!=='idle'){ flash(`「${title}」을 책장 맨 앞에 꽂았어요`); return; }
  if (cam>0) await rollCam(-cam);
  const sp=shelf.querySelector(`.spine.real[data-b="${idx}"]:not(.gone)`);
  if (sp) fetchAndEat(sp); else flash(`「${title}」을 책장 맨 앞에 꽂았어요`);
}
function deleteBook(){
  const del=bookFormEl.querySelector('.bf-del');
  if (del.dataset.armed!=='1'){ del.dataset.armed='1'; del.textContent='정말 지울까요? 한 번 더 누르면 지워져요'; return; }
  const list=currentList(), slug=bookSlug(BOOKS[editIdx]);
  const next=list.filter(b=>bookSlug(b)!==slug);
  migrateSlug(slug, null);
  commitBooks(next.length?next:[]);
  if (!next.length){ try { localStorage.setItem(MYBOOKS_KEY,'[]'); } catch(e){} BOOKS=NO_BOOKS; }
  closeBookForm();
  if (mode==='dream') wake();
  flash('책을 지웠어요');
}
bf.addEventListener('submit', e=>{ e.preventDefault(); saveBook(true); });
bookFormEl.querySelector('.bf-feed').addEventListener('click', ()=>saveBook(false));
bookFormEl.querySelector('.bf-cancel').addEventListener('click', closeBookForm);
bookFormEl.querySelector('.bf-addq').addEventListener('click', ()=>{ const r=quoteRow(); bfQ.appendChild(r); r.querySelector('textarea').focus(); });
bookFormEl.querySelector('.bf-del').addEventListener('click', deleteBook);
bookFormEl.addEventListener('keydown', e=>{
  if (e.key==='Escape'){ e.stopPropagation(); closeBookForm(); }
  if (e.key==='Tab'){   // 창 안에서만 돌기
    const f=[...bookFormEl.querySelectorAll('input,textarea,button')].filter(x=>!x.hidden && x.offsetParent!==null);
    if (e.shiftKey && document.activeElement===f[0]){ e.preventDefault(); f[f.length-1].focus(); }
    else if (!e.shiftKey && document.activeElement===f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  }
});
bookFormEl.addEventListener('pointerdown', e=>{ if (e.target===bookFormEl) closeBookForm(); });
document.getElementById('writeBook').addEventListener('click', ()=>{
  if (mode!=='idle' && mode!=='seated'){ flash('여우가 하던 일을 마치면 다시 눌러 주세요'); return; }
  openBookForm(-1);
});
