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

// This function is kept for future use when api-sports has current season data.
// Currently MLB schedule is fetched directly from ESPN in the frontend (sportsApi.js).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Try current year first, fall back to previous year
    const trySeasons = [currentYear, currentYear - 1];
    let allGames = [];

    // Map team name -> MLB abbreviation directly — no /teams API dependency
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

      const seasonGames = rawGames
        .filter(g => new Date(g.date) > liveWindowStart)
        .map(g => ({
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
        }));

      if (seasonGames.length > 0) {
        allGames = seasonGames;
        break;
      }
    }

    return Response.json({ games: allGames }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});