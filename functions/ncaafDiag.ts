import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?limit=500&dates=20260901-20260910'
    );
    const data = await res.json();
    const events = data.events || [];

    // Find Notre Dame game
    const ndGames = events.filter(e => {
      const comps = e.competitions?.[0]?.competitors || [];
      return comps.some(c => c.team?.displayName?.includes('Notre Dame'));
    }).map(e => ({
      date: e.date,
      home: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName,
      away: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName,
    }));

    return Response.json({ totalGames: events.length, ndGames });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});