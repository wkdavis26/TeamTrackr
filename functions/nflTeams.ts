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

// NFL team ID 1-32 are the 32 NFL teams (no "All-Stars" or national teams)
// We'll fetch all and filter by country=USA + known NFL team IDs (1-32)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await apiFetch('/teams?league=1&season=2025');
    const raw = data.response || [];

    const teams = raw
      .filter(t => t.name && t.code && t.country?.code === 'US')
      .map(t => ({
        id: `nfl-${t.code.toLowerCase()}`,
        name: t.name,
        abbreviation: t.code,
        logo: t.logo || null,
        apiId: t.id,
      }));

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});