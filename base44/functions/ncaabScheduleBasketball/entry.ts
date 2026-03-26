import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.basketball.api-sports.io';

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

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(now.getTime() + 172800000).toISOString().slice(0, 10);

    // Try 2026 season first, fall back to 2025
    let raw = [];
    for (const season of [2026, 2025]) {
      try {
        const data = await apiFetch(`/games?league=116&season=${season}`);
        raw = data.response || [];
        if (raw.length > 0) break;
      } catch { /* try next */ }
    }

    // Fetch odds for today/tomorrow/dayAfter in parallel
    const [oddsToday, oddsTomorrow, oddsDayAfter] = await Promise.all([
      apiFetch(`/odds?league=116&bookmaker=8&date=${today}`).catch(() => null),
      apiFetch(`/odds?league=116&bookmaker=8&date=${tomorrow}`).catch(() => null),
      apiFetch(`/odds?league=116&bookmaker=8&date=${dayAfter}`).catch(() => null),
    ]);

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
      .filter(g => new Date(g.date) > now)
      .map(g => ({
        id: g.id,
        date: new Date(g.date),
        homeTeam: {
          id: `ncaab-${g.teams?.home?.code?.toLowerCase() || g.teams?.home?.id}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `ncaab-${g.teams?.away?.code?.toLowerCase() || g.teams?.away?.id}`,
          name: g.teams?.away?.name,
          logo: g.teams?.away?.logo || null,
        },
        venue: g.venue?.name || 'TBD',
        status: g.status?.long || 'Scheduled',
        odds: oddsMap[g.id] || null,
      }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});