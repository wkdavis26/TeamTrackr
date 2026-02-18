import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GameCard from './GameCard';
import { getLeagueColor } from './teamsData';

export default function CalendarView({ games }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week offset
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const gamesOnDate = (date) => {
    return games.filter(game => isSameDay(new Date(game.date), date));
  };

  const selectedGames = useMemo(() => {
    if (!selectedDate) return [];
    return gamesOnDate(selectedDate);
  }, [selectedDate, games]);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {days.map(day => {
            const dayGames = gamesOnDate(day);
            const hasGames = dayGames.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayIsToday = isToday(day);

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 p-1",
                    isSelected
                      ? "bg-emerald-500 text-white"
                      : hasGames
                        ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                        : "text-gray-400 hover:bg-gray-50",
                    dayIsToday && !isSelected && "ring-2 ring-emerald-400"
                  )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  dayIsToday && "font-bold"
                )}>
                  {format(day, "d")}
                </span>

                {hasGames && (
                  <div className="text-[9px] space-y-0.5 mt-0.5 w-full overflow-hidden">
                    {dayGames.slice(0, 2).map((game, i) => {
                      const gameTime = new Intl.DateTimeFormat('en-US', {
                        timeZone: 'America/Chicago',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(game.date));
                      const awayAbbr = game.awayTeam.name.split(' ').pop();
                      const homeAbbr = game.homeTeam.name.split(' ').pop();
                      return (
                        <div key={i} className={cn("truncate", isSelected ? "text-white/90" : "text-gray-700")}>
                          {gameTime} {awayAbbr}@{homeAbbr}
                        </div>
                      );
                    })}
                    {dayGames.length > 2 && (
                      <div className={cn("text-[8px]", isSelected ? "text-white/70" : "text-gray-500")}>
                        +{dayGames.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Games */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Games on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {selectedGames.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No games scheduled for this date
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}