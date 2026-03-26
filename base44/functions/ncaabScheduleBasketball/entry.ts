import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// NCAAB: ESPN doesn't support date ranges for NCAAB, so fetch the next 7 days individually.
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const fetchDay = async (dateStr) => {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=500&dates=${dateStr}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();

    // Fetch next 7 days in parallel
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      return fmtDate(d);
    });

    const dayResults = await Promise.all(dates.map(fetchDay));
    const events = dayResults.flat();

    // Deduplicate by event id
    const seen = new Set();
    const games = events
      .filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return e.competitions?.[0];
      })
      .map(e => {
        const comp = e.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home || !away) return null;
        return {
          id: e.id,
          date: e.date,
          homeTeam: {
            id: `ncaab-${(home.team?.abbreviation || '').toLowerCase()}`,
            name: home.team?.displayName || home.team?.name,
            logo: home.team?.logo || home.team?.logos?.[0]?.href || null,
          },
          awayTeam: {
            id: `ncaab-${(away.team?.abbreviation || '').toLowerCase()}`,
            name: away.team?.displayName || away.team?.name,
            logo: away.team?.logo || away.team?.logos?.[0]?.href || null,
          },
          venue: comp.venue?.fullName || 'TBD',
          status: e.status?.type?.description || 'Scheduled',
          odds: null,
        };
      })
      .filter(Boolean);

    return Response.json({ games }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message, games: [] }, { status: 500 });
  }
});