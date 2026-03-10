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

    // NCAAF FBS = league 2. Try current year, fall back to previous year if no data.
    const currentYear = new Date().getFullYear();
    const tryYear = async (year) => Promise.all([
      apiFetch(`/teams?league=2&season=${year}`),
      apiFetch(`/games?league=2&season=${year}`),
    ]);

    let [teamsData, gamesData] = await tryYear(currentYear);
    // If no games returned for current year, try previous year (off-season case)
    if (!(gamesData.response?.length > 0)) {
      [teamsData, gamesData] = await tryYear(currentYear - 1);
    }

    // Build apiId -> code map
    const codeMap = {};
    (teamsData.response || []).forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    const now = new Date();

    const games = (gamesData.response || [])
      .filter(g => {
        const dateStr = g.game?.date?.date;
        const timeStr = g.game?.date?.time || '00:00';
        if (!dateStr) return false;
        const gameDate = new Date(`${dateStr}T${timeStr}:00Z`);
        const status = g.game?.status?.short;
        return status === 'NS' || status === 'SCH' || gameDate > now;
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
            id: homeCode ? `ncaaf-${homeCode.toLowerCase()}` : null,
            name: g.teams?.home?.name || '',
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: awayCode ? `ncaaf-${awayCode.toLowerCase()}` : null,
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

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});