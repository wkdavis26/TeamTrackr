import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.basketball.api-sports.io';

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

    // NCAA Basketball - trying multiple endpoints to find games
    let raw = [];
    const now = new Date();
    
    // Try league 1 (NCAA)
    try {
      const data = await apiFetch('/games?league=1&season=2025');
      if (data.response?.length > 0) {
        raw = data.response;
      }
    } catch (e) {
      console.log('League 1 failed, trying alternative');
    }
    
    // If empty, try fetching all games and filter
    if (raw.length === 0) {
      try {
        const data = await apiFetch('/games?season=2025');
        raw = data.response || [];
      } catch (e) {
        console.log('Season fetch failed');
      }
    }

    const games = raw
      .filter(g => {
        const gameDate = new Date(g.date);
        return gameDate > now;
      })
      .map(g => ({
        id: g.id,
        date: new Date(g.date),
        homeTeam: {
          id: `ncaab-${g.teams?.home?.code?.toLowerCase() || ''}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `ncaab-${g.teams?.away?.code?.toLowerCase() || ''}`,
          name: g.teams?.away?.name,
          logo: g.teams?.away?.logo || null,
        },
        venue: g.venue?.name || 'TBD',
        status: g.status?.long || 'Scheduled',
      }));

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});