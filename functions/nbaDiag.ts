import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v2.nba.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 2000) };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [teams, games, seasons] = await Promise.all([
      apiFetch('/teams'),
      apiFetch('/games?season=2025'),
      apiFetch('/seasons'),
    ]);

    return Response.json({ teams, games, seasons });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});