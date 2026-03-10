import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v2.nba.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=12'),
      apiFetch('/games?league=12&season=2025-2026'),
    ]);

    const teams = teamsData.response || [];
    const games = gamesData.response || [];

    return Response.json({
      teamsCount: teams.length,
      sampleTeam: teams[0],
      gamesCount: games.length,
      sampleGame: games[0],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});