import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const apiKey = () => Deno.env.get('Sports_API_Key');

const apiFetch = async (baseUrl, endpoint) => {
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'x-apisports-key': apiKey() },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  }
};

// Each league maps to its correct sport-specific base URL and league ID
const LEAGUE_CONFIG = {
  'NHL':            { base: 'https://v1.hockey.api-sports.io',     leagueId: 57  },
  'MLB':            { base: 'https://v1.baseball.api-sports.io',   leagueId: 1   },
  'NBA':            { base: 'https://v1.basketball.api-sports.io', leagueId: 12  },
  'Premier League': { base: 'https://v3.football.api-sports.io',   leagueId: 39  },
  'La Liga':        { base: 'https://v3.football.api-sports.io',   leagueId: 140 },
  'Serie A':        { base: 'https://v3.football.api-sports.io',   leagueId: 135 },
  'Bundesliga':     { base: 'https://v3.football.api-sports.io',   leagueId: 78  },
  'MLS':            { base: 'https://v3.football.api-sports.io',   leagueId: 253 },
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

const normalizeStandings = (data) => {
  const allEntries = [];

  (data.response || []).forEach((stageGroup) => {
    const confName = stageGroup.group?.name || null;
    (stageGroup.standings || []).forEach((standingArray) => {
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
            { name: 'wins',       abbreviation: 'W',   displayValue: String(team.all?.win  || team.all?.wins  || 0) },
            { name: 'losses',     abbreviation: 'L',   displayValue: String(team.all?.lose || team.all?.losses || 0) },
            { name: 'goalsDiff',  abbreviation: 'GD',  displayValue: String(team.goalsDiff || 0) },
            { name: 'points',     abbreviation: 'PTS', displayValue: String(team.points || 0) },
            { name: 'total',      type: 'total',       summary: `${team.all?.win || team.all?.wins || 0}-${team.all?.draw || team.all?.draws || 0}-${team.all?.lose || team.all?.losses || 0}` },
          ],
          _confName: confName,
          _divRank: rank + 1,
        });
      });
    });
  });

  return allEntries;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const league = body.league;

    if (!league) return Response.json({ error: 'league parameter required' }, { status: 400 });

    const config = LEAGUE_CONFIG[league];
    if (!config) return Response.json({ standings: [] });

    const season = getCurrentSeason(league);
    const data = await apiFetch(config.base, `/standings?league=${config.leagueId}&season=${season}`);

    if (!data?.response?.length) {
      return Response.json({ standings: [] });
    }

    return Response.json({ standings: normalizeStandings(data) });
  } catch (error) {
    return Response.json({ error: error.message, standings: [] }, { status: 500 });
  }
});