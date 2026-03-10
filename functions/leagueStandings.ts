import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://api-sports-io.p.rapidapi.com';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-rapidapi-key': Deno.env.get('Sports_API_Key'),
      'x-rapidapi-host': 'api-sports-io.p.rapidapi.com',
    },
  });
  if (!res.ok) return null;
  return res.json();
};

// Map league names to api-sports league IDs and names
const LEAGUE_CONFIG = {
  'NBA': { sport: 'basketball', league: 'nba', season: 2025 },
  'NFL': { sport: 'american-football', league: 'nfl', season: 2025 },
  'NHL': { sport: 'ice-hockey', league: 'nhl', season: 2025 },
  'MLB': { sport: 'baseball', league: 'mlb', season: 2025 },
  'WNBA': { sport: 'basketball', league: 'wnba', season: 2025 },
  'Premier League': { sport: 'football', league: 'premier-league', season: 2025 },
  'La Liga': { sport: 'football', league: 'la-liga', season: 2025 },
  'Serie A': { sport: 'football', league: 'serie-a', season: 2025 },
  'Bundesliga': { sport: 'football', league: 'bundesliga', season: 2025 },
  'MLS': { sport: 'football', league: 'mls', season: 2025 },
  'NCAAF': { sport: 'american-football', league: 'ncaaf', season: 2025 },
  'NCAAB': { sport: 'basketball', league: 'ncaab', season: 2024 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const league = body.league;

    if (!league) {
      return Response.json({ error: 'league parameter required' }, { status: 400 });
    }

    const config = LEAGUE_CONFIG[league];
    if (!config) {
      return Response.json({ standings: [] });
    }

    // Fetch standings from api-sports
    const endpoint = `/${config.sport}/standings?season=${config.season}&league=${config.league}`;
    const data = await apiFetch(endpoint);

    if (!data || !data.response) {
      return Response.json({ standings: [] });
    }

    // Transform api-sports response into ESPN-like format for frontend
    const standings = data.response.map(group => {
      const confName = group.group?.name || group.country?.name || null;
      const entries = (group.standings || []).flatMap((division) => {
        return (division.map((team, rank) => ({
          team: {
            id: team.team?.id,
            abbreviation: team.team?.code || team.team?.name?.substring(0, 3).toUpperCase(),
            displayName: team.team?.name,
            logo: team.team?.logo,
            color: null,
          },
          stats: [
            { name: 'wins', abbreviation: 'W', displayValue: String(team.wins || 0), value: String(team.wins || 0) },
            { name: 'losses', abbreviation: 'L', displayValue: String(team.losses || 0), value: String(team.losses || 0) },
            { name: 'draws', abbreviation: 'D', displayValue: String(team.draws || 0), value: String(team.draws || 0), type: 'draws' },
            { name: 'winPercent', abbreviation: 'PCT', displayValue: team.percentage || '0.000', value: team.percentage || '0.000' },
            { name: 'points', abbreviation: 'PTS', displayValue: String(team.points || 0), value: String(team.points || 0) },
            { name: 'gamesBehind', abbreviation: 'GB', displayValue: String(team.gamesBehind || '—'), value: String(team.gamesBehind || '—') },
            { name: 'otLosses', abbreviation: 'OTL', displayValue: String(team.otLosses || 0), value: String(team.otLosses || 0) },
            { name: 'total', type: 'total', summary: `${team.wins || 0}-${team.losses || 0}` },
          ],
          _confName: confName,
          _divName: group.group?.name || null,
          _divRank: rank + 1,
        })) || []);
      });

      return { confName, entries };
    });

    // Flatten and compute conference/division ranks
    const allEntries = standings.flatMap(s => s.entries.map(e => ({ ...e, _confName: s.confName })));
    
    // Compute conference ranks if applicable
    const confMap = {};
    allEntries.forEach(e => {
      if (e._confName) {
        if (!confMap[e._confName]) confMap[e._confName] = [];
        confMap[e._confName].push(e);
      }
    });
    
    Object.values(confMap).forEach(list => {
      list.sort((a, b) => 
        parseFloat(b.stats?.find(s => s.name === 'points' || s.name === 'wins')?.value ?? 0) -
        parseFloat(a.stats?.find(s => s.name === 'points' || s.name === 'wins')?.value ?? 0)
      );
      list.forEach((e, i) => { e._confRank = i + 1; });
    });

    return Response.json({ standings: allEntries });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});