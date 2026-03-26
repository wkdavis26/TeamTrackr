import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v3.football.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) return null;
  return res.json();
};

// International competitions: FIFA World Cup (1), UEFA Euro (4), FIFA Friendlies (667)
const INTL_LEAGUES = [1, 4, 667];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const season = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

    const allData = await Promise.all(
      INTL_LEAGUES.map(id => apiFetch(`/fixtures?league=${id}&season=${season}`).catch(() => null))
    );

    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const nameToSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const games = allData
      .flatMap(d => d?.response || [])
      .filter(g => {
        const d = new Date(g.fixture.date);
        const status = g.fixture.status?.short || '';
        return d > liveWindowStart && !['FT', 'AET', 'PEN', 'PPD', 'CANC', 'ABD', 'PST'].includes(status);
      })
      .map(g => ({
        id: g.fixture.id,
        date: new Date(g.fixture.date),
        homeTeam: {
          id: `international-football-${nameToSlug(g.teams.home.name)}`,
          name: g.teams.home.name,
          logo: g.teams.home.logo || null,
        },
        awayTeam: {
          id: `international-football-${nameToSlug(g.teams.away.name)}`,
          name: g.teams.away.name,
          logo: g.teams.away.logo || null,
        },
        venue: g.fixture.venue?.name || 'TBD',
        status: g.fixture.status?.long || 'Scheduled',
        odds: null,
      }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message, games: [] }, { status: 500 });
  }
});