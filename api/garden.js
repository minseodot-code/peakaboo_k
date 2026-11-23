/* 보기 전용 /view 가 읽는 '내 꽃밭' 저장소 (Vercel 서버 함수, 라이브러리 없음)
   GET  /api/garden            → 마지막으로 올린 꽃밭 {p, a, m, b, t}
   POST /api/garden (JSON 본문) → 꽃밭 올리기. 헤더 x-garden-key 가 환경 변수 GARDEN_KEY 와 같아야 함
   저장소: Vercel 마켓플레이스 'Upstash for Redis' (환경 변수 KV_REST_API_URL/KV_REST_API_TOKEN 또는 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN) */
const crypto = require('crypto');
const KEY = 'peakaboo:garden';
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
function clean(o) {      // 꽃밭 모양만 남기고, 너무 크면 거절
  const arr = v => Array.isArray(v) ? v : [];
  const out = {
    p: arr(o.p).filter(s => typeof s === 'string').slice(0, 2000),
    a: arr(o.a).filter(r => Array.isArray(r) && typeof r[0] === 'string').map(r => [r[0], +r[1] || 0]).slice(0, 5000),
    m: {}, b: arr(o.b).filter(q => q && Array.isArray(q.b)).map(q => ({ t: +q.t || 0, b: q.b.filter(s => typeof s === 'string') })).slice(0, 2000),
    t: Date.now()
  };
  if (o.m && typeof o.m === 'object') for (const k in o.m) if (typeof o.m[k] === 'string') out.m[k] = o.m[k].slice(0, 5000);
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
      if (!process.env.GARDEN_KEY) return res.status(503).json({ error: 'no-key' });
      if (!sameKey(req.headers['x-garden-key'], process.env.GARDEN_KEY)) return res.status(401).json({ error: 'wrong-key' });
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
