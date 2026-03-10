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
    headers: {
      'x-apisports-key': API_KEY,
    },
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const league = body.league;

    if (!league || !LEAGUE_CONFIG[league]) {
      return Response.json({ error: 'Invalid league' }, { status: 400 });
    }

    const config = LEAGUE_CONFIG[league];
    const now = new Date();

    // Fetch league info to get current season
    const leagueInfo = await apiFetch(`/leagues?id=${config.leagueId}&current=true`);
    let season = null;

    if (leagueInfo?.response && leagueInfo.response.length > 0) {
      const currentSeasons = leagueInfo.response[0].seasons.filter(s => s.current === true);
      season = currentSeasons.length > 0 ? currentSeasons[0].year : leagueInfo.response[0].seasons[0].year;
    } else {
      // Fallback: use most recent season based on current date
      const year = now.getFullYear();
      season = now.getMonth() >= 7 ? year : year - 1;
    }

    // Fetch games for current season
    const data = await apiFetch(`/fixtures?league=${config.leagueId}&season=${season}`);

    if (!data || !data.response) {
      return Response.json({ games: [] });
    }

    // Filter for in-progress and upcoming games (within 4 hour lookback)
     const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
     const futureGames = data.response.filter(game => {
       const gameDate = new Date(game.fixture.date);
       const status = game.fixture.status?.short || '';
       return gameDate > liveWindowStart && !['PPD', 'CANC', 'ABD'].includes(status);
     });

    // Fetch odds for games (requires premium API key with odds access)
    const oddsMap = {};
    try {
      // Fetch odds for first 5 games
      for (let i = 0; i < Math.min(5, futureGames.length); i++) {
        const gameId = futureGames[i].fixture.id;
        const oddsData = await apiFetch(`/odds?fixture=${gameId}`);
        if (oddsData?.response && Array.isArray(oddsData.response)) {
          oddsData.response.forEach(oddItem => {
            oddsMap[oddItem.fixture.id] = oddItem.bookmakers || [];
          });
        }
      }
    } catch (e) {
      // Odds endpoint may not be available with current API key
    }

    // Parse games into standardized format
    const games = futureGames.map(game => {
      const bookmakers = oddsMap[game.fixture.id] || [];
      const firstBookmaker = bookmakers[0];
      
      // Extract odds from the bet structure
      let odds = null;
      if (firstBookmaker?.bets && firstBookmaker.bets.length > 0) {
        const matchBet = firstBookmaker.bets.find(b => b.name === 'Match Winner');
        
        if (matchBet?.values && matchBet.values.length >= 3) {
          odds = {
            bookmaker: firstBookmaker.name,
            home: matchBet.values.find(v => v.value === 'Home')?.odd,
            draw: matchBet.values.find(v => v.value === 'Draw')?.odd,
            away: matchBet.values.find(v => v.value === 'Away')?.odd,
          };
        }
      }
      
      return {
        id: game.fixture.id,
        date: new Date(game.fixture.date),
        homeTeam: {
          id: `${league.toLowerCase().replace(/\s+/g, '-')}-${game.teams.home.id}`,
          name: game.teams.home.name,
          logo: game.teams.home.logo,
        },
        awayTeam: {
          id: `${league.toLowerCase().replace(/\s+/g, '-')}-${game.teams.away.id}`,
          name: game.teams.away.name,
          logo: game.teams.away.logo,
        },
        venue: game.fixture.venue?.name || 'TBD',
        status: game.fixture.status?.long || 'Scheduled',
        odds,
      };
    });

    return Response.json({ games });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});