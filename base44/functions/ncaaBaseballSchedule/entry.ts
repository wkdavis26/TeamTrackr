import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.baseball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) return null;
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // NCAA Baseball league id = 103
    const LEAGUE_ID = 103;
    const now = new Date();
    const season = now.getFullYear();

    const data = await apiFetch(`/games?league=${LEAGUE_ID}&season=${season}`);
    if (!data?.response) return Response.json({ games: [] });

    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const nameToSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const games = (data.response || [])
      .filter(g => {
        const d = new Date(g.date);
        const status = g.status?.short || '';
        return d > liveWindowStart && !['FT', 'CANC', 'PST', 'PPD'].includes(status);
      })
      .map(g => ({
        id: g.id,
        date: new Date(g.date),
        homeTeam: {
          id: `ncaab-baseball-${nameToSlug(g.teams?.home?.name || '')}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `ncaab-baseball-${nameToSlug(g.teams?.away?.name || '')}`,
          name: g.teams?.away?.name,
          logo: g.teams?.away?.logo || null,
        },
        venue: g.venue?.name || 'TBD',
        status: g.status?.long || 'Scheduled',
        odds: null,
      }));

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message, games: [] }, { status: 500 });
  }
});