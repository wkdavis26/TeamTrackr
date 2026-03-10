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

    const season = 2025; // upcoming season

    // Fetch teams to build apiId -> code map
    const teamsData = await apiFetch('/teams?league=1&season=2025');
    const codeMap = {};
    (teamsData.response || []).forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    // Fetch all games for the 2025 season
    const gamesData = await apiFetch(`/games?league=1&season=${season}`);
    const now = new Date();

    const games = (gamesData.response || [])
      .filter(g => {
        const gameDate = new Date(g.game?.date?.date + 'T' + (g.game?.date?.time || '00:00') + ':00');
        return gameDate > now;
      })
      .map(g => {
        const homeApiId = g.teams?.home?.id;
        const awayApiId = g.teams?.away?.id;
        const homeCode = codeMap[homeApiId] || '';
        const awayCode = codeMap[awayApiId] || '';
        return {
          id: g.game?.id,
          date: g.game?.date?.date + 'T' + (g.game?.date?.time || '00:00') + ':00',
          homeTeam: {
            id: homeCode ? `nfl-${homeCode.toLowerCase()}` : null,
            name: g.teams?.home?.name || '',
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: awayCode ? `nfl-${awayCode.toLowerCase()}` : null,
            name: g.teams?.away?.name || '',
            logo: g.teams?.away?.logo || null,
          },
          venue: g.game?.venue?.name || 'TBD',
          week: g.game?.week || '',
          stage: g.game?.stage || '',
          status: g.game?.status?.short || 'NS',
        };
      })
      .filter(g => g.homeTeam.id && g.awayTeam.id);

    return Response.json({ games, season });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});