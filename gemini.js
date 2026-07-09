/* [v2.171] Vercel Edge Function — Gemini AI 분석 엔드포인트
   모델 폴백: gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-flash-8b
   429/quota 오류 시 자동으로 다음 모델 시도
   API 키: Vercel 환경변수 GEMINI_API_KEY */
export const config = { runtime: 'edge' };

/* 시도 순서: 최신 → 구형 순. 무료 티어 모두 지원 */
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

async function callGemini(apiKey, payload, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, json, model };
}

export default async function handler(req) {
  /* CORS preflight */
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel Settings → Environment Variables에서 추가해 주세요.'
    }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body = await req.json();
    const { prompt, data, mode } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt가 필요합니다.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const requestTime = new Date().toISOString();
    const fullPrompt = data
      ? `${prompt}\n\n[데이터]\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`
      : prompt;

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
    };

    /* 모델 폴백 루프 — 429/quota 오류 시 다음 모델로 자동 전환 */
    let lastError = null;
    let usedModel = null;

    for (const model of MODELS) {
      const { status, ok, json } = await callGemini(apiKey, payload, model);

      /* 성공 */
      if (ok) {
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '분석 결과를 가져올 수 없습니다.';
        const usage = json.usageMetadata || {};
        return new Response(JSON.stringify({
          result: text,
          model,
          usage: {
            promptTokens:  usage.promptTokenCount     || 0,
            outputTokens:  usage.candidatesTokenCount || 0,
            totalTokens:   usage.totalTokenCount      || 0,
            requestTime,
            mode: mode || 'general',
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      /* quota/rate limit — 다음 모델 시도 */
      if (status === 429 || status === 403) {
        lastError = json.error?.message || `${model} quota 초과`;
        continue;
      }

      /* 그 외 오류 — 즉시 반환 */
      return new Response(JSON.stringify({
        error: json.error?.message || 'Gemini API 오류',
        model,
      }), {
        status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    /* 모든 모델 실패 */
    return new Response(JSON.stringify({
      error: `모든 모델에서 quota가 초과됐습니다.\n\n해결 방법:\n1. aistudio.google.com/apikey 에서 "Create API key in new project"로 새 키 발급\n2. Vercel 환경변수 GEMINI_API_KEY를 새 키로 교체 후 Redeploy\n\n마지막 오류: ${lastError}`,
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
