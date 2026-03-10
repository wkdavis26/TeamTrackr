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

    const season = 2024; // most recent completed NFL season
    const data = await apiFetch(`/standings?league=1&season=${season}`);
    const raw = data.response || [];

    // api-sports standings shape: [{ team: {id, name, logo, code}, ...stats }]
    const standings = raw.map(entry => ({
      teamId: `nfl-${(entry.team?.code || '').toLowerCase()}`,
      teamName: entry.team?.name || '',
      teamLogo: entry.team?.logo || null,
      apiTeamId: entry.team?.id,
      conference: entry.conference || '',
      division: entry.division || '',
      wins: entry.won ?? 0,
      losses: entry.lost ?? 0,
      ties: entry.ties ?? 0,
      winPct: entry.points_for > 0 ? (entry.won / (entry.won + entry.lost + (entry.ties ?? 0))).toFixed(3) : '0.000',
      pointsFor: entry.points_for ?? 0,
      pointsAgainst: entry.points_against ?? 0,
      streak: entry.streak || '',
      rank: entry.position || 0,
    }));

    return Response.json({ standings, season });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});