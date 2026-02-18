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
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <h2 className="text-xl font-bold text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
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

            // Get unique leagues for this day
            const uniqueLeagues = [...new Set(dayGames.map(g => g.league))];

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200",
                  isSelected 
                    ? "bg-emerald-500 text-white" 
                    : hasGames 
                      ? "bg-slate-700/50 text-white hover:bg-slate-700" 
                      : "text-slate-500 hover:bg-slate-800/50",
                  dayIsToday && !isSelected && "ring-2 ring-emerald-500/50"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  dayIsToday && "font-bold"
                )}>
                  {format(day, "d")}
                </span>
                
                {hasGames && (
                  <div className="flex gap-0.5 mt-1">
                    {uniqueLeagues.slice(0, 3).map((league, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected ? "bg-white/70" : getLeagueColor(league)
                        )} 
                      />
                    ))}
                    {uniqueLeagues.length > 3 && (
                      <span className="text-[8px] text-slate-400">+{uniqueLeagues.length - 3}</span>
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
            <h3 className="text-lg font-semibold text-white">
              Games on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {selectedGames.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No games scheduled for this date
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}