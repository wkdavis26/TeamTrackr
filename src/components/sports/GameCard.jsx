import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getLeagueColor } from './teamsData';

const TeamLogo = ({ logo, name, size = "md" }) => {
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  if (logo?.startsWith('http')) {
    return <img src={logo} alt={name} className={`${sizeClass} object-contain`} />;
  }
  return <div className={`${sizeClass} flex items-center justify-center text-2xl`}>{logo || '🏆'}</div>;
};

// Format a date in Central Time
const formatCT = (date, fmt) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    ...fmt,
  }).format(date);
};

const formatTimeCT = (date) =>
  formatCT(date, { hour: 'numeric', minute: '2-digit', hour12: true });

export default function GameCard({ game, compact = false }) {
  const gameDate = new Date(game.date);

  // Get a Date object at noon of the CT calendar date for this game (avoids UTC midnight shifts)
  const getCTNoonDate = (d) => {
    const ctDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(d);
    return new Date(ctDateStr + 'T12:00:00');
  };

  const gameDateCT = getCTNoonDate(gameDate);

  const getDateLabel = () => {
    if (isToday(gameDateCT)) return "Today";
    if (isTomorrow(gameDateCT)) return "Tomorrow";
    const days = differenceInDays(gameDateCT, getCTNoonDate(new Date()));
    if (days < 7) return format(gameDateCT, "EEEE");
    return format(gameDateCT, "MMM d");
  };

  const isFavoriteHome = game.homeTeam.id === game.favoriteTeamId;
  const isFavoriteAway = game.awayTeam.id === game.favoriteTeamId;

  // Get the favorite team's primary color
  const favoriteTeam = isFavoriteHome ? game.homeTeam : game.awayTeam;
  const rawColor = favoriteTeam?.color;
  const teamColor = rawColor ? `#${rawColor.replace('#', '')}` : null;
  const borderStyle = teamColor ? { borderColor: teamColor, borderWidth: '4px', borderStyle: 'solid' } : {};

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white"
        style={teamColor ? borderStyle : { border: '1px solid #e5e7eb' }}
      >
        <div className={cn("w-1 h-12 rounded-full", getLeagueColor(game.league))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="sm" />
            <span className={cn(isFavoriteAway ? "font-bold text-gray-900" : "text-gray-500")}>
              {game.awayTeam.name}
            </span>
            <span className="text-gray-400">@</span>
            <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="sm" />
            <span className={cn(isFavoriteHome ? "font-bold text-gray-900" : "text-gray-500")}>
              {game.homeTeam.name}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{formatTimeCT(gameDate)} CT</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300"
      style={teamColor ? borderStyle : { border: '1px solid #e5e7eb' }}
    >
      {/* League indicator strip removed */}

      <div className="p-5 pt-4">
        {/* Header */}
        <div className="mb-4" />

        {/* Teams */}
        {game.isF1Race ? (
          <div className="text-center p-4 mb-4">
            <div className="text-4xl mb-2">{game.isMainRace ? '🏁' : '⏱️'}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">{game.f1Session}</div>
            <div className="text-base font-bold text-gray-900 mb-1">{game.venue}</div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} />
              <span className="text-sm text-emerald-600 font-medium">★ {game.homeTeam.name}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Away Team */}
            <div className={cn(
              "flex-1 text-center p-3 rounded-xl transition-colors",
              isFavoriteAway ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-gray-50"
            )}>
              <div className="flex justify-center mb-2">
                <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} />
              </div>
              <div className={cn(
                "text-sm font-medium truncate",
                isFavoriteAway ? "text-gray-900 font-semibold" : "text-gray-600"
              )}>
                {game.awayTeam.name}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">vs</div>
            </div>

            {/* Home Team */}
            <div className={cn(
              "flex-1 text-center p-3 rounded-xl transition-colors",
              isFavoriteHome ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-gray-50"
            )}>
              <div className="flex justify-center mb-2">
                <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} />
              </div>
              <div className={cn(
                "text-sm font-medium truncate",
                isFavoriteHome ? "text-gray-900 font-semibold" : "text-gray-600"
              )}>
                {game.homeTeam.name}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{formatTimeCT(gameDate)} CT</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="text-base">{game.leagueIcon}</span>
            <span className="text-xs font-medium">{game.league}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate max-w-[120px]">{game.venue}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}