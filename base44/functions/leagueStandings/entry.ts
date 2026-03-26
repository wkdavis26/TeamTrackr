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
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (e) {
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

    // Use current or previous season based on month (season runs Aug-May)
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const season = month >= 7 ? year : year - 1;

    // Try to fetch standings directly first
    let data = await apiFetch(`/standings?league=${config.leagueId}&season=${season}`);
    
    // If no standings available, derive from fixtures
    if (!data?.response || !Array.isArray(data.response) || data.response.length === 0) {
      const fixturesData = await apiFetch(`/fixtures?league=${config.leagueId}&season=${season}&status=FT`);
      
      if (!fixturesData?.response || fixturesData.response.length === 0) {
        return Response.json({ standings: [] });
      }

      // Build standings from completed fixtures
      const teamStats = {};
      
      fixturesData.response.forEach(fixture => {
        const homeTeam = fixture.teams.home;
        const awayTeam = fixture.teams.away;
        const goals = fixture.goals;
        
        if (!teamStats[homeTeam.id]) {
          teamStats[homeTeam.id] = { 
            team: homeTeam, 
            played: 0, 
            wins: 0, 
            draws: 0, 
            losses: 0, 
            gf: 0, 
            ga: 0, 
            gd: 0, 
            points: 0 
          };
        }
        if (!teamStats[awayTeam.id]) {
          teamStats[awayTeam.id] = { 
            team: awayTeam, 
            played: 0, 
            wins: 0, 
            draws: 0, 
            losses: 0, 
            gf: 0, 
            ga: 0, 
            gd: 0, 
            points: 0 
          };
        }

        const homeStats = teamStats[homeTeam.id];
        const awayStats = teamStats[awayTeam.id];
        
        homeStats.played += 1;
        awayStats.played += 1;
        homeStats.gf += goals.home;
        homeStats.ga += goals.away;
        awayStats.gf += goals.away;
        awayStats.ga += goals.home;

        if (goals.home > goals.away) {
          homeStats.wins += 1;
          homeStats.points += 3;
          awayStats.losses += 1;
        } else if (goals.home < goals.away) {
          awayStats.wins += 1;
          awayStats.points += 3;
          homeStats.losses += 1;
        } else {
          homeStats.draws += 1;
          homeStats.points += 1;
          awayStats.draws += 1;
          awayStats.points += 1;
        }
        
        homeStats.gd = homeStats.gf - homeStats.ga;
        awayStats.gd = awayStats.gf - awayStats.ga;
      });

      // Sort by points then goal difference
      const standings = Object.values(teamStats)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        })
        .map((stat, rank) => ({
          team: {
            id: stat.team.id,
            abbreviation: stat.team.code || stat.team.name.substring(0, 3).toUpperCase(),
            displayName: stat.team.name,
            logo: stat.team.logo,
            color: null,
          },
          stats: [
            { name: 'wins', abbreviation: 'W', displayValue: String(stat.wins), value: String(stat.wins) },
            { name: 'losses', abbreviation: 'L', displayValue: String(stat.losses), value: String(stat.losses) },
            { name: 'winPercent', abbreviation: 'GD', displayValue: String(stat.gd), value: String(stat.gd) },
            { name: 'points', abbreviation: 'PTS', displayValue: String(stat.points), value: String(stat.points) },
            { name: 'total', type: 'total', summary: `${stat.wins}-${stat.draws}-${stat.losses}` },
          ],
          _divRank: rank + 1,
        }));

      return Response.json({ standings });
    }

    // Transform api-sports standings response
    const allEntries = [];
    
    (data.response || []).forEach((stageGroup) => {
      const confName = stageGroup.group?.name || null;
      const divName = stageGroup.group?.name || null;
      
      (stageGroup.standings || []).forEach((standingArray, divIndex) => {
        (standingArray || []).forEach((team, rank) => {
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
              { name: 'winPercent', abbreviation: 'GD', displayValue: String(team.goalsDiff || 0), value: String(team.goalsDiff || 0) },
              { name: 'points', abbreviation: 'PTS', displayValue: String(team.points || 0), value: String(team.points || 0) },
              { name: 'total', type: 'total', summary: `${team.all?.wins || 0}-${team.all?.draws || 0}-${team.all?.losses || 0}` },
            ],
            _confName: confName,
            _divName: divName,
            _divRank: rank + 1,
          });
        });
      });
    });

    return Response.json({ standings: allEntries });
  } catch (error) {
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});