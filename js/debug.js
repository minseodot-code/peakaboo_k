/* =========================================================
   여우 포즈 조정 패널 — URL 끝에 #debug 를 붙였을 때만 main.js가 불러와요.
   포즈를 고르고 높이(h)·위치 보정(dx, dy)·그림자 폭(sh)을 슬라이더로 맞춘 뒤
   "값 복사"를 누르면 main.js의 POSES에 그대로 붙여넣을 줄이 복사돼요.
   여기서 바꾼 값은 새로고침하면 사라져요 (코드에 붙여넣어야 저장됨).
   ========================================================= */
(function(){
  const ORIG = JSON.parse(JSON.stringify(POSES));   // 처음 값: 무엇이 바뀌었는지 비교용
  const changed = new Set();
  let held = false;                                  // 여우를 패널에서 붙잡고 있는지 (mode='debug')

  const css = document.createElement('style');
  css.textContent = `
  #dbg{position:fixed;top:12px;right:12px;z-index:100;width:268px;max-height:calc(100vh - 24px);overflow:auto;
    background:rgba(20,17,14,.94);color:#e9e1d2;border:1px solid #4a3d31;border-radius:10px;padding:12px 14px;
    font:12px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)}
  #dbg h2{font-size:13px;margin:0 0 8px;display:flex;justify-content:space-between;align-items:center}
  #dbg h2 small{color:#9c917f;font-weight:400}
  #dbg label{display:block;margin:8px 0 2px;color:#bfb3a0}
  #dbg .rowv{display:flex;gap:8px;align-items:center}
  #dbg input[type=range]{flex:1;accent-color:#c9a877}
  #dbg input[type=number]{width:58px;background:#2a231d;color:#e9e1d2;border:1px solid #4a3d31;border-radius:4px;padding:2px 4px}
  #dbg select{width:100%;background:#2a231d;color:#e9e1d2;border:1px solid #4a3d31;border-radius:4px;padding:4px}
  #dbg .btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  #dbg button{background:#3b342a;color:#f3ede1;border:1px solid #5a4c3d;border-radius:6px;padding:5px 9px;cursor:pointer;font:inherit}
  #dbg button.primary{background:#c9a877;color:#231b15;border-color:#c9a877;font-weight:600}
  #dbg .chk{display:flex;gap:6px;align-items:center;margin-top:8px;color:#bfb3a0}
  #dbg textarea{width:100%;height:84px;margin-top:8px;background:#120f0c;color:#d8ccb4;border:1px solid #4a3d31;border-radius:4px;font:11px/1.4 ui-monospace,monospace;resize:vertical}
  #dbg .msg{min-height:16px;margin-top:6px;color:#c9a877}
  #fox.dbg-guides{outline:1px dashed rgba(120,200,255,.6)}
  #fox.dbg-guides #foxInner img{outline:1px solid rgba(255,140,120,.8)}
  #fox.dbg-guides::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:0;border-left:1px dashed rgba(120,200,255,.6);background:none;z-index:7}
  #fox.dbg-guides #foxInner::after{content:"";position:absolute;left:0;right:0;bottom:0;border-bottom:1px solid rgba(120,255,160,.8)}
  `;
  document.head.appendChild(css);

  const box = document.createElement('div');
  box.id = 'dbg';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', '여우 포즈 조정 패널');
  box.innerHTML = `
    <h2>포즈 조정 <small>#debug</small></h2>
    <label for="dbgPose">포즈</label>
    <select id="dbgPose"></select>
    <label for="dbgFrame">프레임 <span id="dbgFrameName"></span></label>
    <div class="rowv"><input id="dbgFrame" type="range" min="0" max="0" step="1" value="0"></div>
    <label for="dbgH">높이 h (px)</label>
    <div class="rowv"><input id="dbgH" type="range" min="40" max="420" step="1"><input id="dbgHn" type="number" step="1" aria-label="높이 숫자"></div>
    <label for="dbgDx">좌우 dx (px, +는 꼬리 쪽)</label>
    <div class="rowv"><input id="dbgDx" type="range" min="-150" max="150" step="1"><input id="dbgDxn" type="number" step="1" aria-label="좌우 숫자"></div>
    <label for="dbgDy">위아래 dy (px, +는 아래)</label>
    <div class="rowv"><input id="dbgDy" type="range" min="-150" max="150" step="1"><input id="dbgDyn" type="number" step="1" aria-label="위아래 숫자"></div>
    <label for="dbgSh">그림자 폭 sh (%)</label>
    <div class="rowv"><input id="dbgSh" type="range" min="0" max="120" step="1"><input id="dbgShn" type="number" step="1" aria-label="그림자 폭 숫자"></div>
    <label class="chk"><input id="dbgHold" type="checkbox"> 여우 멈춰 세우기 (보는 동안 안 움직임)</label>
    <label class="chk"><input id="dbgGuide" type="checkbox" checked> 기준선 보기 (파랑: 중심, 초록: 바닥, 빨강: 그림 테두리)</label>
    <label class="chk"><input id="dbgFlip" type="checkbox"> 오른쪽 보게 하기</label>
    <div class="btns">
      <button type="button" id="dbgFront">앞으로 데려오기</button>
      <button type="button" id="dbgReset">이 포즈 되돌리기</button>
      <button type="button" class="primary" id="dbgCopy">값 복사</button>
    </div>
    <div class="msg" id="dbgMsg" aria-live="polite"></div>
    <textarea id="dbgOut" readonly aria-label="복사할 코드"></textarea>`;
  document.body.appendChild(box);

  const q = id => box.querySelector('#' + id);
  const sel = q('dbgPose'), frame = q('dbgFrame'), frameName = q('dbgFrameName'), msg = q('dbgMsg'), out = q('dbgOut');
  const pairs = { h: ['dbgH', 'dbgHn'], dx: ['dbgDx', 'dbgDxn'], dy: ['dbgDy', 'dbgDyn'], sh: ['dbgSh', 'dbgShn'] };
  for (const name of Object.keys(POSES)) sel.add(new Option(name, name));
  sel.value = POSES[pose] ? pose : Object.keys(POSES)[0];

  function say(t){ msg.textContent = t; }

  /* 여우를 붙잡기: 대기 중일 때만. 책 먹는 중·꿈 중에는 끝날 때까지 기다려 달라고 안내 */
  function hold(on){
    if (on){
      if (mode === 'debug'){ held = true; return true; }
      if (mode !== 'idle'){ q('dbgHold').checked = false; say('여우가 바쁜 중이에요. 대기 상태가 되면 다시 눌러 주세요.'); return false; }
      mode = 'debug'; held = true; run++; stopMove(); following = false; hideHint();
    } else if (held){
      held = false;
      if (mode === 'debug'){ mode = 'idle'; showHint(); resumeIdle(); }
    }
    q('dbgHold').checked = held;
    return true;
  }

  function showPose(){
    const p = sel.value, c = POSES[p];
    if (!held && !hold(true)) return;
    if (pose !== p) setPose(p);
    if (!imgOK){ say('여우 그림을 불러오지 못해서 임시 실루엣이 보이는 중이에요.'); }
    clearInterval(frameTimer); frameTimer = null;   // 프레임을 하나씩 보기 위해 자동 넘김 멈춤
    bob.style.transform = '';
    frame.max = c.f.length - 1;
    if (+frame.value > c.f.length - 1) frame.value = 0;
    if (curImg) curImg.src = SRC(c.f[+frame.value]);
    frameName.textContent = `(${+frame.value + 1}/${c.f.length} · ${c.f[+frame.value]})`;
    q('dbgFlip').checked = facing === 'right';
    syncInputs();
    apply();
  }

  function syncInputs(){
    const c = POSES[sel.value];
    const v = { h: c.h, dx: c.dx || 0, dy: c.dy || 0, sh: parseFloat(c.sh) || 0 };
    for (const k in pairs){ q(pairs[k][0]).value = v[k]; q(pairs[k][1]).value = v[k]; }
  }

  function apply(){
    if (curImg && pose === sel.value) applyLook(curImg, POSES[pose]);
    out.value = lines();
  }

  function setVal(k, val){
    const c = POSES[sel.value];
    val = Math.round(+val);
    if (!isFinite(val)) return;
    if (k === 'sh') c.sh = val + '%';
    else if (k === 'h') c.h = Math.max(1, val);
    else { if (val) c[k] = val; else delete c[k]; }
    q(pairs[k][0]).value = val; q(pairs[k][1]).value = val;
    if (JSON.stringify(c) !== JSON.stringify(ORIG[sel.value])) changed.add(sel.value); else changed.delete(sel.value);
    if (!held) hold(true);
    if (pose !== sel.value) showPose(); else apply();
  }

  /* POSES에 붙여넣을 한 줄: 기존 표기 순서와 같게 */
  function line(name){
    const c = POSES[name], parts = [];
    parts.push(`f:[${c.f.map(n => `'${n}'`).join(',')}]`);
    for (const k of ['stride', 'bob', 'fps']) if (c[k] != null) parts.push(`${k}:${c[k]}`);
    parts.push(`h:${c.h}`, `sh:'${c.sh}'`);
    if (c.dx) parts.push(`dx:${c.dx}`);
    if (c.dy) parts.push(`dy:${c.dy}`);
    for (const k of ['mouth', 'head']) if (c[k]) parts.push(`${k}:[${c[k].join(',')}]`);
    for (const k of Object.keys(c)) if (!['f','stride','bob','fps','h','sh','dx','dy','mouth','head'].includes(k)) parts.push(`${k}:${JSON.stringify(c[k])}`);
    return `  ${name}: { ${parts.join(', ')} },`;
  }
  function lines(){
    const names = changed.size ? [...changed] : [sel.value];
    return names.map(line).join('\n');
  }

  async function copy(){
    const text = lines();
    out.value = text;
    let ok = false;
    try {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, rej) => setTimeout(rej, 1500))]);
      ok = true;
    } catch(e){}
    if (!ok){ out.focus(); out.select(); try { ok = document.execCommand('copy'); } catch(e){} }
    const n = changed.size ? `바뀐 포즈 ${changed.size}개(${[...changed].join(', ')})` : `${sel.value} 포즈`;
    say(ok ? `${n}의 줄을 복사했어요. main.js POSES에서 같은 이름 줄을 바꿔 넣으세요.` : '자동 복사가 막혔어요. 아래 칸의 내용을 직접 복사해 주세요.');
  }

  sel.addEventListener('change', () => { frame.value = 0; showPose(); });
  frame.addEventListener('input', showPose);
  for (const k in pairs){
    q(pairs[k][0]).addEventListener('input', e => setVal(k, e.target.value));
    q(pairs[k][1]).addEventListener('change', e => setVal(k, e.target.value));
  }
  q('dbgHold').addEventListener('change', e => { if (e.target.checked) showPose(); else hold(false); });
  q('dbgGuide').addEventListener('change', e => fox.classList.toggle('dbg-guides', e.target.checked));
  q('dbgFlip').addEventListener('change', e => { if (!held && !hold(true)) { e.target.checked = false; return; } face(e.target.checked ? 'right' : 'left'); guides(); });
  q('dbgFront').addEventListener('click', () => { if (!held && !hold(true)) return; place(SEAT.x, SEAT.z); });
  q('dbgCopy').addEventListener('click', copy);
  q('dbgReset').addEventListener('click', () => {
    POSES[sel.value] = JSON.parse(JSON.stringify(ORIG[sel.value])); changed.delete(sel.value);
    syncInputs(); apply(); say(`${sel.value} 포즈를 처음 값으로 되돌렸어요.`);
  });
  // 패널 위에서 누른 키·포인터가 여우 동작(책장 Enter, 커서 따라가기)으로 새지 않게
  box.addEventListener('pointerdown', e => e.stopPropagation());
  box.addEventListener('pointermove', e => e.stopPropagation());

  /* applyClasses()가 fox.className을 덮어쓰므로 기준선 클래스를 매 프레임 유지 */
  function guides(){ fox.classList.toggle('dbg-guides', q('dbgGuide').checked && box.style.display !== 'none'); }
  (function keep(){ guides(); requestAnimationFrame(keep); })();

  window.FoxDebug = {
    show(){ box.style.display = ''; guides(); },
    hide(){ box.style.display = 'none'; hold(false); guides(); }
  };
  out.value = lines();
  say('포즈를 고르거나 슬라이더를 움직이면 여우가 멈추고 그 포즈로 바뀌어요.');
})();
