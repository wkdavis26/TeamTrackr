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

    const season = 2024;

    // Fetch teams and standings in parallel to build id->code map
    const [teamsData, standingsData] = await Promise.all([
      apiFetch('/teams?league=1&season=2025'),
      apiFetch(`/standings?league=1&season=${season}`),
    ]);

    // Build apiId -> code map from teams list
    const codeMap = {};
    (teamsData.response || []).forEach(t => {
      if (t.id && t.code) codeMap[t.id] = t.code;
    });

    const standings = (standingsData.response || []).map(entry => {
      const apiId = entry.team?.id;
      const code = codeMap[apiId] || '';
      return {
        teamId: code ? `nfl-${code.toLowerCase()}` : null,
        teamName: entry.team?.name || '',
        teamLogo: entry.team?.logo || null,
        apiTeamId: apiId,
        conference: entry.conference || '',
        division: entry.division || '',
        wins: entry.won ?? 0,
        losses: entry.lost ?? 0,
        ties: entry.ties ?? 0,
        rank: entry.position || 0,
      };
    }).filter(s => s.teamId);

    return Response.json({ standings, season });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});