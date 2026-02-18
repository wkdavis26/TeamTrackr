import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getLeagueColor } from './teamsData';

export default function GameCard({ game, compact = false }) {
  const gameDate = new Date(game.date);
  
  const getDateLabel = () => {
    if (isToday(gameDate)) return "Today";
    if (isTomorrow(gameDate)) return "Tomorrow";
    const days = differenceInDays(gameDate, new Date());
    if (days < 7) return format(gameDate, "EEEE");
    return format(gameDate, "MMM d");
  };

  const isFavoriteHome = game.homeTeam.id === game.favoriteTeamId;
  const isFavoriteAway = game.awayTeam.id === game.favoriteTeamId;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
      >
        <div className={cn("w-1 h-12 rounded-full", getLeagueColor(game.league))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(isFavoriteAway && "font-bold text-white", !isFavoriteAway && "text-slate-400")}>
              {game.awayTeam.logo} {game.awayTeam.name}
            </span>
            <span className="text-slate-500">@</span>
            <span className={cn(isFavoriteHome && "font-bold text-white", !isFavoriteHome && "text-slate-400")}>
              {game.homeTeam.logo} {game.homeTeam.name}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {format(gameDate, "h:mm a")}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
    >
      {/* League indicator strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", getLeagueColor(game.league))} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{game.leagueIcon}</span>
            <span className="text-sm font-medium text-slate-400">{game.league}</span>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            isToday(gameDate) 
              ? "bg-emerald-500/20 text-emerald-400" 
              : isTomorrow(gameDate)
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-700 text-slate-300"
          )}>
            {getDateLabel()}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Away Team */}
          <div className={cn(
            "flex-1 text-center p-3 rounded-xl transition-colors",
            isFavoriteAway ? "bg-slate-700/50" : "bg-transparent"
          )}>
            <div className="text-3xl mb-2">{game.awayTeam.logo}</div>
            <div className={cn(
              "text-sm font-medium truncate",
              isFavoriteAway ? "text-white" : "text-slate-400"
            )}>
              {game.awayTeam.name}
            </div>
            {isFavoriteAway && (
              <div className="text-xs text-emerald-400 mt-1">★ Your Team</div>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider">vs</div>
          </div>

          {/* Home Team */}
          <div className={cn(
            "flex-1 text-center p-3 rounded-xl transition-colors",
            isFavoriteHome ? "bg-slate-700/50" : "bg-transparent"
          )}>
            <div className="text-3xl mb-2">{game.homeTeam.logo}</div>
            <div className={cn(
              "text-sm font-medium truncate",
              isFavoriteHome ? "text-white" : "text-slate-400"
            )}>
              {game.homeTeam.name}
            </div>
            {isFavoriteHome && (
              <div className="text-xs text-emerald-400 mt-1">★ Your Team</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{format(gameDate, "h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate max-w-[120px]">{game.venue}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}