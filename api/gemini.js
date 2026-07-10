/* [v2.188] Vercel Edge Function — Groq AI + 토큰 자동 제한
   문제: 전체 raw data 전달 시 87,097 토큰 → TPM 8,000 초과
   해결: 요청 전 토큰 추정 → 6,000토큰 초과 시 데이터 자동 트리밍
   모델별 TPM: openai/gpt-oss-120b 8K, qwen/qwen3.6-27b 6K, llama-3.1-8b 6K */
export const config = { runtime: 'edge' };

const GROQ_MODELS = [
  'llama-3.1-8b-instant',      /* 메인: TPM 6K이지만 경량 → 빠름, 안정적 */
  'openai/gpt-oss-120b',       /* 폴백1: 고품질, TPM 8K */
  'qwen/qwen3.6-27b',          /* 폴백2: 한국어 우수, TPM 6K */
];

const MAX_TOKENS = 5500;       /* 안전 마진 (TPM 6K의 91%) */

const QMS_SYSTEM_DEFAULT = `당신은 INNODIS 품질경영시스템(QMS)의 AI 어시스턴트입니다.
제조업 품질관리 전문가로서 ISO 9001, SPC, MSA, 8D, FMEA 등에 정통합니다.
실제 QMS 데이터를 바탕으로 구체적이고 실행 가능한 인사이트를 제공합니다.
답변은 한국어로, 간결하고 실무 중심으로 작성합니다.`;

/* 토큰 수 추정 (글자수 / 2.5 — 한국어는 영어보다 토큰 효율 낮음) */
function estimateTokens(text) {
  return Math.ceil((text || '').length / 2.5);
}

/* 데이터 문자열을 토큰 한도 내로 트리밍 */
function trimToTokenLimit(systemContent, messages, maxTokens) {
  const fixedTokens = estimateTokens(systemContent) +
    messages.reduce((s, m) => s + estimateTokens(m.content), 0);

  if (fixedTokens <= maxTokens) return systemContent;

  /* 시스템 메시지가 너무 길면 뒤에서 자르기 */
  const allowedSystemChars = Math.max(500, (maxTokens - estimateTokens(messages.reduce((s,m)=>s+m.content,'')) ) * 2.5);
  const trimmed = systemContent.slice(0, allowedSystemChars);
  /* 마지막 완성된 줄에서 자르기 */
  const lastNewline = trimmed.lastIndexOf('\n');
  return (lastNewline > 200 ? trimmed.slice(0, lastNewline) : trimmed) +
    '\n\n[데이터 일부 생략 — 토큰 한도 초과]';
}

async function callGroq(apiKey, messages, model) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1200 }),
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
    const { prompt, data, mode, messages: chatMessages, systemOverride } = body;
    const requestTime = new Date().toISOString();

    let messages;
    let systemContent;

    if (chatMessages && Array.isArray(chatMessages)) {
      /* 챗봇 모드 */
      systemContent = systemOverride || QMS_SYSTEM_DEFAULT;
      /* [v2.188] 토큰 초과 방지 — 자동 트리밍 */
      systemContent = trimToTokenLimit(systemContent, chatMessages, MAX_TOKENS);
      messages = [
        { role: 'system', content: systemContent },
        /* 최근 10턴만 유지 (오래된 히스토리 제거) */
        ...chatMessages.slice(-20),
      ];
    } else {
      /* 단일 분석 모드 */
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'prompt가 필요합니다.' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      const dataStr = data
        ? (typeof data === 'string' ? data : JSON.stringify(data, null, 1))
        : '';
      /* [v2.188] 데이터 크기 제한 — 3,000토큰 이내로 트리밍 */
      const maxDataChars = 3000 * 2.5;
      const trimmedData = dataStr.length > maxDataChars
        ? dataStr.slice(0, maxDataChars) + '\n...[데이터 일부 생략]'
        : dataStr;
      const fullPrompt = trimmedData
        ? `${prompt}\n\n[데이터]\n${trimmedData}`
        : prompt;
      systemContent = QMS_SYSTEM_DEFAULT;
      messages = [
        { role: 'system', content: systemContent },
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
            promptTokens:  usage.prompt_tokens     || 0,
            outputTokens:  usage.completion_tokens || 0,
            totalTokens:   usage.total_tokens      || 0,
            requestTime, mode: mode || 'chat',
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
      }
      /* 토큰 초과 → 다음 모델 시도 */
      if (status === 429 || status === 503 ||
          (status === 400 && (json.error?.message?.includes('too large') || json.error?.message?.includes('tokens')))) {
        lastError = json.error?.message || `${model} limit`;
        continue;
      }
      if (status === 400 && json.error?.message?.includes('decommissioned')) {
        lastError = `${model} 종료됨`;
        continue;
      }
      return new Response(JSON.stringify({ error: json.error?.message || 'Groq API 오류' }), {
        status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: `잠시 후 재시도하세요. (${lastError || ''})` }), {
      status: 429, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
