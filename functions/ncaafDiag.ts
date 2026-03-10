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

    // Check 2026 season data
    const data = await apiFetch('/games?league=2&season=2026');
    const games = data.response || [];
    
    // Find Notre Dame game
    const ndGame = games.find(g => 
      g.teams?.home?.name?.includes('Notre Dame') || 
      g.teams?.away?.name?.includes('Notre Dame')
    );

    return Response.json({
      total2026: games.length,
      ndGame,
      sample: games.slice(0, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});