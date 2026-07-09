/* [v2.172] Vercel Edge Function — Groq AI 분석 엔드포인트
   Gemini AQ. 키 문제로 Groq API로 교체
   모델: llama-3.3-70b-versatile (무료, 한국어 우수)
   무료 한도: 일 1,000회, 분 30회, 신용카드 불필요
   API 키: Vercel 환경변수 GROQ_API_KEY */
export const config = { runtime: 'edge' };

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
];

export default async function handler(req) {
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'GROQ_API_KEY 환경변수가 설정되지 않았습니다.\nVercel Settings → Environment Variables → GROQ_API_KEY 추가 후 Redeploy 해주세요.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await req.json();
    const { prompt, data, mode } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const requestTime = new Date().toISOString();
    const fullPrompt = data
      ? `${prompt}\n\n[데이터]\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`
      : prompt;

    /* Groq 모델 폴백 루프 */
    let lastError = null;
    for (const model of GROQ_MODELS) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        const text = result.choices?.[0]?.message?.content || '분석 결과를 가져올 수 없습니다.';
        const usage = result.usage || {};
        return new Response(JSON.stringify({
          result: text,
          model,
          usage: {
            promptTokens:  usage.prompt_tokens     || 0,
            outputTokens:  usage.completion_tokens || 0,
            totalTokens:   usage.total_tokens      || 0,
            requestTime,
            mode: mode || 'general',
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      /* rate limit → 다음 모델 시도 */
      if (res.status === 429 || res.status === 503) {
        lastError = result.error?.message || `${model} rate limit`;
        continue;
      }

      /* 그 외 오류 즉시 반환 */
      return new Response(JSON.stringify({
        error: result.error?.message || 'Groq API 오류',
        model,
      }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    /* 모든 모델 실패 */
    return new Response(JSON.stringify({
      error: `AI 분석 일시 실패 (잠시 후 재시도하세요)\n${lastError || ''}`,
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
