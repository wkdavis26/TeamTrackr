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

    // Fetch teams and games in parallel
    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=1&season=2025'),
      apiFetch('/games?league=1&season=2025'),
    ]);

    // Build apiId -> code map
    const codeMap = {};
    (teamsData.response || []).forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    const now = new Date();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const games = (gamesData.response || [])
      .filter(g => {
        // Parse UTC date+time from the game object
        const dateStr = g.game?.date?.date;
        const timeStr = g.game?.date?.time || '00:00';
        if (!dateStr) return false;
        const gameDate = new Date(`${dateStr}T${timeStr}:00Z`);
        // Include games in progress (started within 4 hours) and upcoming
        return gameDate > liveWindowStart;
      })
      .map(g => {
        const homeApiId = g.teams?.home?.id;
        const awayApiId = g.teams?.away?.id;
        const homeCode = codeMap[homeApiId] || '';
        const awayCode = codeMap[awayApiId] || '';
        const dateStr = g.game?.date?.date;
        const timeStr = g.game?.date?.time || '00:00';
        return {
          id: g.game?.id,
          date: `${dateStr}T${timeStr}:00Z`,
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

    return Response.json({ games }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});