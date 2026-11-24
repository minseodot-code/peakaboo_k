/* 보기 전용 /view 가 읽는 '내 꽃밭' 저장소 (Vercel 서버 함수, 라이브러리 없음)
   GET  /api/garden            → 마지막으로 올린 꽃밭 {p, a, m, b, t}
   POST /api/garden (JSON 본문) → 꽃밭 올리기. 헤더 x-garden-owner = 그 브라우저의 주인 표(무작위 문자열)
     · 아직 주인이 없으면 처음 올린 브라우저가 주인이 됨 (비밀번호 입력 없음)
     · 그 뒤로는 같은 주인 표로만 올릴 수 있음
     · 브라우저를 바꿨을 때: 헤더 x-garden-key 가 환경 변수 GARDEN_KEY(선택)와 같으면 새 브라우저가 주인이 됨
   저장소: Vercel 마켓플레이스 'Upstash for Redis' (환경 변수 KV_REST_API_URL/KV_REST_API_TOKEN 또는 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN) */
const crypto = require('crypto');
const KEY = 'peakaboo:garden', OWNER = 'peakaboo:owner';
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL_(), { method: 'POST', headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('store ' + r.status);
  return (await r.json()).result;
}
function sameKey(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}
const sha = v => crypto.createHash('sha256').update(String(v)).digest('hex');
function clean(o) {      // 꽃밭 모양만 남기고, 너무 크면 거절
  const arr = v => Array.isArray(v) ? v : [];
  const out = {
    p: arr(o.p).filter(s => typeof s === 'string').slice(0, 2000),
    a: arr(o.a).filter(r => Array.isArray(r) && typeof r[0] === 'string').map(r => [r[0], +r[1] || 0]).slice(0, 5000),
    m: {}, b: arr(o.b).filter(q => q && Array.isArray(q.b)).map(q => ({ t: +q.t || 0, b: q.b.filter(s => typeof s === 'string') })).slice(0, 2000),
    t: Date.now()
  };
  if (o.m && typeof o.m === 'object') for (const k in o.m) if (typeof o.m[k] === 'string') out.m[k] = o.m[k].slice(0, 5000);
  if (Array.isArray(o.k)) {   // 사이트에서 직접 쓴 책 목록
    const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
    out.k = o.k.filter(b => b && typeof b.title === 'string' && b.title.trim()).slice(0, 1000).map(b => {
      const x = { title: str(b.title, 120), author: str(b.author, 80),
        quotes: (Array.isArray(b.quotes) ? b.quotes : []).filter(q => q && typeof q.t === 'string').slice(0, 100).map(q => ({ t: str(q.t, 3000), p: str(q.p, 30) })) };
      if (typeof b.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(b.color)) x.color = b.color;
      if (typeof b.note === 'string') x.note = b.note.slice(0, 5000);
      if (typeof b.id === 'string' && b.id.trim()) x.id = b.id.slice(0, 160);   // 같은 책의 두 번째 기록부터 '이름~2' 같은 이름표
      return x;
    });
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_() || !TOKEN()) return res.status(503).json({ error: 'not-set-up' });
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', KEY]);
      return res.status(200).json(v ? JSON.parse(v) : { p: [], a: [], m: {}, b: [], t: 0 });
    }
    if (req.method === 'POST') {
      const tok = String(req.headers['x-garden-owner'] || '');
      if (tok.length < 16) return res.status(400).json({ error: 'no-owner' });
      const owner = await redis(['GET', OWNER]);
      if (!owner) await redis(['SET', OWNER, sha(tok)]);                       // 처음 올린 브라우저가 주인
      else if (owner !== sha(tok)) {
        if (process.env.GARDEN_KEY && sameKey(req.headers['x-garden-key'], process.env.GARDEN_KEY)) await redis(['SET', OWNER, sha(tok)]);   // 비상용: 주인 되찾기
        else return res.status(403).json({ error: 'not-owner' });
      }
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const data = clean(body || {});
      const s = JSON.stringify(data);
      if (s.length > 900000) return res.status(413).json({ error: 'too-big' });
      await redis(['SET', KEY, s]);
      return res.status(200).json({ ok: true, t: data.t });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
