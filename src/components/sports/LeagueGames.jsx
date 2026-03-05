import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { LEAGUES } from './teamsData';
import GameCard from './GameCard';

// ESPN sport paths for scoreboard
const LEAGUE_SCOREBOARD_PATHS = {
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NBA: 'basketball/nba',
  'Premier League': 'soccer/eng.1',
  'La Liga': 'soccer/esp.1',
  'Serie A': 'soccer/ita.1',
  'Bundesliga': 'soccer/ger.1',
  MLS: 'soccer/usa.1',
  NCAAF: 'football/college-football',
  NCAAB: 'basketball/mens-college-basketball',
  'NCAAB-Baseball': 'baseball/college-baseball',
};

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

async function fetchLeagueAllGames(leagueKey) {
  const path = LEAGUE_SCOREBOARD_PATHS[leagueKey];
  if (!path) return [];
  const now = new Date();
  const end = new Date(now.getFullYear(), 11, 31);
  const startStr = fmtDate(now);
  const endStr = fmtDate(end);
  try {
    const res = await fetch(`${ESPN_BASE}/${path}/scoreboard?limit=500&dates=${startStr}-${endStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || []).map(event => {
      const competition = event.competitions?.[0];
      if (!competition) return null;
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeTeam || !awayTeam) return null;
      const gameDate = new Date(event.date);
      if (gameDate <= now) return null;
      const broadcasts = (competition.broadcasts || [])
        .flatMap(b => b.names || [b.market || b.type].filter(Boolean));
      const getRecord = (competitor) => {
        const rec = competitor.records?.find(r => r.type === 'total' || !r.type);
        return rec?.summary || null;
      };
      return {
        id: event.id,
        date: gameDate,
        league: leagueKey,
        leagueIcon: LEAGUES[leagueKey]?.icon || '🏆',
        homeTeam: {
          id: homeTeam.team?.abbreviation,
          name: homeTeam.team?.displayName || homeTeam.team?.name,
          logo: homeTeam.team?.logo,
          color: homeTeam.team?.color,
          record: getRecord(homeTeam),
        },
        awayTeam: {
          id: awayTeam.team?.abbreviation,
          name: awayTeam.team?.displayName || awayTeam.team?.name,
          logo: awayTeam.team?.logo,
          color: awayTeam.team?.color,
          record: getRecord(awayTeam),
        },
        favoriteTeamId: homeTeam.team?.abbreviation, // needed by GameCard
        venue: competition.venue?.fullName || 'TBD',
        status: event.status?.type?.description || 'Scheduled',
        isPreseason: event.season?.type === 1 || event.seasonType?.type?.id === '1',
        broadcasts: broadcasts.length > 0 ? broadcasts : null,
      };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

const getCTDateKey = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(date));

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const dateSuffix = format(date, "MMMM d");
  if (isToday(date)) return `Today, ${dateSuffix}`;
  if (isTomorrow(date)) return `Tomorrow, ${dateSuffix}`;
  const days = differenceInDays(date, new Date());
  if (days < 7) return `${format(date, "EEEE")}, ${dateSuffix}`;
  return format(date, "EEEE, MMMM d");
};

function LeagueSection({ leagueKey }) {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['leagueAllGames', leagueKey],
    queryFn: () => fetchLeagueAllGames(leagueKey),
    staleTime: 1000 * 60 * 5,
  });

  const grouped = games.reduce((acc, game) => {
    const key = getCTDateKey(game.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort().slice(0, 7); // show next 7 days

  const league = LEAGUES[leagueKey];

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{league?.icon}</span>
        <h2 className="text-xl font-bold text-gray-900">{league?.name || leagueKey}</h2>
        {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {!isLoading && <span className="text-sm text-gray-400">({games.length} upcoming)</span>}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : games.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No upcoming games found.</p>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateStr => (
            <div key={dateStr}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-600">{getDateLabel(dateStr)}</h3>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{grouped[dateStr].length} games</span>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {grouped[dateStr].map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length > 7 && (
            <p className="text-xs text-gray-400 text-center">Showing next 7 days · {games.length} total upcoming games</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeagueGames({ favoriteTeams }) {
  // Get unique leagues from favorite teams, excluding F1 and International Football (no scoreboard)
  const leagues = [...new Set(favoriteTeams.map(t => t.league))]
    .filter(l => LEAGUE_SCOREBOARD_PATHS[l]);

  if (leagues.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No supported leagues</h3>
        <p className="text-gray-500">Add teams from supported leagues to see all games</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">League Games</h2>
        <p className="text-gray-500">All upcoming games for the leagues you follow · next 7 days per league</p>
      </div>
      {leagues.map(leagueKey => (
        <LeagueSection key={leagueKey} leagueKey={leagueKey} />
      ))}
    </motion.div>
  );
}