import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.american-football.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Try the 2025 season first (preseason/schedule may be available), fall back to 2024
    let gamesData = await apiFetch('/games?league=1&season=2025');
    if (!gamesData.response?.length) {
      gamesData = await apiFetch('/games?league=1&season=2024');
    }

    // Return a sample game to inspect the shape
    const sample = gamesData.response?.[0];

    return Response.json({ sample, total: gamesData.response?.length || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});