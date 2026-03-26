import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v3.football.api-sports.io';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const season = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
    const res = await fetch(`${BASE_URL}/teams?league=254&season=${season}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    if (!res.ok) return Response.json({ teams: [] });
    const data = await res.json();

    const nameToSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const teams = (data.response || []).map(t => ({
      id: `nwsl-${nameToSlug(t.team?.name || '')}`,
      name: t.team?.name,
      abbreviation: t.team?.code || t.team?.name,
      logo: t.team?.logo || null,
      color: null,
    }));

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message, teams: [] }, { status: 500 });
  }
});