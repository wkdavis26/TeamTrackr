import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.baseball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${endpoint}`);
  return res.json();
};

// This function is kept for future use when api-sports has current season data.
// Currently MLB schedule is fetched directly from ESPN in the frontend (sportsApi.js).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Try current year first, fall back to previous year
    const trySeasons = [currentYear, currentYear - 1];
    let allGames = [];

    for (const season of trySeasons) {
      const [teamsData, gamesData] = await Promise.all([
        apiFetch(`/teams?league=1&season=${season}`),
        apiFetch(`/games?league=1&season=${season}`),
      ]);

      const teams = teamsData?.response || [];
      const rawGames = gamesData?.response || [];

      const codeMap = {};
      teams.forEach(t => {
        if (t.id && t.code) codeMap[t.id] = t.code;
      });

      const seasonGames = rawGames
        .filter(g => new Date(g.date) > liveWindowStart)
        .map(g => {
          const homeCode = codeMap[g.teams?.home?.id];
          const awayCode = codeMap[g.teams?.away?.id];
          return {
            id: g.id,
            date: g.date,
            homeTeam: {
              id: homeCode ? `mlb-${homeCode.toLowerCase()}` : null,
              name: g.teams?.home?.name || '',
              logo: g.teams?.home?.logo || null,
            },
            awayTeam: {
              id: awayCode ? `mlb-${awayCode.toLowerCase()}` : null,
              name: g.teams?.away?.name || '',
              logo: g.teams?.away?.logo || null,
            },
            venue: g.venue?.name || 'TBD',
            status: g.status?.long || 'Scheduled',
          };
        })
        .filter(g => g.homeTeam.id && g.awayTeam.id);

      if (seasonGames.length > 0) {
        allGames = seasonGames;
        break;
      }
    }

    return Response.json({ games: allGames }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});