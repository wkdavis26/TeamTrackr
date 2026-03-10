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
    const raw = data.response || [];
    const now = new Date();

    // Status 1 = Not Started, 2 = In Progress
    const games = raw
      .filter(g => ['1', '2', 1, 2].includes(g.status?.short))
      .filter(g => new Date(g.date?.start) >= now)
      .map(g => ({
        id: g.id,
        date: g.date?.start,
        homeTeam: {
          id: `nba-${(g.teams?.home?.code || '').toLowerCase()}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `nba-${(g.teams?.visitors?.code || '').toLowerCase()}`,
          name: g.teams?.visitors?.name,
          logo: g.teams?.visitors?.logo || null,
        },
        venue: g.arena?.name || 'TBD',
        status: 'NS',
        stage: g.league === 'standard' ? '' : g.league,
      }));

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});