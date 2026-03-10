import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// NCAAF teams don't have codes in api-sports, so we proxy ESPN for team data
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=500&groups=80'
    );
    if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
    const data = await res.json();
    const raw = data.sports?.[0]?.leagues?.[0]?.teams || [];

    const teams = raw.map(({ team }) => ({
      id: `ncaaf-${team.abbreviation.toLowerCase()}`,
      name: team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href || null,
      color: team.color || null,
    }));

    return Response.json({ teams });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});