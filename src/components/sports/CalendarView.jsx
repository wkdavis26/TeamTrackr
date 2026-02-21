import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GameCard from './GameCard';

export default function CalendarView({ games, hidePreseason, onToggleHidePreseason }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredGames = hidePreseason ? games.filter(g => !g.isPreseason) : games;

  const gamesOnDate = (date) => {
    return filteredGames.filter(game => isSameDay(new Date(game.date), date));
  };

  const selectedGames = useMemo(() => {
    if (!selectedDate) return [];
    return gamesOnDate(selectedDate);
  }, [selectedDate, games]);

  const GamePill = ({ game, isSelected }) => {
    const gameTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(game.date));
    const awayAbbr = game.awayTeam.name.split(' ').pop();
    const homeAbbr = game.homeTeam.name.split(' ').pop();
    const favTeam = game.homeTeam.id === game.favoriteTeamId ? game.homeTeam : game.awayTeam;
    const teamColor = favTeam?.color ? `#${favTeam.color.replace('#', '')}` : null;
    const teamsLabel = game.isF1Race
      ? `${game.f1Country ? game.f1Country + ' ' : ''}${game.f1Session || 'Race'}`
      : `${awayAbbr} @ ${homeAbbr}`;
    return (
      <div
        className="rounded px-1 py-0.5 text-[10px] leading-tight text-center"
        style={teamColor && !isSelected ? { backgroundColor: teamColor, color: '#fff' } : {}}
      >
        <div className="opacity-80 text-[9px]">{gameTime}</div>
        <div className="font-semibold truncate">{teamsLabel}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hide Preseason Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="cal-hide-preseason"
          checked={hidePreseason}
          onChange={e => onToggleHidePreseason(e.target.checked)}
          className="w-4 h-4 accent-emerald-500 cursor-pointer"
        />
        <label htmlFor="cal-hide-preseason" className="text-sm text-gray-500 cursor-pointer select-none">
          Hide preseason games
        </label>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => viewMode === 'month' ? setCurrentMonth(subMonths(currentMonth, 1)) : setCurrentWeek(subWeeks(currentWeek, 1))}
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === 'month'
              ? format(currentMonth, "MMMM yyyy")
              : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
          </h2>
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setViewMode('month')}
              className={cn("px-3 py-1 transition-colors", viewMode === 'month' ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-50")}
            >Month</button>
            <button
              onClick={() => setViewMode('week')}
              className={cn("px-3 py-1 transition-colors", viewMode === 'week' ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-50")}
            >Week</button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => viewMode === 'month' ? setCurrentMonth(addMonths(currentMonth, 1)) : setCurrentWeek(addWeeks(currentWeek, 1))}
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">{day}</div>
            ))}
          </div>
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
                    "rounded-xl flex flex-col items-center justify-start relative transition-all duration-200 p-1 pt-2 min-h-[70px]",
                    isSelected ? "bg-emerald-500 text-white" : hasGames ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "text-gray-400 hover:bg-gray-50",
                    dayIsToday && !isSelected && "ring-2 ring-emerald-400"
                  )}
                >
                  <span className={cn("text-sm font-medium", dayIsToday && "font-bold")}>{format(day, "d")}</span>
                  {hasGames && (
                    <div className="space-y-0.5 mt-1 w-full overflow-hidden">
                      {dayGames.slice(0, 2).map((game, i) => (
                        <GamePill key={i} game={game} isSelected={isSelected} />
                      ))}
                      {dayGames.length > 2 && (
                        <div className={cn("text-[8px] text-center", isSelected ? "text-white/70" : "text-gray-500")}>
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
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map(day => (
              <div key={day.toISOString()} className={cn(
                "text-center py-3 text-xs font-medium",
                isToday(day) ? "text-emerald-600 font-bold" : "text-gray-400"
              )}>
                <div>{format(day, "EEE")}</div>
                <div className={cn(
                  "mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm",
                  isToday(day) ? "bg-emerald-500 text-white" : "text-gray-700"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-[200px]">
            {weekDays.map(day => {
              const dayGames = gamesOnDate(day);
              return (
                <div key={day.toISOString()} className="p-1.5 space-y-1">
                  {dayGames.map((game, i) => {
                    const favTeam = game.homeTeam.id === game.favoriteTeamId ? game.homeTeam : game.awayTeam;
                    const teamColor = favTeam?.color ? `#${favTeam.color.replace('#', '')}` : '#6b7280';
                    const gameTime = new Intl.DateTimeFormat('en-US', {
                      timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true,
                    }).format(new Date(game.date));
                    const awayAbbr = game.awayTeam.name.split(' ').pop();
                    const homeAbbr = game.homeTeam.name.split(' ').pop();
                    const label = game.isF1Race
                      ? `${game.f1Session || 'Race'}`
                      : `${awayAbbr}@${homeAbbr}`;
                    return (
                      <div
                        key={i}
                        className="rounded-md px-1.5 py-1 text-white text-[10px] leading-tight cursor-default"
                        style={{ backgroundColor: teamColor }}
                      >
                        <div className="font-semibold truncate">{label}</div>
                        <div className="opacity-80">{gameTime} CT</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Day View */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-700 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕ Close
              </button>
            </div>

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