import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://api-sports-io.p.rapidapi.com';
const API_KEY = Deno.env.get('Sports_API_Key');

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

    const now = new Date();
    const season = now.getFullYear();

    // Fetch games for current season
    const data = await apiFetch(`/hockey/games?season=${season}&league=1`);

    if (!data || !data.response) {
      return Response.json({ games: [] });
    }

    // Filter for future games and parse into standardized format
    const games = data.response
      .filter(game => new Date(game.date) > now)
      .map(game => ({
        id: game.id,
        date: new Date(game.date),
        homeTeam: {
          id: `nhl-${game.teams.home.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: game.teams.home.name,
          logo: game.teams.home.logo,
        },
        awayTeam: {
          id: `nhl-${game.teams.away.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: game.teams.away.name,
          logo: game.teams.away.logo,
        },
        venue: game.venue?.name || 'TBD',
        status: game.status?.long || 'Scheduled',
      }));

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});