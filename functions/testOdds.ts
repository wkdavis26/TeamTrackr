import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('Sports_API_Key');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test with a specific fixture ID from La Liga
    const fixtureId = 1391089;
    const res = await fetch(`${API_BASE}/odds?fixture=${fixtureId}`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });

    if (!res.ok) {
      return Response.json({ error: `API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    
    return Response.json({
      fixtureId,
      resultsCount: data.results,
      firstResponse: data.response?.[0],
      fullStructure: JSON.stringify(data, null, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});