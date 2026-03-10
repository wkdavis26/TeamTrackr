import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v2.nba.api-sports.io';

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

    const data = await apiFetch('/teams');
    const raw = data.response || [];

    // Only include real NBA franchises with a standard league entry
    const teams = raw
      .filter(t => t.nbaFranchise && t.leagues?.standard && t.code)
      .map(t => ({
        id: `nba-${t.code.toLowerCase()}`,
        name: t.name,
        abbreviation: t.code,
        city: t.city,
        logo: t.logo || null,
        color: null,
        conference: t.leagues?.standard?.conference || null,
        division: t.leagues?.standard?.division || null,
      }));

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});