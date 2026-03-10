import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.american-football.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const year = new Date().getFullYear();
    let data = await apiFetch(`/teams?league=1&season=${year}`);
    if (!data.response?.length) {
      data = await apiFetch(`/teams?league=1&season=${year - 1}`);
    }

    // Debug: return the raw first entry to inspect the shape
    const sample = data.response?.[0];

    const teams = (data.response || [])
      .filter(entry => entry.team && entry.team.name)
      .map(entry => {
        const team = entry.team;
        return {
          id: `nfl-${(team.code || team.name).toLowerCase().replace(/\s+/g, '-')}`,
          name: team.name,
          abbreviation: team.code || '',
          logo: team.logo || null,
        };
      });

    return Response.json({ teams, sample });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});