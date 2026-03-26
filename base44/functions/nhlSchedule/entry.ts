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

    // NHL season starts in October; use previous year Jan–Sep, current year Oct–Dec
    const _d = new Date();
    const season = _d.getMonth() >= 9 ? _d.getFullYear() : _d.getFullYear() - 1;

    const [teamsData, gamesData] = await Promise.all([
      apiFetch(`/teams?league=57&season=${season}`),
      apiFetch(`/games?league=57&season=${season}`),
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

    const now = new Date();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Filter to upcoming games first, then fetch odds per game in parallel
    const upcomingRaw = rawGames.filter(g => {
      const gameDate = new Date(g.date);
      return !isNaN(gameDate.getTime()) && gameDate > liveWindowStart;
    });

    // Fetch odds for each upcoming game concurrently
    const oddsResults = await Promise.all(
      upcomingRaw.map(g =>
        apiFetch(`/odds?game=${g.id}`).catch(() => null)
      )
    );

    // Build odds map: gameId -> { homeMoneyline, awayMoneyline }
    // NHL API uses "Home/Away" as the moneyline bet name
    const oddsMap = {};
    oddsResults.forEach(oddsData => {
      const item = oddsData?.response?.[0];
      if (!item) return;
      const gameId = item.game?.id;
      if (!gameId) return;
      for (const bookmaker of (item.bookmakers || [])) {
        const bets = bookmaker.bets || [];
        // "Home/Away" = 2-way moneyline (no draw); "3Way Result" includes draw
        const ml = bets.find(b => b.name === 'Home/Away') || bets.find(b => b.name === '3Way Result');
        if (!ml) continue;
        const mlVals = ml.values || [];
        const homeOdd = mlVals.find(v => v.value === 'Home')?.odd;
        const awayOdd = mlVals.find(v => v.value === 'Away')?.odd;
        if (homeOdd || awayOdd) {
          oddsMap[gameId] = {
            homeMoneyline: fmtOdd(homeOdd),
            awayMoneyline: fmtOdd(awayOdd),
          };
          break;
        }
      }
    });

    const games = upcomingRaw
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