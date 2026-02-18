import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import GameCard from './GameCard';

export default function UpcomingGames({ games }) {
  // Group games by date
  const groupedGames = games.reduce((acc, game) => {
    const dateKey = format(new Date(game.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(game);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedGames).sort();

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const days = differenceInDays(date, new Date());
    if (days < 7) return format(date, "EEEE");
    return format(date, "EEEE, MMMM d");
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-white mb-2">No upcoming games</h3>
        <p className="text-slate-400">Select some teams to see their upcoming games</p>
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
            <h3 className="text-lg font-semibold text-white">
              {getDateLabel(dateStr)}
            </h3>
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-sm text-slate-500">
              {groupedGames[dateStr].length} {groupedGames[dateStr].length === 1 ? 'game' : 'games'}
            </span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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