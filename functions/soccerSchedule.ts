import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://api-sports-io.p.rapidapi.com';
const API_KEY = Deno.env.get('Sports_API_Key');

const LEAGUE_CONFIG = {
  'Premier League': { leagueId: 39, country: 'GB' },
  'La Liga': { leagueId: 140, country: 'ES' },
  'Serie A': { leagueId: 135, country: 'IT' },
  'Bundesliga': { leagueId: 78, country: 'DE' },
  'MLS': { leagueId: 218, country: 'US' },
};

const apiFetch = async (endpoint) => {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'api-sports-io.p.rapidapi.com',
    },
  });
  if (!res.ok) return null;
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
    const data = await apiFetch(`/football/fixtures?league=${config.leagueId}&season=${season}`);

    if (!data || !data.response) {
      return Response.json({ games: [] });
    }

    // Filter for future games and parse into standardized format
    const games = data.response
      .filter(game => new Date(game.fixture.date) > now)
      .map(game => {
        const homeTeamName = game.teams.home.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const awayTeamName = game.teams.away.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
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
        };
      });

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});