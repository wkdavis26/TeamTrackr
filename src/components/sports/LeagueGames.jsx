import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays, addMonths } from 'date-fns';
import { LEAGUES } from './teamsData';
import GameCard from './GameCard';

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
  const end = addMonths(now, 1);
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
        favoriteTeamId: homeTeam.team?.abbreviation,
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

function LeagueDetail({ leagueKey, onBack }) {
  const league = LEAGUES[leagueKey];
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
  const sortedDates = Object.keys(grouped).sort();

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">All Leagues</span>
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{league?.icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{league?.name || leagueKey}</h2>
          {!isLoading && <p className="text-sm text-gray-500">{games.length} games in the next month</p>}
        </div>
        {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin ml-2" />}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-2" />
          <span className="text-gray-500">Loading games...</span>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No upcoming games in the next month.</p>
        </div>
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
        </div>
      )}
    </motion.div>
  );
}

function LeagueList({ leagues, onSelect }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">All Games</h2>
        <p className="text-gray-500">Select a league to view all upcoming games</p>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {leagues.map(leagueKey => {
          const league = LEAGUES[leagueKey];
          return (
            <motion.button
              key={leagueKey}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(leagueKey)}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{league?.icon}</span>
                <span className="font-semibold text-gray-900">{league?.name || leagueKey}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function LeagueGames({ favoriteTeams }) {
  const [selectedLeague, setSelectedLeague] = useState(null);

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
    <AnimatePresence mode="wait">
      {selectedLeague ? (
        <LeagueDetail
          key={selectedLeague}
          leagueKey={selectedLeague}
          onBack={() => setSelectedLeague(null)}
        />
      ) : (
        <LeagueList
          key="list"
          leagues={leagues}
          onSelect={setSelectedLeague}
        />
      )}
    </AnimatePresence>
  );
}