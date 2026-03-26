import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const apiKey = () => Deno.env.get('Sports_API_Key');

const apiFetch = async (baseUrl, endpoint) => {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey() },
  });
  return res.json();
};

// Each league maps to its correct sport-specific base URL, league ID, and response type
// type 'football' = response[0].league.standings[][] (soccer)
// type 'flat'     = response[] flat array of team objects (hockey/baseball)
// type 'nba'      = response[] from v2.nba.api-sports.io (different schema)
const LEAGUE_CONFIG = {
  'NHL':            { base: 'https://v1.hockey.api-sports.io',     leagueId: 57,  type: 'flat'     },
  'MLB':            { base: 'https://v1.baseball.api-sports.io',   leagueId: 1,   type: 'baseball' },
  'NBA':            { base: 'https://v2.nba.api-sports.io',        leagueId: 12,  type: 'nba'      },
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

  if (type === 'flat') {
    // NHL: response is array of arrays (groups), each containing team objects
    // Each group represents a division; team.won / team.lost / team.points are direct fields
    const groups = (data.response || []);
    const allTeams = [];
    groups.forEach((group) => {
      const groupTeams = Array.isArray(group) ? group : [group];
      groupTeams.forEach((team) => {
        allTeams.push({
          team: {
            id: team.team?.id,
            abbreviation: team.team?.name?.split(' ').pop()?.substring(0, 3).toUpperCase(),
            displayName: team.team?.name,
            logo: team.team?.logo,
            color: null,
          },
          stats: [
            { name: 'wins',   abbreviation: 'W',   displayValue: String(team.won  ?? 0) },
            { name: 'losses', abbreviation: 'L',   displayValue: String(team.lost ?? 0) },
            { name: 'otLosses', abbreviation: 'OTL', displayValue: String(team.games_ot ?? team.ot ?? 0) },
            { name: 'points', abbreviation: 'PTS', displayValue: String(team.points ?? 0) },
          ],
          _confName: team.group?.name || null,
          _divName: team.group?.name || null,
          _divRank: team.position || 0,
        });
      });
    });

    // Compute conference ranks and pts-back based on conference grouping
    const confGroups = {};
    allTeams.forEach(t => {
      const conf = t._confName || 'Unknown';
      if (!confGroups[conf]) confGroups[conf] = [];
      confGroups[conf].push(t);
    });
    Object.values(confGroups).forEach(list => {
      list.sort((a, b) => parseInt(b.stats.find(s => s.name === 'points')?.displayValue || 0) - parseInt(a.stats.find(s => s.name === 'points')?.displayValue || 0));
      const leaderPts = parseInt(list[0]?.stats.find(s => s.name === 'points')?.displayValue || 0);
      list.forEach((t, i) => {
        t._confRank = i + 1;
        const myPts = parseInt(t.stats.find(s => s.name === 'points')?.displayValue || 0);
        t._confPtsBack = leaderPts - myPts;
      });
    });

    // Compute division pts-back — group by _divName, sort by points
    const divGroups = {};
    allTeams.forEach(t => {
      const div = t._divName || 'Unknown';
      if (!divGroups[div]) divGroups[div] = [];
      divGroups[div].push(t);
    });
    Object.values(divGroups).forEach(list => {
      list.sort((a, b) => parseInt(b.stats.find(s => s.name === 'points')?.displayValue || 0) - parseInt(a.stats.find(s => s.name === 'points')?.displayValue || 0));
      const leaderPts = parseInt(list[0]?.stats.find(s => s.name === 'points')?.displayValue || 0);
      list.forEach((t, i) => {
        if (!t._divRank) t._divRank = i + 1;
        const myPts = parseInt(t.stats.find(s => s.name === 'points')?.displayValue || 0);
        t._divPtsBack = leaderPts - myPts;
      });
    });

    return allTeams;
  }

  if (type === 'baseball') {
    // MLB: response is flat array, stats are under team.games.win/lose
    const flatTeams = (data.response || []).flat();
    return flatTeams.map((team, rank) => {
      const wins = team.games?.win?.total ?? 0;
      const losses = team.games?.lose?.total ?? 0;
      const pct = team.games?.win?.percentage ?? '0.000';
      return {
        team: {
          id: team.team?.id,
          abbreviation: team.team?.name?.split(' ').pop()?.substring(0, 3).toUpperCase(),
          displayName: team.team?.name,
          logo: team.team?.logo,
          color: null,
        },
        stats: [
          { name: 'wins',   abbreviation: 'W',   displayValue: String(wins) },
          { name: 'losses', abbreviation: 'L',   displayValue: String(losses) },
          { name: 'pct',    abbreviation: 'PCT', displayValue: String(pct) },
        ],
        _confName: team.group?.name || null,
        _divRank: team.position || rank + 1,
      };
    });
  }

  if (type === 'nba') {
    // NBA via v2.nba.api-sports.io
    // Schema: entry.team, entry.win.total, entry.loss.total, entry.win.percentage, entry.conference.name/rank
    const flatTeams = (data.response || []).flat();
    return flatTeams.map((entry) => ({
      team: {
        id: entry.team?.id,
        abbreviation: entry.team?.code,
        displayName: entry.team?.name,
        logo: entry.team?.logo,
        color: null,
      },
      stats: [
        { name: 'wins',   abbreviation: 'W',   displayValue: String(entry.win?.total ?? 0) },
        { name: 'losses', abbreviation: 'L',   displayValue: String(entry.loss?.total ?? 0) },
        { name: 'pct',    abbreviation: 'PCT', displayValue: String(entry.win?.percentage ?? '0.000') },
      ],
      _confName: entry.conference?.name ? entry.conference.name.charAt(0).toUpperCase() + entry.conference.name.slice(1) : null,
      _divRank: entry.conference?.rank ?? 0,
    }));
  }

  return [];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const league = body.league;

    if (!league) return Response.json({ error: 'league parameter required' }, { status: 400 });

    const config = LEAGUE_CONFIG[league];
    if (!config) return Response.json({ standings: [] });

    const season = getCurrentSeason(league);
    // NBA uses v2.nba.api-sports.io which requires league=standard (not a numeric league ID)
    const endpoint = config.type === 'nba'
      ? `/standings?league=standard&season=${season}`
      : `/standings?league=${config.leagueId}&season=${season}`;
    const data = await apiFetch(config.base, endpoint);

    const standings = normalizeStandings(data, config.type);
    return Response.json({ standings });
  } catch (error) {
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});