import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// NCAAF teams have no codes in api-sports, so we use ESPN for schedule data.
// ESPN supports a date range via the scoreboard endpoint.
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const startStr = fmtDate(now);
    // Cover through Jan 31 of next year (bowl games / playoff)
    const end = new Date(now.getFullYear() + 1, 0, 31);
    const endStr = fmtDate(end);

    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?limit=500&dates=${startStr}-${endStr}`
    );
    if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
    const data = await res.json();
    const events = data.events || [];

    const games = events
      .filter(e => e.competitions?.[0])
      .map(e => {
        const comp = e.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home || !away) return null;
        return {
          id: e.id,
          date: e.date,
          homeTeam: {
            id: `ncaaf-${home.team?.abbreviation?.toLowerCase()}`,
            name: home.team?.displayName || home.team?.name,
            logo: home.team?.logo || home.team?.logos?.[0]?.href || null,
          },
          awayTeam: {
            id: `ncaaf-${away.team?.abbreviation?.toLowerCase()}`,
            name: away.team?.displayName || away.team?.name,
            logo: away.team?.logo || away.team?.logos?.[0]?.href || null,
          },
          venue: comp.venue?.fullName || 'TBD',
          status: e.status?.type?.description || 'Scheduled',
          stage: e.season?.type === 1 ? 'Pre Season' : '',
        };
      })
      .filter(Boolean);

    return Response.json({ games }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});