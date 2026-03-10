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

// Map league names to api-sports league IDs
const LEAGUE_CONFIG = {
  'NHL': { leagueId: 1 },
  'MLB': { leagueId: 1 },
  'Premier League': { leagueId: 39 },
  'La Liga': { leagueId: 140 },
  'Serie A': { leagueId: 135 },
  'Bundesliga': { leagueId: 78 },
  'MLS': { leagueId: 218 },
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

    // Determine sport and season
    const sportMap = {
      'NHL': 'hockey',
      'MLB': 'baseball',
      'Premier League': 'football',
      'La Liga': 'football',
      'Serie A': 'football',
      'Bundesliga': 'football',
      'MLS': 'football',
    };

    const sport = sportMap[league];
    const season = new Date().getFullYear();

    // Fetch standings from api-sports
    const endpoint = `/${sport}/standings?league=${config.leagueId}&season=${season}`;
    const data = await apiFetch(endpoint);

    if (!data || !data.response) {
      return Response.json({ standings: [] });
    }

    // Transform api-sports response into ESPN-like format for frontend
    // api-sports returns array of divisions with teams
    const allEntries = [];
    
    (data.response || []).forEach(divisionGroup => {
      const confName = divisionGroup.group?.name || null;
      const divName = divisionGroup.division?.name || null;
      
      (divisionGroup.standings || []).forEach((team, rank) => {
        allEntries.push({
          team: {
            id: team.team?.id,
            abbreviation: team.team?.code || team.team?.name?.substring(0, 3).toUpperCase(),
            displayName: team.team?.name,
            logo: team.team?.logo,
            color: null,
          },
          stats: [
            { name: 'wins', abbreviation: 'W', displayValue: String(team.win || team.wins || 0), value: String(team.win || team.wins || 0) },
            { name: 'losses', abbreviation: 'L', displayValue: String(team.loss || team.losses || 0), value: String(team.loss || team.losses || 0) },
            { name: 'winPercent', abbreviation: 'PCT', displayValue: team.percentage || '0.000', value: team.percentage || '0.000' },
            { name: 'points', abbreviation: 'PTS', displayValue: String(team.points || 0), value: String(team.points || 0) },
            { name: 'gamesBehind', abbreviation: 'GB', displayValue: String(team.gamesBehind || 0), value: String(team.gamesBehind || 0) },
            { name: 'total', type: 'total', summary: `${team.win || team.wins || 0}-${team.loss || team.losses || 0}` },
          ],
          _confName: confName,
          _divName: divName,
          _divRank: rank + 1,
        });
      });
    });

    // Compute conference ranks
    const confMap = {};
    allEntries.forEach(e => {
      if (e._confName) {
        if (!confMap[e._confName]) confMap[e._confName] = [];
        confMap[e._confName].push(e);
      }
    });
    
    Object.values(confMap).forEach(list => {
      list.sort((a, b) => 
        parseFloat(b.stats?.find(s => s.name === 'wins')?.value ?? 0) -
        parseFloat(a.stats?.find(s => s.name === 'wins')?.value ?? 0)
      );
      list.forEach((e, i) => { e._confRank = i + 1; });
    });

    return Response.json({ standings: allEntries });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});