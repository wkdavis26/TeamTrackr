import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.basketball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) return null;
  return res.json();
};

const toAmericanOdds = (decimal) => {
  if (!decimal || isNaN(decimal)) return null;
  const d = parseFloat(decimal);
  if (d >= 2.0) return `+${Math.round((d - 1) * 100)}`;
  return `${Math.round(-100 / (d - 1))}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // WNBA league id = 12
    const LEAGUE_ID = 12;
    const now = new Date();
    const season = now.getFullYear();

    const today = now.toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const [data, oddsData] = await Promise.all([
      apiFetch(`/games?league=${LEAGUE_ID}&season=${season}`),
      apiFetch(`/odds?league=${LEAGUE_ID}&season=${season}&bookmaker=8&from=${today}&to=${in7Days}`).catch(() => null),
    ]);

    if (!data?.response) return Response.json({ games: [] });

    const oddsMap = {};
    (oddsData?.response || []).forEach(item => {
      const gameId = item.game?.id;
      if (!gameId) return;
      const bets = item.bookmakers?.[0]?.bets || [];
      const matchWinner = bets.find(b => b.name === 'Home/Away');
      if (!matchWinner?.values) return;
      const vals = matchWinner.values;
      oddsMap[gameId] = {
        home: toAmericanOdds(vals.find(v => v.value === 'Home')?.odd),
        away: toAmericanOdds(vals.find(v => v.value === 'Away')?.odd),
      };
    });

    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const games = (data.response || [])
      .filter(g => {
        const d = new Date(g.date);
        const status = g.status?.short || '';
        return d > liveWindowStart && !['FT', 'AOT', 'CANC', 'PST'].includes(status);
      })
      .map(g => ({
        id: g.id,
        date: new Date(g.date),
        homeTeam: {
          id: `wnba-${(g.teams?.home?.code || g.teams?.home?.name || '').toLowerCase().replace(/\s+/g, '-')}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `wnba-${(g.teams?.away?.code || g.teams?.away?.name || '').toLowerCase().replace(/\s+/g, '-')}`,
          name: g.teams?.away?.name,
          logo: g.teams?.away?.logo || null,
        },
        venue: g.arena?.name || 'TBD',
        status: g.status?.long || 'Scheduled',
        odds: oddsMap[g.id] || null,
      }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message, games: [] }, { status: 500 });
  }
});