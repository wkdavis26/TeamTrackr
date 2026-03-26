import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.baseball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${endpoint}`);
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
    const currentYear = now.getFullYear();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const trySeasons = [currentYear, currentYear - 1];
    let allGames = [];

    const mlbAbbreviations = {
      'Arizona Diamondbacks': 'ari', 'Atlanta Braves': 'atl', 'Baltimore Orioles': 'bal', 'Boston Red Sox': 'bos',
      'Chicago Cubs': 'chc', 'Chicago White Sox': 'cws', 'Cincinnati Reds': 'cin', 'Cleveland Guardians': 'cle',
      'Colorado Rockies': 'col', 'Detroit Tigers': 'det', 'Houston Astros': 'hou', 'Kansas City Royals': 'kc',
      'Los Angeles Angels': 'laa', 'Los Angeles Dodgers': 'lad', 'Miami Marlins': 'mia', 'Milwaukee Brewers': 'mil',
      'Minnesota Twins': 'min', 'New York Mets': 'nym', 'New York Yankees': 'nyy', 'Oakland Athletics': 'oak',
      'Athletics': 'oak', 'Philadelphia Phillies': 'phi', 'Pittsburgh Pirates': 'pit', 'San Diego Padres': 'sd',
      'San Francisco Giants': 'sf', 'Seattle Mariners': 'sea', 'St. Louis Cardinals': 'stl', 'Tampa Bay Rays': 'tb',
      'Texas Rangers': 'tex', 'Toronto Blue Jays': 'tor', 'Washington Nationals': 'wsh',
    };

    const mlbTeamNameToId = (name) => {
      if (!name) return null;
      const abbr = mlbAbbreviations[name];
      if (abbr) return `mlb-${abbr}`;
      return `mlb-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    };

    for (const season of trySeasons) {
      const gamesData = await apiFetch(`/games?league=1&season=${season}`);
      const rawGames = gamesData?.response || [];

      const upcomingRaw = rawGames.filter(g => new Date(g.date) > liveWindowStart);

      if (upcomingRaw.length === 0) continue;

      // Fetch odds for each upcoming game concurrently
      const oddsResults = await Promise.all(
        upcomingRaw.map(g => apiFetch(`/odds?game=${g.id}`).catch(() => null))
      );

      // Build odds map: gameId -> odds
      // Strategy: scan all bookmakers and pick the one with the most complete data
      const oddsMap = {};
      oddsResults.forEach(oddsData => {
        const item = oddsData?.response?.[0];
        if (!item) return;
        const gameId = item.game?.id;
        if (!gameId) return;

        let best = null;
        for (const bookmaker of (item.bookmakers || [])) {
          const bets = bookmaker.bets || [];
          const ml = bets.find(b => b.name === 'Home/Away' || b.name === 'Money Line' || b.name === 'Moneyline');
          const spreadBet = bets.find(b => b.name === 'Asian Handicap' || b.name === 'Run Line');
          const ouBet = bets.find(b => b.name === 'Over/Under' || b.name === 'Total');
          if (!ml) continue;
          const mlVals = ml.values || [];
          const homeOdd = mlVals.find(v => v.value === 'Home')?.odd;
          const awayOdd = mlVals.find(v => v.value === 'Away')?.odd;
          if (!homeOdd && !awayOdd) continue;

          const spreadVals = spreadBet?.values || [];
          const homeSpreadVal = spreadVals.find(v => v.value?.startsWith('Home'));
          const spreadNum = homeSpreadVal?.handicap || homeSpreadVal?.value?.match(/([+-]?\d+\.?\d*)/)?.[1] || null;

          const ouVals = ouBet?.values || [];
          const overVal = ouVals.find(v => v.value?.startsWith('Over'));
          const ouNum = overVal?.handicap || overVal?.value?.match(/([+-]?\d+\.?\d*)/)?.[1] || null;

          const candidate = {
            homeMoneyline: fmtOdd(homeOdd),
            awayMoneyline: fmtOdd(awayOdd),
            spread: spreadNum ? String(spreadNum) : null,
            overUnder: ouNum ? String(ouNum) : null,
          };

          // Prefer the bookmaker with the most fields filled in
          const score = (candidate.homeMoneyline ? 1 : 0) + (candidate.awayMoneyline ? 1 : 0) + (candidate.spread ? 1 : 0) + (candidate.overUnder ? 1 : 0);
          const bestScore = best ? (best.homeMoneyline ? 1 : 0) + (best.awayMoneyline ? 1 : 0) + (best.spread ? 1 : 0) + (best.overUnder ? 1 : 0) : -1;
          if (score > bestScore) best = candidate;
          if (score === 4) break; // Can't do better
        }
        if (best) oddsMap[gameId] = best;
      });

      allGames = upcomingRaw.map(g => ({
        id: g.id,
        date: g.date,
        homeTeam: {
          id: mlbTeamNameToId(g.teams?.home?.name),
          name: g.teams?.home?.name || '',
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: mlbTeamNameToId(g.teams?.away?.name),
          name: g.teams?.away?.name || '',
          logo: g.teams?.away?.logo || null,
        },
        venue: g.venue?.name || 'TBD',
        status: g.status?.long || 'Scheduled',
        odds: oddsMap[g.id] || null,
      }));

      break;
    }

    return Response.json({ games: allGames }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});