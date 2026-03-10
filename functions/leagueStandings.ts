import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://v3.football.api-sports.io';

const apiFetch = async (endpoint) => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const apiKey = Deno.env.get('Sports_API_Key');
    const res = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      return null;
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
    return null;
  }
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

    const season = new Date().getFullYear();

    // Fetch standings from api-sports
    const endpoint = `/standings?league=${config.leagueId}&season=${season}`;
    const data = await apiFetch(endpoint);

    if (!data?.response) {
      // Return empty if API doesn't have data
      return Response.json({ standings: [] });
    }

    // Transform api-sports response into ESPN-like format for frontend
    const allEntries = [];
    
    (data.response || []).forEach(divisionGroup => {
      const confName = divisionGroup.group?.name || null;
      const divName = divisionGroup.group?.name || null;
      
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
            { name: 'wins', abbreviation: 'W', displayValue: String(team.all?.wins || 0), value: String(team.all?.wins || 0) },
            { name: 'losses', abbreviation: 'L', displayValue: String(team.all?.losses || 0), value: String(team.all?.losses || 0) },
            { name: 'winPercent', abbreviation: 'PCT', displayValue: (team.goalsDiff !== undefined ? team.goalsDiff : 0).toString(), value: String(team.goalsDiff || 0) },
            { name: 'points', abbreviation: 'PTS', displayValue: String(team.points || 0), value: String(team.points || 0) },
            { name: 'gamesBehind', abbreviation: 'GB', displayValue: '0', value: '0' },
            { name: 'total', type: 'total', summary: `${team.all?.wins || 0}-${team.all?.losses || 0}` },
          ],
          _confName: confName,
          _divName: divName,
          _divRank: rank + 1,
        });
      });
    });

    return Response.json({ standings: allEntries });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});