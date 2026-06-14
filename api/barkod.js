export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(value))
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const entry = await req.json();
      const entries = await kvGet('entries');
      entries.unshift({ ...entry, id: Date.now(), synced: true });
      await kvSet('entries', entries);
      return new Response(JSON.stringify({ success: true, count: entries.length }), { headers: corsHeaders });
    }

    if (req.method === 'GET') {
      const entries = await kvGet('entries');
      return new Response(JSON.stringify({ success: true, entries }), { headers: corsHeaders });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      const entries = await kvGet('entries');
      const filtered = entries.filter(e => e.id !== id);
      await kvSet('entries', filtered);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
