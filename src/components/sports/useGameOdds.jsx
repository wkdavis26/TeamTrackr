import { useState, useEffect } from 'react';

// Maps league name to ESPN core API sport/league path
const SPORT_PATHS = {
  NBA: 'basketball/leagues/nba',
  NFL: 'football/leagues/nfl',
  MLB: 'baseball/leagues/mlb',
  NHL: 'hockey/leagues/nhl',
  'Premier League': 'soccer/leagues/eng.1',
  'La Liga': 'soccer/leagues/esp.1',
  'Serie A': 'soccer/leagues/ita.1',
  'Bundesliga': 'soccer/leagues/ger.1',
  MLS: 'soccer/leagues/usa.1',
  NCAAF: 'football/leagues/college-football',
  NCAAB: 'basketball/leagues/mens-college-basketball',
};

const oddsCache = {};

export function useGameOdds(gameId, league) {
  const [odds, setOdds] = useState(null);

  useEffect(() => {
    const sportPath = SPORT_PATHS[league];
    if (!sportPath || !gameId) return;

    // Strip non-numeric prefix (e.g. "nhl-401234" -> "401234")
    const numericId = String(gameId).replace(/^[a-z]+-/i, '');
    const cacheKey = `${league}-${numericId}`;

    if (oddsCache[cacheKey] !== undefined) {
      setOdds(oddsCache[cacheKey]);
      return;
    }

    const url = `https://sports.core.api.espn.com/v2/sports/${sportPath}/events/${numericId}/competitions/${numericId}/odds`;

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const item = data?.items?.[0];
        if (!item) { oddsCache[cacheKey] = null; setOdds(null); return; }

        const homeML = item.homeTeamOdds?.moneyLine;
        const awayML = item.awayTeamOdds?.moneyLine;

        const result = {
          provider: item.provider?.name || null,
          spread: item.details || null,
          overUnder: item.overUnder ?? null,
          homeMoneyline: homeML != null ? (homeML > 0 ? `+${homeML}` : `${homeML}`) : null,
          awayMoneyline: awayML != null ? (awayML > 0 ? `+${awayML}` : `${awayML}`) : null,
        };
        oddsCache[cacheKey] = result;
        setOdds(result);
      })
      .catch(() => { oddsCache[cacheKey] = null; });
  }, [gameId, league]);

  return odds;
}