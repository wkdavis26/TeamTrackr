import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.basketball.api-sports.io';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const season = now.getFullYear();
    const res = await fetch(`${BASE_URL}/teams?league=12&season=${season}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    if (!res.ok) return Response.json({ teams: [] });
    const data = await res.json();

    const teams = (data.response || []).map(t => ({
      id: `wnba-${(t.code || t.name || '').toLowerCase().replace(/\s+/g, '-')}`,
      name: t.name,
      abbreviation: t.code || t.name,
      logo: t.logo || null,
      color: null,
    }));

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message, teams: [] }, { status: 500 });
  }
});