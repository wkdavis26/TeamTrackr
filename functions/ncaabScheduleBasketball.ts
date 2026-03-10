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
    
    // Try fetching NCAA games - league 1 is NCAA basketball
    let data = await apiFetch('/games?league=1&season=2025');
    console.log('NCAA API response:', data.response?.length || 0, 'games');
    let raw = data.response || [];

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

    console.log('Returning', games.length, 'filtered games');
    return Response.json({ games });
  } catch (error) {
    console.log('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});