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
    
    // Get the last few games to see if they're in the future
    const last5 = games.slice(-5);
    const statusCounts = {};
    games.forEach(g => {
      const s = g.status?.short || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    return Response.json({
      total: games.length,
      paginationTotal: data.paging?.total,
      statusCounts,
      last5: last5.map(g => ({ date: g.date?.start, status: g.status?.short, home: g.teams?.home?.name, away: g.teams?.visitors?.name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});