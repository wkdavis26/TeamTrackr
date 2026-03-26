import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.american-football.api-sports.io';

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

    // NCAA Football league id = 11
    const now = new Date();
    const season = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

    const data = await apiFetch(`/games?league=11&season=${season}`);
    if (!data?.response) return Response.json({ games: [] });

    const nameToSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const games = (data.response || [])
      .filter(g => {
        const d = new Date(g.game?.date?.date + 'T' + (g.game?.date?.time || '12:00') + ':00');
        const status = g.game?.status?.short || '';
        return d > liveWindowStart && !['FT', 'CANC', 'PST'].includes(status);
      })
      .map(g => {
        const dateStr = g.game?.date?.date + 'T' + (g.game?.date?.time || '12:00') + ':00';
        return {
          id: g.game?.id,
          date: dateStr,
          homeTeam: {
            id: `ncaaf-${nameToSlug(g.teams?.home?.name || '')}`,
            name: g.teams?.home?.name,
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: `ncaaf-${nameToSlug(g.teams?.away?.name || '')}`,
            name: g.teams?.away?.name,
            logo: g.teams?.away?.logo || null,
          },
          venue: g.game?.venue?.name || 'TBD',
          status: g.game?.status?.long || 'Scheduled',
          stage: g.game?.stage || '',
        };
      });

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message, games: [] }, { status: 500 });
  }
});