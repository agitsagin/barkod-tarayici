const KV_URL = 'https://ready-hookworm-122164.upstash.io';
const KV_TOKEN = 'gQAAAAAAAd00AAIgcDI5OWQ3OWYzNDdmM2E0OTk0OTY2NmM5ZTBiZjg0NWE4MQ';

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

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response('', { headers: cors });

  try {
    if (req.method === 'POST') {
      const entry = await req.json();
      const entries = await kvGet('entries');
      entries.unshift({ ...entry, id: Date.now(), synced: true });
      await kvSet('entries', entries);
      return new Response(JSON.stringify({ success: true, count: entries.length }), { headers: cors });
    }
    if (req.method === 'GET') {
      const entries = await kvGet('entries');
      return new Response(JSON.stringify({ success: true, entries }), { headers: cors });
    }
    if (req.method === 'DELETE') {
      const { id } = await req.json();
      const entries = await kvGet('entries');
      await kvSet('entries', entries.filter(e => e.id !== id));
      return new Response(JSON.stringify({ success: true }), { headers: cors });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: cors });
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
}

export const config = { runtime: 'edge' };
