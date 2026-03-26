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

    const gamesData = await apiFetch(`/games?league=57&season=${season}`);
    const rawGames = gamesData?.response || [];

    // Map team name -> abbreviation directly — no dependency on /teams API
    const nhlAbbreviations = {
      'Boston Bruins': 'bos', 'New York Rangers': 'nyr', 'Toronto Maple Leafs': 'tor', 'Montreal Canadiens': 'mtl',
      'Pittsburgh Penguins': 'pit', 'Chicago Blackhawks': 'chi', 'Los Angeles Kings': 'lak', 'Edmonton Oilers': 'edm',
      'Tampa Bay Lightning': 'tbl', 'Colorado Avalanche': 'col', 'Florida Panthers': 'fla', 'Dallas Stars': 'dal',
      'Washington Capitals': 'wsh', 'Philadelphia Flyers': 'phi', 'New Jersey Devils': 'njd', 'New York Islanders': 'nyi',
      'Carolina Hurricanes': 'car', 'Columbus Blue Jackets': 'cbj', 'Minnesota Wild': 'min', 'Nashville Predators': 'nsh',
      'St. Louis Blues': 'stl', 'Winnipeg Jets': 'wpg', 'Utah Hockey Club': 'uta', 'San Jose Sharks': 'sjs',
      'Anaheim Ducks': 'ana', 'Calgary Flames': 'cgy', 'Vancouver Canucks': 'van', 'Vegas Golden Knights': 'vgk',
      'Seattle Kraken': 'sea', 'Ottawa Senators': 'ott', 'Buffalo Sabres': 'buf', 'Detroit Red Wings': 'det',
    };

    const teamNameToId = (name) => {
      if (!name) return null;
      const abbr = nhlAbbreviations[name];
      if (abbr) return `nhl-${abbr}`;
      // Fallback: slugify the name
      return `nhl-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    };

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

    // Build odds map: gameId -> { homeMoneyline, awayMoneyline, spread, overUnder }
    const oddsMap = {};
    oddsResults.forEach(oddsData => {
      const item = oddsData?.response?.[0];
      if (!item) return;
      const gameId = item.game?.id;
      if (!gameId) return;
      for (const bookmaker of (item.bookmakers || [])) {
        const bets = bookmaker.bets || [];
        // "Home/Away" = 2-way moneyline; "3Way Result" includes draw
        const ml = bets.find(b => b.name === 'Home/Away') || bets.find(b => b.name === '3Way Result');
        // "Asian Handicap" = puck line spread; "Over/Under" = total goals
        const spreadBet = bets.find(b => b.name === 'Asian Handicap');
        const ouBet = bets.find(b => b.name === 'Over/Under');
        if (!ml) continue;
        const mlVals = ml.values || [];
        const homeOdd = mlVals.find(v => v.value === 'Home')?.odd;
        const awayOdd = mlVals.find(v => v.value === 'Away')?.odd;
        if (homeOdd || awayOdd) {
          // Extract spread: look for "Home +1.5" style value, grab the handicap number
          const spreadVals = spreadBet?.values || [];
          const homeSpreadVal = spreadVals.find(v => v.value?.startsWith('Home'));
          const spreadNum = homeSpreadVal?.value?.match(/([+-]?\d+\.?\d*)/)?.[1] || null;

          // Extract over/under: find the "Over X.5" value
          const ouVals = ouBet?.values || [];
          const overVal = ouVals.find(v => v.value?.startsWith('Over'));
          const ouNum = overVal?.value?.match(/([+-]?\d+\.?\d*)/)?.[1] || null;

          oddsMap[gameId] = {
            homeMoneyline: fmtOdd(homeOdd),
            awayMoneyline: fmtOdd(awayOdd),
            spread: spreadNum,
            overUnder: ouNum,
          };
          break;
        }
      }
    });

    const games = upcomingRaw.map(g => ({
      id: g.id,
      date: g.date,
      homeTeam: {
        id: teamNameToId(g.teams?.home?.name),
        name: g.teams?.home?.name || '',
        logo: g.teams?.home?.logo || null,
      },
      awayTeam: {
        id: teamNameToId(g.teams?.away?.name),
        name: g.teams?.away?.name || '',
        logo: g.teams?.away?.logo || null,
      },
      venue: g.venue?.name || 'TBD',
      status: g.status?.short || 'NS',
      odds: oddsMap[g.id] || null,
    }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});