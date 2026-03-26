import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');

const API_BASES = {
  NFL: 'https://v1.american-football.api-sports.io',
  NCAAF: 'https://v1.american-football.api-sports.io',
  NBA: 'https://v1.basketball.api-sports.io',
  NCAAB: 'https://v1.basketball.api-sports.io',
  NHL: 'https://v1.hockey.api-sports.io',
  PWHL: 'https://v1.hockey.api-sports.io',
  soccer: 'https://v3.football.api-sports.io',
};

const SOCCER_LEAGUES = new Set(['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'MLS', 'Champions League']);

const isSoccer = (league) => SOCCER_LEAGUES.has(league);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { gameId, league } = await req.json();
    if (!gameId || !league) return Response.json({ odds: null });

    // Strip prefix to get numeric api-sports ID
    const numericId = String(gameId).replace(/^[a-z-]+-/i, '').replace(/^[a-z]+-/i, '');

    let baseUrl, endpoint;

    if (isSoccer(league)) {
      baseUrl = API_BASES.soccer;
      endpoint = `/odds?fixture=${numericId}&bookmaker=8`;
    } else {
      baseUrl = API_BASES[league];
      if (!baseUrl) return Response.json({ odds: null });
      endpoint = `/odds?game=${numericId}&bookmaker=8`;
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    if (!res.ok) return Response.json({ odds: null });
    const data = await res.json();

    const response = data?.response?.[0];
    if (!response) return Response.json({ odds: null });

    const bookmaker = response.bookmakers?.[0];
    if (!bookmaker) return Response.json({ odds: null });

    const bets = bookmaker.bets || [];

    if (isSoccer(league)) {
      // Soccer: Match Winner bet (id=1)
      const matchWinner = bets.find(b => b.id === 1 || b.name === 'Match Winner');
      if (!matchWinner) return Response.json({ odds: null });
      const vals = matchWinner.values || [];
      const home = vals.find(v => v.value === 'Home')?.odd || null;
      const draw = vals.find(v => v.value === 'Draw')?.odd || null;
      const away = vals.find(v => v.value === 'Away')?.odd || null;
      return Response.json({ odds: { home, draw, away } });
    } else {
      // American sports: Money Line + Spread + Over/Under
      const mlBet = bets.find(b => b.name === 'Money Line' || b.name === 'Moneyline' || b.id === 2);
      const spreadBet = bets.find(b => b.name === 'Point Spread' || b.name === 'Spread' || b.id === 3);
      const ouBet = bets.find(b => b.name === 'Over/Under' || b.name === 'Total' || b.id === 5);

      const mlVals = mlBet?.values || [];
      const homeML = mlVals.find(v => v.value === 'Home')?.odd || null;
      const awayML = mlVals.find(v => v.value === 'Away')?.odd || null;

      const spreadVals = spreadBet?.values || [];
      const spread = spreadVals.find(v => v.value === 'Home' || v.handicap)?.handicap
        || spreadVals[0]?.value || null;

      const ouVals = ouBet?.values || [];
      const overUnder = ouVals.find(v => v.value === 'Over')?.handicap
        || ouVals[0]?.handicap || null;

      const fmt = (odd) => {
        if (!odd) return null;
        const n = parseFloat(odd);
        if (isNaN(n)) return odd;
        // Convert decimal odds to American
        if (n >= 2.0) return `+${Math.round((n - 1) * 100)}`;
        if (n < 2.0 && n > 1.0) return `${Math.round(-100 / (n - 1))}`;
        return odd;
      };

      return Response.json({
        odds: {
          homeMoneyline: fmt(homeML),
          awayMoneyline: fmt(awayML),
          spread: spread ? String(spread) : null,
          overUnder: overUnder ? String(overUnder) : null,
        }
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});