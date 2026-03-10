import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('Sports_API_Key');

const apiFetch = async (endpoint) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });
  if (!res.ok) {
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

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const season = month >= 7 ? year : year - 1; // July onwards = new season

    // Fetch Champions League games (league ID 2)
    const data = await apiFetch(`/fixtures?league=2&season=${season}`);

    if (!data || !data.response) {
      return Response.json({ games: [] });
    }

    // Filter for future games
    const futureGames = data.response.filter(game => new Date(game.fixture.date) > now);

    // Parse games into standardized format
    const games = futureGames.map(game => {
      const homeTeamId = `champions-league-${game.teams.home.id}`;
      const awayTeamId = `champions-league-${game.teams.away.id}`;

      return {
        id: game.fixture.id,
        date: new Date(game.fixture.date),
        homeTeam: {
          id: homeTeamId,
          name: game.teams.home.name,
          logo: game.teams.home.logo,
        },
        awayTeam: {
          id: awayTeamId,
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