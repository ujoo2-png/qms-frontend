export const config = { runtime: 'edge' };
const GROQ_MODELS = ['llama-3.3-70b-versatile','llama-3.1-70b-versatile','mixtral-8x7b-32768'];
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if (req.method !== 'POST') return new Response('Method Not Allowed', {status:405});
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({error:'GROQ_API_KEY 미설정'}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  try {
    const {prompt, data, mode} = await req.json();
    const requestTime = new Date().toISOString();
    const fullPrompt = data ? `${prompt}\n\n[데이터]\n${typeof data==='string'?data:JSON.stringify(data,null,2)}` : prompt;
    let lastError = null;
    for (const model of GROQ_MODELS) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify({model, messages:[{role:'user',content:fullPrompt}], temperature:0.7, max_tokens:1500})
      });
      const result = await res.json();
      if (res.ok) {
        const text = result.choices?.[0]?.message?.content || '결과 없음';
        const usage = result.usage || {};
        return new Response(JSON.stringify({result:text, model, usage:{promptTokens:usage.prompt_tokens||0, outputTokens:usage.completion_tokens||0, totalTokens:usage.total_tokens||0, requestTime, mode:mode||'general'}}), {status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
      }
      if (res.status===429||res.status===503) {lastError=result.error?.message||`${model} limit`; continue;}
      return new Response(JSON.stringify({error:result.error?.message||'Groq API 오류'}), {status:res.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    }
    return new Response(JSON.stringify({error:`잠시 후 재시도하세요. ${lastError||''}`}), {status:429,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}
