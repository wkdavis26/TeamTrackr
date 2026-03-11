import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.baseball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${endpoint}`);
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Debug: check API status
    const statusData = await apiFetch('/status');
    const leaguesData = await apiFetch('/leagues?id=1');
    const gamesData2025 = await apiFetch('/games?league=1&season=2025');
    const gamesData2026 = await apiFetch('/games?league=1&season=2026');

    return Response.json({
      status: statusData,
      leagues: leaguesData?.response?.slice(0, 2),
      games2025Count: gamesData2025?.response?.length,
      games2025Sample: gamesData2025?.response?.slice(0, 2),
      games2026Count: gamesData2026?.response?.length,
      games2026Sample: gamesData2026?.response?.slice(0, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});