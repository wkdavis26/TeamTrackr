import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.formula-1.api-sports.io';

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

    const year = new Date().getFullYear();
    const data = await apiFetch(`/races?season=${year}`);

    const sessions = (data.response || []).map(race => ({
      id: race.id,
      competitionName: race.competition?.name || 'Grand Prix',
      country: race.competition?.location?.country || '',
      city: race.competition?.location?.city || '',
      circuit: race.circuit?.name || '',
      type: race.type || 'Race',
      date: race.date || '',
      time: race.time || '00:00:00',
      timezone: race.timezone || 'UTC',
      round: race.round || 0,
    }));

    return Response.json({ sessions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});