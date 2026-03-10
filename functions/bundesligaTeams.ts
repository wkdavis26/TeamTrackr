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

    // Fetch teams for Bundesliga (league ID 78)
    const data = await apiFetch('/teams?league=78&season=2025');

    if (!data || !data.response) {
      return Response.json({ teams: [] });
    }

    const teams = data.response.map(item => {
      const teamName = item.team.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return {
        id: `bundesliga-${teamName}`,
        name: item.team.name,
        abbreviation: teamName,
        logo: item.team.logo || null,
      };
    });

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message, teams: [] }, { status: 500 });
  }
});