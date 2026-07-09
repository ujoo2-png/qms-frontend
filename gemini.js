/* [v2.167] Vercel Edge Function — Gemini AI 분석 엔드포인트
   - API 키는 Vercel 환경변수 GEMINI_API_KEY 에서 읽음 (코드에 노출 없음)
   - 요청: POST /api/gemini { prompt, data, mode }
   - 응답: { result, usage: { promptTokens, outputTokens, totalTokens, requestTime, mode } }
   - 무료 티어: gemini-2.0-flash (분당 15회, 일 1,500회) */
export const config = { runtime: 'edge' };

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
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' }), {
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

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: result.error?.message || 'Gemini API 오류',
        detail: result.error
      }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '분석 결과를 가져올 수 없습니다.';
    const usage = result.usageMetadata || {};

    return new Response(JSON.stringify({
      result: text,
      usage: {
        promptTokens:  usage.promptTokenCount      || 0,
        outputTokens:  usage.candidatesTokenCount  || 0,
        totalTokens:   usage.totalTokenCount       || 0,
        requestTime,
        mode: mode || 'general'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
