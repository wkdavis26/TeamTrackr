import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('Sports_API_Key');

const LEAGUE_CONFIG = {
  'Premier League': { leagueId: 39 },
  'La Liga': { leagueId: 140 },
  'Serie A': { leagueId: 135 },
  'Bundesliga': { leagueId: 78 },
  'MLS': { leagueId: 253 },
};

const apiFetch = async (endpoint) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  if (!res.ok) return null;
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const league = body.league;

    if (!league || !LEAGUE_CONFIG[league]) {
      return Response.json({ error: 'Invalid league' }, { status: 400 });
    }

    const config = LEAGUE_CONFIG[league];
    const now = new Date();

    // Get current season
    const leagueInfo = await apiFetch(`/leagues?id=${config.leagueId}&current=true`);
    let season = null;
    if (leagueInfo?.response?.length > 0) {
      const currentSeasons = leagueInfo.response[0].seasons.filter(s => s.current === true);
      season = currentSeasons.length > 0 ? currentSeasons[0].year : leagueInfo.response[0].seasons[0].year;
    } else {
      season = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    }

    // Fetch fixtures and bulk odds in parallel
    const today = now.toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const [data, oddsData] = await Promise.all([
      apiFetch(`/fixtures?league=${config.leagueId}&season=${season}`),
      apiFetch(`/odds?league=${config.leagueId}&season=${season}&bookmaker=8&from=${today}&to=${in7Days}`).catch(() => null),
    ]);

    if (!data?.response) return Response.json({ games: [] });

    // Build odds map: fixtureId -> { home, draw, away, overUnder }
    const oddsMap = {};
    (oddsData?.response || []).forEach(item => {
      const fixtureId = item.fixture?.id;
      if (!fixtureId) return;
      const bets = item.bookmakers?.[0]?.bets || [];
      const matchWinner = bets.find(b => b.name === 'Match Winner');
      const ouBet = bets.find(b => b.name === 'Goals Over/Under' || b.name === 'Over/Under');
      if (!matchWinner?.values) return;
      const vals = matchWinner.values;

      const ouVals = ouBet?.values || [];
      const overVal = ouVals.find(v => v.value?.startsWith('Over'));
      const ouNum = overVal?.handicap || overVal?.value?.match(/([+-]?\d+\.?\d*)/)?.[1] || null;

      oddsMap[fixtureId] = {
        home: vals.find(v => v.value === 'Home')?.odd || null,
        draw: vals.find(v => v.value === 'Draw')?.odd || null,
        away: vals.find(v => v.value === 'Away')?.odd || null,
        overUnder: ouNum ? String(ouNum) : null,
      };
    });

    const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const futureGames = data.response.filter(game => {
      const gameDate = new Date(game.fixture.date);
      const status = game.fixture.status?.short || '';
      return gameDate > liveWindowStart && !['PPD', 'CANC', 'ABD', 'PST'].includes(status);
    });

    const nameToSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const leagueSlug = league.toLowerCase().replace(/\s+/g, '-');

    const games = futureGames.map(game => ({
      id: game.fixture.id,
      date: new Date(game.fixture.date),
      homeTeam: {
        id: `${leagueSlug}-${nameToSlug(game.teams.home.name)}`,
        name: game.teams.home.name,
        logo: game.teams.home.logo,
      },
      awayTeam: {
        id: `${leagueSlug}-${nameToSlug(game.teams.away.name)}`,
        name: game.teams.away.name,
        logo: game.teams.away.logo,
      },
      venue: game.fixture.venue?.name || 'TBD',
      status: game.fixture.status?.long || 'Scheduled',
      odds: oddsMap[game.fixture.id] || null,
    }));

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});