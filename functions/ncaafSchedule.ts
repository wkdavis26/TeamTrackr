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

    // Diagnostic: check what league 2 returns
    const [leaguesData, gamesData2025, gamesData2024] = await Promise.all([
      apiFetch('/leagues'),
      apiFetch('/games?league=2&season=2025'),
      apiFetch('/games?league=2&season=2024'),
    ]);

    const league2 = leaguesData.response?.find(l => l.league?.id === 2);

    return Response.json({
      league2Name: league2?.league?.name,
      games2025: gamesData2025.response?.length,
      games2024: gamesData2024.response?.length,
      errors2025: gamesData2025.errors,
      sampleGame2025: gamesData2025.response?.[0],
      sampleGame2024: gamesData2024.response?.[0],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});