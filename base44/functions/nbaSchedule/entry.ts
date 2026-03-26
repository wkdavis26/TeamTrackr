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

const fmtOdd = (o) => {
  if (!o) return null;
  const n = parseFloat(o);
  if (isNaN(n)) return null;
  if (n >= 2.0) return `+${Math.round((n - 1) * 100)}`;
  return `${Math.round(-100 / (n - 1))}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

    // NBA season starts in October; use previous year Jan–Sep, current year Oct–Dec
    const _d = new Date();
    const season = _d.getMonth() >= 9 ? _d.getFullYear() : _d.getFullYear() - 1;

    const [data, oddsToday, oddsTomorrow, oddsDayAfter] = await Promise.all([
      apiFetch(`/games?season=${season}`),
      apiFetch(`/odds?season=${season}&bookmaker=8&date=${today}`).catch(() => null),
      apiFetch(`/odds?season=${season}&bookmaker=8&date=${tomorrow}`).catch(() => null),
      apiFetch(`/odds?season=${season}&bookmaker=8&date=${dayAfter}`).catch(() => null),
    ]);

    const raw = data.response || [];
    const now = new Date();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Build odds map: gameId -> odds
    const oddsMap = {};
    [...(oddsToday?.response || []), ...(oddsTomorrow?.response || []), ...(oddsDayAfter?.response || [])].forEach(item => {
      const gameId = item.game?.id;
      if (!gameId) return;
      const bets = item.bookmakers?.[0]?.bets || [];
      const ml = bets.find(b => b.name === 'Money Line' || b.name === 'Moneyline');
      const mlVals = ml?.values || [];
      const homeOdd = mlVals.find(v => v.value === 'Home')?.odd;
      const awayOdd = mlVals.find(v => v.value === 'Away')?.odd;
      if (homeOdd || awayOdd) {
        oddsMap[gameId] = {
          homeMoneyline: fmtOdd(homeOdd),
          awayMoneyline: fmtOdd(awayOdd),
        };
      }
    });

    const games = raw
      .filter(g => ['0', '1', 0, 1].includes(g.status?.short))
      .filter(g => new Date(g.date?.start) > liveWindowStart)
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
        odds: oddsMap[g.id] || null,
      }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});