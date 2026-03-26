import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const apiKey = () => Deno.env.get('Sports_API_Key');

const apiFetch = async (baseUrl, endpoint) => {
  const url = `${baseUrl}${endpoint}`;
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey() },
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Response keys:', Object.keys(json));
  console.log('Response errors:', JSON.stringify(json.errors));
  console.log('Response results:', json.results);
  return json;
};

// Each league maps to its correct sport-specific base URL, league ID, and response type
// type 'football' = response[0].league.standings[][]
// type 'flat'     = response[] (flat array of team objects, used by hockey/baseball/basketball)
const LEAGUE_CONFIG = {
  'NHL':            { base: 'https://v1.hockey.api-sports.io',     leagueId: 57,  type: 'flat'     },
  'MLB':            { base: 'https://v1.baseball.api-sports.io',   leagueId: 1,   type: 'flat'     },
  'NBA':            { base: 'https://v1.basketball.api-sports.io', leagueId: 12,  type: 'flat'     },
  'Premier League': { base: 'https://v3.football.api-sports.io',   leagueId: 39,  type: 'football' },
  'La Liga':        { base: 'https://v3.football.api-sports.io',   leagueId: 140, type: 'football' },
  'Serie A':        { base: 'https://v3.football.api-sports.io',   leagueId: 135, type: 'football' },
  'Bundesliga':     { base: 'https://v3.football.api-sports.io',   leagueId: 78,  type: 'football' },
  'MLS':            { base: 'https://v3.football.api-sports.io',   leagueId: 253, type: 'football' },
};

const getCurrentSeason = (league) => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  if (['NHL', 'NBA'].includes(league)) {
    // Seasons run Oct–Jun; season "2025" means 2025-26
    return month >= 9 ? year : year - 1;
  }
  if (league === 'MLB') {
    // Season runs Mar–Oct
    return year;
  }
  // Soccer: season runs Aug–May
  return month >= 7 ? year : year - 1;
};

const normalizeStandings = (data, type) => {
  if (type === 'football') {
    // response[0].league.standings is an array of groups, each group is an array of teams
    const allEntries = [];
    const leagueData = data.response?.[0]?.league;
    (leagueData?.standings || []).forEach((group) => {
      (group || []).forEach((team, rank) => {
        allEntries.push({
          team: {
            id: team.team?.id,
            abbreviation: team.team?.name?.substring(0, 3).toUpperCase(),
            displayName: team.team?.name,
            logo: team.team?.logo,
            color: null,
          },
          stats: [
            { name: 'wins',      abbreviation: 'W',   displayValue: String(team.all?.win  || 0) },
            { name: 'draws',     abbreviation: 'D',   displayValue: String(team.all?.draw || 0) },
            { name: 'losses',    abbreviation: 'L',   displayValue: String(team.all?.lose || 0) },
            { name: 'goalsDiff', abbreviation: 'GD',  displayValue: String(team.goalsDiff || 0) },
            { name: 'points',    abbreviation: 'PTS', displayValue: String(team.points || 0) },
          ],
          _confName: team.group || null,
          _divRank: team.rank || rank + 1,
        });
      });
    });
    return allEntries;
  }

  // 'flat': response is array of arrays (groups), each containing team objects (NHL, MLB, NBA)
  const flatTeams = (data.response || []).flat();
  return flatTeams.map((team, rank) => ({
    team: {
      id: team.team?.id,
      abbreviation: team.team?.name?.substring(0, 3).toUpperCase(),
      displayName: team.team?.name,
      logo: team.team?.logo,
      color: null,
    },
    stats: [
      { name: 'wins',   abbreviation: 'W',   displayValue: String(team.games?.win?.total  || team.won  || 0) },
      { name: 'losses', abbreviation: 'L',   displayValue: String(team.games?.lose?.total || team.lost || 0) },
      { name: 'points', abbreviation: 'PTS', displayValue: String(team.points || 0) },
    ],
    _confName: team.group?.name || null,
    _divRank: team.position || rank + 1,
  }));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    // Allow test calls without auth in dev
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const league = body.league;

    if (!league) return Response.json({ error: 'league parameter required' }, { status: 400 });

    const config = LEAGUE_CONFIG[league];
    if (!config) return Response.json({ standings: [] });

    const season = getCurrentSeason(league);
    const data = await apiFetch(config.base, `/standings?league=${config.leagueId}&season=${season}`);

    if (config.type === 'flat') {
      return Response.json({ _debug_structure: (data?.response || []).flat()[0], _results: data?.results, _errors: data?.errors, _responseLength: data?.response?.length });
    }
    const standings = normalizeStandings(data, config.type);
    return Response.json({ standings });

    return Response.json({ standings: normalizeStandings(data) });
  } catch (error) {
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});