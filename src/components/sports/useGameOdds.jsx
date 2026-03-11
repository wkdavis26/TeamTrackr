import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const oddsCache = {};

const SUPPORTED_LEAGUES = new Set([
  'NBA', 'NFL', 'NHL', 'NCAAF', 'NCAAB', 'PWHL',
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'MLS',
]);

export function useGameOdds(gameId, league) {
  const [odds, setOdds] = useState(null);

  useEffect(() => {
    if (!gameId || !league || !SUPPORTED_LEAGUES.has(league)) return;

    const cacheKey = `${league}-${gameId}`;
    if (oddsCache[cacheKey] !== undefined) {
      setOdds(oddsCache[cacheKey]);
      return;
    }

    base44.functions.invoke('gameOdds', { gameId: String(gameId), league })
      .then(res => {
        const result = res.data?.odds || null;
        oddsCache[cacheKey] = result;
        setOdds(result);
      })
      .catch(() => {
        oddsCache[cacheKey] = null;
      });
  }, [gameId, league]);

  return odds;
}