import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

const apiFetch = async (endpoint) => {
  const fullUrl = `${BASE_URL}${endpoint}`;
  const res = await fetch(fullUrl, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${fullUrl}`);
  const data = await res.json();
  return data;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch teams and games in parallel - NHL is league 57, try season 2025
    const [teamsData, gamesData] = await Promise.all([
      apiFetch('/teams?league=57&season=2025'),
      apiFetch('/games?league=57&season=2025'),
    ]);

    const teams = teamsData?.response || [];
    const rawGames = gamesData?.response || [];

    // Build apiId -> abbreviation map (use abbr or name slug)
    const teamMap = {};
    teams.forEach(t => {
      if (t.id) {
        // Use abbr if available, otherwise create from name
        const code = t.abbr || t.abbreviation || (t.name ? t.name.split(' ').map(w => w[0]).join('').toUpperCase() : null);
        if (code) teamMap[t.id] = code.toLowerCase();
      }
    });

    // If no teams, return debug info to check structure
    if (teams.length === 0) {
      return Response.json({ 
        games: [], 
        debug: {
          teamsCount: teams.length,
          gamesCount: rawGames.length,
          sampleTeam: teams[0],
          sampleGame: rawGames[0]
        }
      });
    }

    const now = new Date();

    const games = (rawGames || [])
      .map(g => {
        const homeApiId = g.teams?.home?.id;
        const awayApiId = g.teams?.away?.id;
        const homeCode = teamMap[homeApiId];
        const awayCode = teamMap[awayApiId];
        return {
          id: g.id,
          date: g.date,
          homeTeam: {
            id: homeCode ? `nhl-${homeCode}` : null,
            name: g.teams?.home?.name || '',
            logo: g.teams?.home?.logo || null,
          },
          awayTeam: {
            id: awayCode ? `nhl-${awayCode}` : null,
            name: g.teams?.away?.name || '',
            logo: g.teams?.away?.logo || null,
          },
          venue: g.venue?.name || 'TBD',
          status: g.status?.short || 'NS',
        };
      });

    return Response.json({ games }, {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});