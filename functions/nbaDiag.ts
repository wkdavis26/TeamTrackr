import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v2.nba.api-sports.io';

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

    const data = await apiFetch('/games?season=2025');
    const games = data.response || [];
    const upcoming = games.filter(g => g.status?.short === 'NS');

    return Response.json({
      total: games.length,
      upcomingCount: upcoming.length,
      sampleUpcoming: upcoming.slice(0, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});