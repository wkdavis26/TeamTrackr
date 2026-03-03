import { useState, useEffect } from 'react';

const SPORT_PATHS = {
  NBA: 'basketball/leagues/nba',
  NFL: 'football/leagues/nfl',
  MLB: 'baseball/leagues/mlb',
  NHL: 'hockey/leagues/nhl',
};

const oddsCache = {};

export function useGameOdds(gameId, league) {
  const [odds, setOdds] = useState(null);

  useEffect(() => {
    const sportPath = SPORT_PATHS[league];
    if (!sportPath || !gameId) return;

    // Strip non-numeric prefix (e.g. "nhl-" from NHL game IDs)
    const numericId = String(gameId).replace(/^\D+-/, '');
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

        const result = {
          provider: item.provider?.name || 'DraftKings',
          spread: item.details || null,           // e.g. "CHA -13.5"
          overUnder: item.overUnder ?? null,
          overOdds: item.current?.over?.alternateDisplayValue || null,
          underOdds: item.current?.under?.alternateDisplayValue || null,
          homeMoneyline: item.homeTeamOdds?.current?.moneyLine?.alternateDisplayValue || (item.homeTeamOdds?.moneyLine != null ? (item.homeTeamOdds.moneyLine > 0 ? `+${item.homeTeamOdds.moneyLine}` : `${item.homeTeamOdds.moneyLine}`) : null),
          awayMoneyline: item.awayTeamOdds?.current?.moneyLine?.alternateDisplayValue || (item.awayTeamOdds?.moneyLine != null ? (item.awayTeamOdds.moneyLine > 0 ? `+${item.awayTeamOdds.moneyLine}` : `${item.awayTeamOdds.moneyLine}`) : null),
          homeSpread: item.homeTeamOdds?.current?.pointSpread?.alternateDisplayValue || null,
          awaySpread: item.awayTeamOdds?.current?.pointSpread?.alternateDisplayValue || null,
        };
        oddsCache[cacheKey] = result;
        setOdds(result);
      })
      .catch(() => { oddsCache[cacheKey] = null; });
  }, [gameId, league]);

  return odds;
}