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

    // NFL season starts in September; use previous year Jan–Aug, current year Sep–Dec
    const _d = new Date();
    const season = _d.getMonth() >= 8 ? _d.getFullYear() : _d.getFullYear() - 1;

    const [teamsData, gamesData, oddsToday, oddsTomorrow, oddsDayAfter] = await Promise.all([
      apiFetch(`/teams?league=1&season=${season}`),
      apiFetch(`/games?league=1&season=${season}`),
      apiFetch(`/odds?league=1&season=${season}&bookmaker=8&date=${today}`).catch(() => null),
      apiFetch(`/odds?league=1&season=${season}&bookmaker=8&date=${tomorrow}`).catch(() => null),
      apiFetch(`/odds?league=1&season=${season}&bookmaker=8&date=${dayAfter}`).catch(() => null),
    ]);

    const codeMap = {};
    (teamsData.response || []).forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    // Build odds map: gameId -> odds
    const oddsMap = {};
    [...(oddsToday?.response || []), ...(oddsTomorrow?.response || []), ...(oddsDayAfter?.response || [])].forEach(item => {
      const gameId = item.game?.id;
      if (!gameId) return;
      const bets = item.bookmakers?.[0]?.bets || [];
      const ml = bets.find(b => b.name === 'Money Line' || b.name === 'Moneyline');
      const spread = bets.find(b => b.name === 'Point Spread' || b.name === 'Spread');
      const ou = bets.find(b => b.name === 'Over/Under' || b.name === 'Total');
      const mlVals = ml?.values || [];
      const homeOdd = mlVals.find(v => v.value === 'Home')?.odd;
      const awayOdd = mlVals.find(v => v.value === 'Away')?.odd;
      const spreadVals = spread?.values || [];
      const spreadVal = spreadVals.find(v => v.handicap)?.handicap || spreadVals[0]?.value || null;
      const ouVals = ou?.values || [];
      const ouVal = ouVals.find(v => v.value === 'Over')?.handicap || ouVals[0]?.handicap || null;
      oddsMap[gameId] = {
        homeMoneyline: fmtOdd(homeOdd),
        awayMoneyline: fmtOdd(awayOdd),
        spread: spreadVal ? String(spreadVal) : null,
        overUnder: ouVal ? String(ouVal) : null,
      };
    });

    const now = new Date();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const games = (gamesData.response || [])
      .filter(g => {
        const dateStr = g.game?.date?.date;
        const timeStr = g.game?.date?.time || '00:00';
        if (!dateStr) return false;
        return new Date(`${dateStr}T${timeStr}:00Z`) > liveWindowStart;
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
          odds: oddsMap[g.game?.id] || null,
        };
      })
      .filter(g => g.homeTeam.id && g.awayTeam.id);

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});