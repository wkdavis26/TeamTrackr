import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

const apiFetch = async (endpoint) => {
  const fullUrl = `${BASE_URL}${endpoint}`;
  const res = await fetch(fullUrl, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${fullUrl}`);
  const data = await res.json();
  return data;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch teams and games in parallel - NHL is league 57
    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=57&season=2026'),
      apiFetch('/games?league=57&season=2026'),
    ]);

    console.log('[NHL] Full response structure:', JSON.stringify({ teamsData, gamesData }, null, 2));

    const teams = teamsData?.response || [];
    const rawGames = gamesData?.response || [];

    // Build apiId -> code map
    const codeMap = {};
    teams.forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    const now = new Date();

    const games = (gamesData.response || [])
      .filter(g => {
        // Parse UTC date from the game object
        const dateStr = g.date;
        if (!dateStr) return false;
        const gameDate = new Date(dateStr);
        // Include games not yet finished - use same logic as NFL (4 hour window for live games)
        const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        const status = g.status?.short;
        return status === 'NS' || status === 'SCH' || gameDate > liveWindowStart;
      })
      .map(g => {
        const homeApiId = g.teams?.home?.id;
        const awayApiId = g.teams?.away?.id;
        const homeCode = codeMap[homeApiId] || '';
        const awayCode = codeMap[awayApiId] || '';
        return {
          id: g.id,
          date: g.date,
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
          venue: g.venue?.name || 'TBD',
          status: g.status?.short || 'NS',
        };
      })
      .filter(g => g.homeTeam.id && g.awayTeam.id);

    return Response.json({ games }, {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});