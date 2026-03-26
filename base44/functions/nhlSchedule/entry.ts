import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${BASE_URL}${endpoint}`);
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

    // NHL season starts in October; use previous year Jan–Sep, current year Oct–Dec
    const _d = new Date();
    const season = _d.getMonth() >= 9 ? _d.getFullYear() : _d.getFullYear() - 1;

    const [teamsData, gamesData, oddsToday, oddsTomorrow, oddsDayAfter] = await Promise.all([
      apiFetch(`/teams?league=57&season=${season}`),
      apiFetch(`/games?league=57&season=${season}`),
      apiFetch(`/odds?league=57&season=${season}&bookmaker=8&date=${today}`).catch(() => null),
      apiFetch(`/odds?league=57&season=${season}&bookmaker=8&date=${tomorrow}`).catch(() => null),
      apiFetch(`/odds?league=57&season=${season}&bookmaker=8&date=${dayAfter}`).catch(() => null),
    ]);

    const teams = teamsData?.response || [];
    const rawGames = gamesData?.response || [];

    const nhlAbbreviations = {
      'Boston Bruins': 'BOS', 'New York Rangers': 'NYR', 'Toronto Maple Leafs': 'TOR', 'Montreal Canadiens': 'MTL',
      'Pittsburgh Penguins': 'PIT', 'Chicago Blackhawks': 'CHI', 'Los Angeles Kings': 'LAK', 'Edmonton Oilers': 'EDM',
      'Tampa Bay Lightning': 'TBL', 'Colorado Avalanche': 'COL', 'Florida Panthers': 'FLA', 'Dallas Stars': 'DAL',
      'Washington Capitals': 'WSH', 'Philadelphia Flyers': 'PHI', 'New Jersey Devils': 'NJD', 'New York Islanders': 'NYI',
      'Carolina Hurricanes': 'CAR', 'Columbus Blue Jackets': 'CBJ', 'Minnesota Wild': 'MIN', 'Nashville Predators': 'NSH',
      'St. Louis Blues': 'STL', 'Winnipeg Jets': 'WPG', 'Utah Hockey Club': 'UTA', 'San Jose Sharks': 'SJS',
      'Anaheim Ducks': 'ANA', 'Calgary Flames': 'CGY', 'Vancouver Canucks': 'VAN', 'Vegas Golden Knights': 'VGK',
      'Seattle Kraken': 'SEA', 'Ottawa Senators': 'OTT', 'Buffalo Sabres': 'BUF', 'Detroit Red Wings': 'DET',
    };

    const teamMap = {};
    teams.forEach(t => {
      if (t.id && t.name) {
        const abbr = nhlAbbreviations[t.name] || t.abbreviation || t.code || t.name.substring(0, 3).toLowerCase();
        if (abbr) teamMap[t.id] = abbr.toLowerCase();
      }
    });

    // Build odds map: gameId -> { homeMoneyline, awayMoneyline }
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

    const now = new Date();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const games = rawGames
      .filter(g => {
        const gameDate = new Date(g.date);
        return !isNaN(gameDate.getTime()) && gameDate > liveWindowStart;
      })
      .map(g => {
        const homeCode = teamMap[g.teams?.home?.id];
        const awayCode = teamMap[g.teams?.away?.id];
        return {
          id: g.id,
          date: g.date,
          homeTeam: {
            id: homeCode ? `nhl-${homeCode}` : null,
            name: g.teams?.home?.name || '',
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: awayCode ? `nhl-${awayCode}` : null,
            name: g.teams?.away?.name || '',
            logo: g.teams?.away?.logo || null,
          },
          venue: g.venue?.name || 'TBD',
          status: g.status?.short || 'NS',
          odds: oddsMap[g.id] || null,
        };
      })
      .filter(g => g.homeTeam.id && g.awayTeam.id);

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});