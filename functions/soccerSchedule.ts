import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('Sports_API_Key');

const LEAGUE_CONFIG = {
  'Premier League': { leagueId: 39 },
  'La Liga': { leagueId: 140 },
  'Serie A': { leagueId: 135 },
  'Bundesliga': { leagueId: 78 },
  'MLS': { leagueId: 218 },
};

const apiFetch = async (endpoint) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });
  if (!res.ok) {
    console.error(`API error: ${res.status}`);
    return null;
  }
  return res.json();
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

    if (!league || !LEAGUE_CONFIG[league]) {
      return Response.json({ error: 'Invalid league' }, { status: 400 });
    }

    const config = LEAGUE_CONFIG[league];
    const now = new Date();
    const season = now.getFullYear();

    // Fetch games for current season
    const data = await apiFetch(`/fixtures?league=${config.leagueId}&season=${season}`);

    if (!data || !data.response) {
      return Response.json({ games: [] });
    }

    // Filter for future games and parse into standardized format
    const games = data.response
      .filter(game => new Date(game.fixture.date) > now)
      .map(game => {
        const homeTeamName = game.teams.home.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const awayTeamName = game.teams.away.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const odds = game.odds?.[0];
        
        return {
          id: game.fixture.id,
          date: new Date(game.fixture.date),
          homeTeam: {
            id: `${league.toLowerCase().replace(/\s+/g, '-')}-${homeTeamName}`,
            name: game.teams.home.name,
            logo: game.teams.home.logo,
          },
          awayTeam: {
            id: `${league.toLowerCase().replace(/\s+/g, '-')}-${awayTeamName}`,
            name: game.teams.away.name,
            logo: game.teams.away.logo,
          },
          venue: game.fixture.venue?.name || 'TBD',
          status: game.fixture.status?.long || 'Scheduled',
          odds: odds ? {
            bookmaker: odds.bookmaker?.name,
            home: odds.values?.find(v => v.odd === '1')?.value,
            draw: odds.values?.find(v => v.odd === 'X')?.value,
            away: odds.values?.find(v => v.odd === '2')?.value,
          } : null,
        };
      });

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});