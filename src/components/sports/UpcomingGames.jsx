import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import GameCard from './GameCard';

export default function UpcomingGames({ games }) {
  // Get the date string in Central Time (to avoid UTC midnight rollover issues)
  const getCTDateKey = (date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(date)); // yields YYYY-MM-DD

  // Group games by their Central Time date
  const groupedGames = games.reduce((acc, game) => {
    const dateKey = getCTDateKey(game.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(game);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedGames).sort();

  const getDateLabel = (dateStr) => {
    // Parse as local noon to avoid any timezone shifting in date-fns comparisons
    const date = new Date(dateStr + 'T12:00:00');
    const dateSuffix = format(date, "MMMM d");
    if (isToday(date)) return `Today, ${dateSuffix}`;
    if (isTomorrow(date)) return `Tomorrow, ${dateSuffix}`;
    const days = differenceInDays(date, new Date());
    if (days < 7) return `${format(date, "EEEE")}, ${dateSuffix}`;
    return format(date, "EEEE, MMMM d");
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming games</h3>
          <p className="text-gray-500">Select some teams to see their upcoming games</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr, dateIndex) => (
        <motion.div
          key={dateStr}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dateIndex * 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
                {getDateLabel(dateStr)}
              </h3>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">
              {groupedGames[dateStr].length} {groupedGames[dateStr].length === 1 ? 'game' : 'games'}
            </span>
          </div>
          
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groupedGames[dateStr].map((game, gameIndex) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: dateIndex * 0.1 + gameIndex * 0.05 }}
              >
                <GameCard game={game} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}