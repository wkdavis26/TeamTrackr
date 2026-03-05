import { useEffect, useState } from 'react';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUE_PATHS = {
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NBA: 'basketball/nba',
  WNBA: 'basketball/wnba',
  'Premier League': 'soccer/eng.1',
  'La Liga': 'soccer/esp.1',
  'Serie A': 'soccer/ita.1',
  'Bundesliga': 'soccer/ger.1',
  MLS: 'soccer/usa.1',
  NCAAF: 'football/college-football',
  NCAAB: 'basketball/mens-college-basketball',
  'NCAAB-Baseball': 'baseball/college-baseball',
};

// Fetch live score for a single game from ESPN
export async function fetchLiveScore(league, espnGameId) {
  const path = LEAGUE_PATHS[league];
  if (!path || !espnGameId) return null;
  try {
    const res = await fetch(`${ESPN_BASE}/${path}/scoreboard`);
    if (!res.ok) return null;
    const data = await res.json();
    const event = (data.events || []).find(e => e.id === String(espnGameId));
    if (!event) return null;
    return parseScoreFromEvent(event, league);
  } catch {
    return null;
  }
}

function parseScoreFromEvent(event, league) {
  const competition = event.competitions?.[0];
  if (!competition) return null;
  const statusType = event.status?.type;
  const isLive = statusType?.state === 'in';
  const isFinal = statusType?.state === 'post';
  if (!isLive && !isFinal) return null;

  const home = competition.competitors?.find(c => c.homeAway === 'home');
  const away = competition.competitors?.find(c => c.homeAway === 'away');

  // Clock / period info
  const clock = event.status?.displayClock;
  const period = event.status?.period;
  const statusDetail = statusType?.shortDetail || statusType?.description || '';

  return {
    isLive,
    isFinal,
    homeScore: home?.score ?? null,
    awayScore: away?.score ?? null,
    clock,
    period,
    statusDetail,
    league,
  };
}

// Hook: poll for live score every 30s when a game might be live
export function useLiveScore(game) {
  const [liveScore, setLiveScore] = useState(null);

  useEffect(() => {
    if (!game || game.isF1Race) return;
    const path = LEAGUE_PATHS[game.league];
    if (!path) return;

    // Only poll if the game started within the last 6 hours
    const now = Date.now();
    const gameTime = new Date(game.date).getTime();
    const sixHoursMs = 6 * 60 * 60 * 1000;
    if (gameTime > now || now - gameTime > sixHoursMs) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${ESPN_BASE}/${path}/scoreboard`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        // Match by ESPN game ID (our game.id is the ESPN event id for most leagues)
        const espnId = String(game.id).replace(/^nhl-/, ''); // strip nhl- prefix if present
        const event = (data.events || []).find(e => e.id === espnId || e.id === String(game.id));
        if (!event || cancelled) return;
        const score = parseScoreFromEvent(event, game.league);
        if (!cancelled) setLiveScore(score);
      } catch {
        // silently ignore
      }
    };

    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [game?.id, game?.league]);

  return liveScore;
}