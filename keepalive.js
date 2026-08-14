// [v2.244] Vercel Serverless Function — Supabase Keepalive
// Vercel Cron: 3일마다 자동 실행 → Supabase 7일 일시정지 방지
// 환경변수: SUPABASE_URL, SUPABASE_KEY (Vercel 프로젝트 설정에 추가 필요)

export default async function handler(req, res) {
  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_KEY;

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'Supabase 환경변수 미설정' });
  }

  try {
    const resp = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey':        key,
        'Authorization': `Bearer ${key}`,
      }
    });

    const now = new Date().toISOString();
    if (resp.ok) {
      console.log(`[Keepalive] ✅ ${now} — Supabase ping 성공 (status: ${resp.status})`);
      return res.status(200).json({ ok: true, time: now, status: resp.status });
    } else {
      const body = await resp.text();
      console.warn(`[Keepalive] ⚠️ ${now} — ping 실패: ${resp.status}`, body);
      return res.status(200).json({ ok: false, time: now, status: resp.status, body });
    }
  } catch (e) {
    console.error('[Keepalive] ❌ 오류:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
