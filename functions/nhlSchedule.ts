import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

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

    // Fetch teams and games in parallel - NHL is league 2, season 2026
    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=2&season=2026'),
      apiFetch('/games?league=2&season=2026'),
    ]);

    if (!teamsData || !teamsData.response) {
      return Response.json({ games: [], error: 'No teams data' });
    }
    if (!gamesData || !gamesData.response) {
      return Response.json({ games: [], error: 'No games data' });
    }

    // Build apiId -> code map
    const codeMap = {};
    teamsData.response.forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    const now = new Date();

    const games = (gamesData.response || [])
      .filter(g => {
        // Parse UTC date+time from the game object
        const dateStr = g.game?.date?.date;
        const timeStr = g.game?.date?.time || '00:00';
        if (!dateStr) return false;
        const gameDate = new Date(`${dateStr}T${timeStr}:00Z`);
        // Include games not yet finished (future + today) - use same logic as NFL (4 hour window for live games)
        const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        const status = g.game?.status?.short;
        return status === 'NS' || status === 'SCH' || gameDate > liveWindowStart;
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
            id: homeCode ? `nhl-${homeCode.toLowerCase()}` : null,
            name: g.teams?.home?.name || '',
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: awayCode ? `nhl-${awayCode.toLowerCase()}` : null,
            name: g.teams?.away?.name || '',
            logo: g.teams?.away?.logo || null,
          },
          venue: g.game?.venue?.name || 'TBD',
          status: g.game?.status?.short || 'NS',
        };
      });

    return Response.json({ games }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});