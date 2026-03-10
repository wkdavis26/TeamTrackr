import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

const apiFetch = async (endpoint) => {
  const fullUrl = `${BASE_URL}${endpoint}`;
  const res = await fetch(fullUrl, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${fullUrl}`);
  const data = await res.json();
  return data;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch teams and games in parallel - NHL is league 57, try season 2025
    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=57&season=2025'),
      apiFetch('/games?league=57&season=2025'),
    ]);

    const teams = teamsData?.response || [];
    const rawGames = gamesData?.response || [];

    console.log('[NHL] Sample team:', JSON.stringify(teams[0]));
    console.log('[NHL] Sample game:', JSON.stringify(rawGames[0]));

    // Build apiId -> abbreviation map using proper NHL abbreviations
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
         if (abbr) {
           teamMap[t.id] = abbr.toLowerCase();
         }
       }
     });



    const now = new Date();

    const games = (rawGames || [])
      .filter(g => {
        // Only include upcoming games (after now - 4 hour window)
        const gameDate = new Date(g.date);
        if (isNaN(gameDate.getTime())) return false;
        const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        return gameDate > liveWindowStart;
      })
      .map(g => {
        const homeApiId = g.teams?.home?.id;
        const awayApiId = g.teams?.away?.id;
        const homeCode = teamMap[homeApiId];
        const awayCode = teamMap[awayApiId];
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
        };
      })
      .filter(g => g.homeTeam.id && g.awayTeam.id);

    return Response.json({ 
      games,
      debug: { teamsCount: teams.length, gamesCount: rawGames.length, teamMapSize: Object.keys(teamMap).length }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});