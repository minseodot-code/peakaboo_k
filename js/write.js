/* 책 기록하기: 여우가 책을 먹고 잠들면 펼쳐지는 꿈 페이지가 곧 기록장
   - 아직 기록하지 않은 책(책장의 아무 책)을 먹으면 newDraft() → 꿈 페이지에 빈칸(책 이름·작가·구절·페이지·메모) → '기록하기'
   - 기록한 책(꽃·더미·책장 맨 앞 칸)을 다시 꿈꾸면 읽기 화면, '고쳐 쓰기'로 같은 자리에서 고침(editingBook)
   - 저장: 이 브라우저 localStorage 'peakaboo-books'(책 목록) + 'peakaboo-memo'(메모) → 보기 전용 /view 에도 자동으로 올라감(schedulePublish)
   - 기록하면 책장 맨 앞 칸에 그 색의 책으로 꽂히고, 깨면 더미·꽃밭에 들어가며 먹은 책 모음(archive)에 쌓임
   - 같은 책을 여러 번 기록할 수 있음: 기록마다 메모·꽃이 따로(이름표 '책-이름~2'…, uniqueSlug)
   - 책 이름을 바꾸거나 지우면 더미·기록·메모·꽃다발 이름표(slug)도 맞춤 */
let editingBook=null;
function ordinal(n){ return (['첫','두','세','네','다섯','여섯','일곱','여덟','아홉','열'][n-1]||n)+' 번째'; }
/* 이름표가 겹치면 '~2', '~3'…을 붙임 */
function uniqueSlug(base, list){ const used=new Set(list.map(bookSlug)); if (!used.has(base)) return base; let n=2; while (used.has(base+'~'+n)) n++; return base+'~'+n; }
function newDraft(color){ return {draft:true, title:'', author:'', quotes:[], color: /^#[0-9a-f]{6}$/i.test(color||'')?color:'#B39573'}; }

/* 책 이름표(slug)가 바뀌거나(to) 책이 지워질 때(to=null) 더미·기록·메모·꽃다발을 맞춤 */
function migrateSlug(from, to){
  const rd=(k,d)=>{ try { return JSON.parse(localStorage.getItem(k)||d); } catch(e){ return JSON.parse(d); } };
  const wr=(k,v)=>{ try { localStorage.setItem(k,JSON.stringify(v)); } catch(e){} };
  const sw=s=>s===from?to:s;
  wr(PILE_KEY, [...new Set(rd(PILE_KEY,'[]').map(sw).filter(Boolean))]);
  wr(ARCHIVE_KEY, rd(ARCHIVE_KEY,'[]').map(r=>({...r,s:sw(r.s)})).filter(r=>r.s));
  wr(BOUQUET_KEY, rd(BOUQUET_KEY,'[]').map(q=>({...q,b:(q.b||[]).map(sw).filter(Boolean)})));
  const m=rd(MEMO_KEY,'{}'); if (from in m){ if (to) m[to]=m[from]; delete m[from]; } wr(MEMO_KEY,m);
}
/* 바뀐 책 목록을 저장하고 책장 맨 앞 칸·더미·꽃밭을 다시 그림. keep = 지금 꿈꾸는 책의 새 이름표(깰 때 더미로 갈 책) */
function commitBooks(list, keep){
  try { localStorage.setItem(MYBOOKS_KEY, JSON.stringify(list)); } catch(e){ return false; }
  BOOKS=list; eatenBooks.clear();
  if (lastDreamBook!=null || keep!==undefined){ const j=keep?BOOKS.findIndex(b=>bookSlug(b)===keep):-1; lastDreamBook=j>=0?j:null; }
  for (const id of [...goneSet]) if (id.startsWith('0-')) goneSet.delete(id);
  const s0=segs.get(0); if (s0){ s0.remove(); segs.delete(0); }
  loadPile(); renderPile(); renderGarden(); ensureSegs(); placePile();
  schedulePublish();
  return true;
}

/* ---------- 꿈 페이지 쓰기 화면 ---------- */
function quoteRow(q={t:'',p:''}){
  const row=document.createElement('div'); row.className='ed-q';
  row.innerHTML=`<textarea rows="2" maxlength="3000" placeholder="마음에 남은 문장" aria-label="구절"></textarea>
    <input type="text" maxlength="30" placeholder="페이지" aria-label="페이지 (선택)">
    <button type="button" class="ed-qdel" aria-label="이 구절 빼기">×</button>`;
  row.querySelector('textarea').value=q.t||''; row.querySelector('input').value=String(q.p||'').replace(/^p\.\s*/,'');
  row.querySelector('.ed-qdel').addEventListener('click', ()=>{ const list=row.parentNode; if (list.children.length>1) row.remove(); else { row.querySelector('textarea').value=''; row.querySelector('input').value=''; } });
  const ta=row.querySelector('textarea'), fit=()=>{ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; };
  ta.addEventListener('input', fit); requestAnimationFrame(fit);
  return row;
}
function renderEditor(b){
  if (b.draft) dreamDraft=b;
  const draft=!!b.draft, memos=readMemos(), slug=draft?'':bookSlug(b);
  const memo=draft?'':(memos[slug]!=null?memos[slug]:(b.note||''));
  dreamInner.innerHTML = `
    <p class="ed-kick rv">${draft?'방금 먹은 책을 기록해 주세요':'기록 고쳐 쓰기'}</p>
    <input class="ed-title rv" maxlength="80" placeholder="책 이름" aria-label="책 이름" autocomplete="off">
    <input class="ed-author rv" maxlength="60" placeholder="작가" aria-label="작가" autocomplete="off">
    <h2 class="dlabel rv">인상 깊은 문장 <small>페이지는 적지 않아도 돼요</small></h2>
    <div class="ed-quotes rv"></div>
    <button type="button" class="ed-addq rv">+ 구절 더하기</button>
    <div class="dmemo rv"><label class="dlabel" for="memo">메모</label>
      <textarea id="memo" rows="3" maxlength="1000" placeholder="이 책에 대해 짧게 남겨 두세요"></textarea></div>
    <p class="ed-msg" aria-live="polite"></p>
    <div class="actions rv">
      <button id="saveBook" type="button">${draft?'기록하기':'저장'}</button>
      ${draft?'':'<button id="cancelEdit" type="button" class="ghost">그만 고치기</button>'}
      <button id="wake" type="button" class="ghost">꿈에서 깨기</button>
    </div>
    ${draft?'':'<button id="delBook" type="button" class="ed-del rv">이 책 지우기</button>'}`;
  const $d=s=>dreamInner.querySelector(s);
  $d('.ed-title').value=b.title||''; $d('.ed-author').value=b.author||''; $d('#memo').value=memo;
  const qs=$d('.ed-quotes'); ((b.quotes&&b.quotes.length)?b.quotes:[{t:'',p:''}]).forEach(q=>qs.appendChild(quoteRow(q)));
  $d('.ed-addq').addEventListener('click', ()=>{ const r=quoteRow(); qs.appendChild(r); r.querySelector('textarea').focus(); });
  $d('#saveBook').addEventListener('click', ()=>saveFromDream(b));
  $d('#wake').addEventListener('click', wake);
  const ce=$d('#cancelEdit'); if (ce) ce.addEventListener('click', ()=>{ editingBook=null; renderDream(b); revealOnScroll(dreamSeq); });
  const del=$d('#delBook'); if (del) del.addEventListener('click', ()=>deleteFromDream(b, del));
  const m=$d('#memo'), fit=()=>{ m.style.height='auto'; m.style.height=Math.max(m.scrollHeight,84)+'px'; }; m.addEventListener('input',fit); requestAnimationFrame(fit);
  if (draft) setTimeout(()=>{ const t=$d('.ed-title'); if (t && mode==='dream') t.focus({preventScroll:true}); }, 3200);   // 꿈이 다 번진 뒤 책 이름 칸으로
}
function readEditor(){
  const $d=s=>dreamInner.querySelector(s);
  if (!$d('.ed-title')) return null;
  return { title:$d('.ed-title').value.trim(), author:$d('.ed-author').value.trim(), memo:$d('#memo').value.trim(),
    quotes:[...dreamInner.querySelectorAll('.ed-q')].map(r=>({t:r.querySelector('textarea').value.trim(), p:r.querySelector('input').value.trim()})).filter(q=>q.t) };
}
function saveFromDream(b){
  const f=readEditor(), msg=dreamInner.querySelector('.ed-msg');
  if (!f) return false;
  if (!f.title){ msg.textContent='책 이름을 적어 주세요'; dreamInner.querySelector('.ed-title').focus(); return false; }
  const list=(readMyBooks()||[]).slice(), oldIdx=b.draft?-1:list.findIndex(x=>bookSlug(x)===bookSlug(b)), old=oldIdx>=0?list[oldIdx]:null;
  // 같은 이름의 책이 이미 있어도 따로 기록함: 이름이 그대로면 원래 이름표, 새 기록이거나 이름을 바꿨으면 겹치지 않는 이름표
  const others=list.filter((_,i)=>i!==oldIdx);
  const slug=(old && titleSlug(old)===titleSlug(f)) ? bookSlug(old) : uniqueSlug(titleSlug(f), others);
  const same=others.filter(x=>titleSlug(x)===titleSlug(f)).length;   // 같은 이름으로 먼저 남긴 기록 수
  const book={...(old||{}), id:slug, title:f.title, author:f.author, quotes:f.quotes, color:b.color||'#B39573', t:(old&&old.t)||Date.now()};
  delete book.draft;
  if (oldIdx>=0){ const from=bookSlug(list[oldIdx]); list[oldIdx]=book; if (from!==slug) migrateSlug(from, slug); }
  else list.unshift(book);                                   // 새 기록은 책장 맨 앞 칸에
  const m=readMemos(); if (f.memo) m[slug]=f.memo; else delete m[slug];
  try { localStorage.setItem(MEMO_KEY, JSON.stringify(m)); } catch(e){}
  if (!commitBooks(list, slug)){ msg.textContent='저장하지 못했어요 (브라우저 저장 공간을 확인해 주세요)'; return false; }
  editingBook=null;
  const saved=BOOKS.find(x=>bookSlug(x)===slug);
  renderDream(saved); setDreamHash(saved); revealOnScroll(dreamSeq);
  flash(b.draft ? (same ? `같은 책의 ${ordinal(same+1)} 기록으로 남겼어요 · 깨어나면 꽃이 하나 더 피어요` : '기록했어요 · 깨어나면 먹은 책 더미와 꽃밭에 들어가요') : '고친 내용을 저장했어요');
  return true;
}
function deleteFromDream(b, btn){
  if (btn.dataset.armed!=='1'){ btn.dataset.armed='1'; btn.textContent='정말 지울까요? 한 번 더 누르면 지워져요'; return; }
  const slug=bookSlug(b), list=(readMyBooks()||[]).filter(x=>bookSlug(x)!==slug);
  migrateSlug(slug, null); commitBooks(list, null); editingBook=null;
  flash('기록을 지웠어요'); wakeNow=true; wake();
}
/* 깨기 전: 쓰다 만 기록이 있으면 — 책 이름이 있으면 저장하고 깸, 이름 없이 뭔가 썼으면 한 번 물어봄 */
let wakeNow=false, wakeWarned=false;
function beforeWake(){
  if (wakeNow){ wakeNow=false; wakeWarned=false; return true; }
  const f=readEditor(); if (!f){ wakeWarned=false; return true; }
  if (f.title){ const ok=saveFromDream(editingBook || draftInDream()); wakeWarned=false; editingBook=null; return ok; }
  const typed=f.author||f.memo||f.quotes.length;
  if (typed && !wakeWarned){ wakeWarned=true; const msg=dreamInner.querySelector('.ed-msg'); if (msg) msg.textContent='책 이름을 적어야 기록돼요 · 그냥 깨려면 한 번 더 눌러요'; return false; }
  wakeWarned=false; editingBook=null; return true;
}
let dreamDraft=null;
function draftInDream(){ return dreamDraft || {draft:true, color:'#B39573'}; }
function currentDraftColor(){ return dreamDraft?dreamDraft.color:'#B39573'; }
