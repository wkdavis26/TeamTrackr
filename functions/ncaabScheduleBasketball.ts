import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.basketball.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`API error ${res.status}:`, text);
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    
    // Fetch NCAA games - try multiple league IDs since NCAA might be different
    let data = null;
    let raw = [];
    
    // Try league 1
    try {
      data = await apiFetch('/games?league=1&season=2025');
      raw = data.response || [];
    } catch (e) {
      // Try without league filter
      data = await apiFetch('/games?season=2025');
      raw = data.response?.filter(g => g.league?.id === 1) || [];
    }

    const games = raw.slice(0, 5) // Debug: show first 5 to see structure
      .filter(g => {
        const gameDate = new Date(g.date);
        return gameDate > now;
      })
      .map(g => ({
        id: g.id,
        date: new Date(g.date),
        homeTeam: {
          id: `ncaab-${g.teams?.home?.code?.toLowerCase() || g.teams?.home?.id}`,
          name: g.teams?.home?.name,
          logo: g.teams?.home?.logo || null,
        },
        awayTeam: {
          id: `ncaab-${g.teams?.away?.code?.toLowerCase() || g.teams?.away?.id}`,
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