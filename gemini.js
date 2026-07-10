export const config = { runtime: 'edge' };

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'llama3-70b-8192',
];

const QMS_SYSTEM = `당신은 INNODIS 품질경영시스템(QMS)의 AI 어시스턴트입니다.
제조업 품질관리 전문가로서 ISO 9001, SPC, MSA, 8D, FMEA 등에 정통합니다.
사용자가 제공하는 실제 QMS 데이터를 바탕으로 구체적이고 실행 가능한 인사이트를 제공합니다.
답변은 한국어로, 간결하고 실무 중심으로 작성합니다.`;

async function callGroq(apiKey, messages, model) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1500 }),
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, json };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }});
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY 미설정.' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await req.json();
    const { prompt, data, mode, messages: chatMessages } = body;
    const requestTime = new Date().toISOString();

    let messages;
    if (chatMessages && Array.isArray(chatMessages)) {
      messages = [{ role: 'system', content: QMS_SYSTEM }, ...chatMessages];
    } else {
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'prompt가 필요합니다.' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      const fullPrompt = data
        ? `${prompt}\n\n[데이터]\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`
        : prompt;
      messages = [
        { role: 'system', content: QMS_SYSTEM },
        { role: 'user', content: fullPrompt },
      ];
    }

    let lastError = null;
    for (const model of GROQ_MODELS) {
      const { status, ok, json } = await callGroq(apiKey, messages, model);
      if (ok) {
        const text = json.choices?.[0]?.message?.content || '결과를 가져올 수 없습니다.';
        const usage = json.usage || {};
        return new Response(JSON.stringify({
          result: text, model,
          usage: {
            promptTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
            totalTokens:  usage.total_tokens || 0,
            requestTime, mode: mode || 'chat',
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json',
