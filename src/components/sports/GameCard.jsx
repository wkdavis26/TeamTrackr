import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { MapPin, Clock, Tv, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getLeagueColor } from './teamsData';
import { useGameOdds } from './useGameOdds';
import { useLiveScore } from './useLiveScores';

// Map F1 race country/location to a dominant flag color
const F1_COUNTRY_COLORS = {
  'Australia': '#00008B',
  'Bahrain': '#CE1126',
  'Saudi Arabia': '#006C35',
  'Japan': '#BC002D',
  'China': '#DE2910',
  'Chinese': '#DE2910',
  'Miami': '#0033A0',
  'Emilia Romagna': '#009246',
  'Monaco': '#CE1126',
  'Canada': '#FF0000',
  'Spain': '#AA151B',
  'Austria': '#ED2939',
  'United Kingdom': '#012169',
  'Hungary': '#CE2939',
  'Belgium': '#000000',
  'Netherlands': '#AE1C28',
  'Italy': '#009246',
  'Azerbaijan': '#0092BC',
  'Singapore': '#EF3340',
  'United States': '#B22234',
  'Mexico': '#006847',
  'Brazil': '#009C3B',
  'Las Vegas': '#C8A951',
  'Qatar': '#8D1B3D',
  'Abu Dhabi': '#00732F'
};

const COUNTRY_TO_CODE = {
  'Australia': 'au', 'Bahrain': 'bh', 'Saudi Arabia': 'sa', 'Japan': 'jp',
  'China': 'cn', 'Chinese': 'cn', 'Miami': 'us', 'Emilia Romagna': 'it', 'Monaco': 'mc',
  'Canada': 'ca', 'Spain': 'es', 'Austria': 'at', 'United Kingdom': 'gb',
  'Hungary': 'hu', 'Belgium': 'be', 'Netherlands': 'nl', 'Italy': 'it',
  'Azerbaijan': 'az', 'Singapore': 'sg', 'United States': 'us',
  'Mexico': 'mx', 'Brazil': 'br', 'Las Vegas': 'us', 'Qatar': 'qa', 'Abu Dhabi': 'ae'
};

const getFlagUrl = (country) => {
  if (!country) return null;
  for (const [key, code] of Object.entries(COUNTRY_TO_CODE)) {
    if (country.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(country.toLowerCase())) {
      return `https://flagcdn.com/w40/${code}.png`;
    }
  }
  return null;
};

const FlagImage = ({ country }) => {
  const url = getFlagUrl(country);
  if (!url) return null;
  return <img src={url} alt={country} className="w-7 h-5 object-cover rounded-sm shadow-sm" />;
};

const getF1CountryColor = (country) => {
  if (!country) return null;
  for (const [key, color] of Object.entries(F1_COUNTRY_COLORS)) {
    if (country.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(country.toLowerCase())) {
      return color;
    }
  }
  return null;
};

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
    ...fmt
  }).format(date);
};

const formatTimeCT = (date) =>
formatCT(date, { hour: 'numeric', minute: '2-digit', hour12: true });

const ODDS_SUPPORTED = new Set(['NBA', 'NFL', 'MLB', 'NHL', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'MLS', 'NCAAF', 'NCAAB']);

function BroadcastDisplay({ broadcasts }) {
  const [expanded, setExpanded] = useState(false);
  if (!broadcasts || broadcasts.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Tv className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setExpanded(v => !v); }}
        className="flex items-center gap-1 focus:outline-none touch-manipulation"
      >
        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
          {broadcasts[0]}
        </span>
        {broadcasts.length > 1 && (
          <span className="text-xs text-gray-400 font-medium">
            {expanded ? '▲' : `+${broadcasts.length - 1}`}
          </span>
        )}
      </button>
      {expanded && broadcasts.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          {broadcasts.slice(1).map((ch, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">{ch}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameCard({ game, compact = false }) {
  const odds = useGameOdds(game?.id, game?.league);
  const liveScore = useLiveScore(game);
  const gameDate = new Date(game?.date);
  if (!game || !game.homeTeam || !game.awayTeam) return null;

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

  // Get border color: F1 uses race country flag color, others use team color
  let borderColor = null;
  if (game.isF1Race) {
    borderColor = getF1CountryColor(game.f1Country) || '#E10600'; // fallback to F1 red
  } else {
    const favoriteTeam = isFavoriteHome ? game.homeTeam : game.awayTeam;
    const rawColor = favoriteTeam?.color;
    borderColor = rawColor ? `#${rawColor.replace('#', '')}` : null;
  }
  const teamColor = borderColor;
  const borderStyle = borderColor ?
  { borderColor, borderWidth: '4px', borderStyle: 'solid' } :
  {};

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white"
        style={teamColor ? borderStyle : { border: '1px solid #e5e7eb' }}>

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
      </motion.div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 w-full"
      style={teamColor ? borderStyle : { border: '1px solid #e5e7eb' }}>

      {/* League indicator strip removed */}

      {game.isPreseason &&
      <div className="absolute right-5 z-10" style={{ top: '2px' }}>
                  <span className="bg-gray-400 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Preseason</span>
                </div>
      }
      <div className="p-5 pt-4">
        {/* Header */}
        <div className="mb-4" />

        {/* Teams */}
        {game.isF1Race ?
        <div className="flex flex-col items-center justify-center gap-2 mb-4 h-[100px]">
              <div className="flex items-center gap-2">
                <FlagImage country={game.f1Country} />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{game.f1Session}</span>
                <FlagImage country={game.f1Country} />
              </div>
              <div className="text-lg font-bold text-gray-900">{game.f1Country || 'Grand Prix'}</div>
              <div className="text-sm text-gray-500 truncate max-w-full text-center">{game.venue}</div>
            </div> :

        <div className="flex items-center justify-between gap-4 mb-4 h-[100px]">
            {/* Away Team */}
            <div className={cn(
            "flex-1 text-center p-2 rounded-xl transition-colors",
            isFavoriteAway ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-gray-50"
          )}>
              <div className="flex justify-center mb-1.5">
                <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="sm" />
              </div>
              <div className={cn(
              "text-sm font-medium truncate",
              isFavoriteAway ? "text-gray-900 font-semibold" : "text-gray-600"
            )}>
                {game.awayTeam.name}
              </div>
              {game.awayTeam.record &&
            <div className="text-xs text-gray-400 mt-0.5">{game.awayTeam.record}</div>
            }
            </div>

            {/* VS / Score */}
            <div className="flex flex-col items-center gap-1">
              {liveScore ? (
                <>
                  <div className="text-xl font-bold text-gray-900 leading-none">
                    {liveScore.awayScore} – {liveScore.homeScore}
                  </div>
                  {liveScore.isLive && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-600 font-semibold">{liveScore.statusDetail}</span>
                    </div>
                  )}
                  {liveScore.isFinal && (
                    <span className="text-xs text-gray-500 font-semibold">Final</span>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">vs</div>
              )}
            </div>

            {/* Home Team */}
            <div className={cn(
            "flex-1 text-center p-2 rounded-xl transition-colors",
            isFavoriteHome ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-gray-50"
          )}>
              <div className="flex justify-center mb-1.5">
                <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="sm" />
              </div>
              <div className={cn(
              "text-sm font-medium truncate",
              isFavoriteHome ? "text-gray-900 font-semibold" : "text-gray-600"
            )}>
                {game.homeTeam.name}
              </div>
              {game.homeTeam.record &&
            <div className="text-xs text-gray-400 mt-0.5">{game.homeTeam.record}</div>
            }
            </div>
          </div>
        }

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1">
            {liveScore?.isLive ? (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-xs text-red-600 font-semibold">LIVE</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">{liveScore?.isFinal ? 'Final' : `${formatTimeCT(gameDate)} CT`}</span>
              </>
            )}
          </div>
          



          <div className="flex items-center gap-1.5 text-gray-400 flex-1 justify-end">
            {game.broadcasts && game.broadcasts.length > 0 ? (
              <BroadcastDisplay broadcasts={game.broadcasts} />
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs truncate max-w-[100px]">{game.venue}</span>
              </>
            )}
          </div>
        </div>
        {odds && ODDS_SUPPORTED.has(game.league) &&
        <div className="pt-2 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              
              
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                <div className="text-xs text-gray-400 mb-0.5">Spread</div>
                <div className="text-xs font-bold text-gray-800">{odds.spread || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                <div className="text-xs text-gray-400 mb-0.5">Moneyline</div>
                <div className="text-xs font-bold text-gray-800">
                  {odds.awayMoneyline || '—'} / {odds.homeMoneyline || '—'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                <div className="text-xs text-gray-400 mb-0.5">O/U</div>
                <div className="text-xs font-bold text-gray-800">{odds.overUnder ?? '—'}</div>
              </div>
            </div>
          </div>
        }
      </div>
    </motion.div>);

}