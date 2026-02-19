import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { LEAGUES } from './teamsData';

// ESPN standings API paths per league
const STANDINGS_PATHS = {
  NFL:              'football/nfl',
  NHL:              'hockey/nhl',
  MLB:              'baseball/mlb',
  NBA:              'basketball/nba',
  'Premier League': 'soccer/eng.1',
  'La Liga':        'soccer/esp.1',
  MLS:              'soccer/usa.1',
  NCAAF:            'football/college-football',
};

// Cache fetched standings per league to avoid redundant requests
const standingsCache = {};

const fetchLeagueStandings = async (league) => {
  if (standingsCache[league]) return standingsCache[league];
  const path = STANDINGS_PATHS[league];
  if (!path) return [];
  try {
    const res = await fetch(`https://site.api.espn.com/apis/v2/sports/${path}/standings`);
    if (!res.ok) return [];
    const data = await res.json();
    // Flatten entries from all conference/division children
    const entries = (data.children || [data]).flatMap(
      child => (child.children || [child]).flatMap(
        sub => sub.standings?.entries || []
      )
    );
    standingsCache[league] = entries;
    return entries;
  } catch {
    return [];
  }
};

// Extract the abbreviation suffix from a team_id (e.g. "nhl-dal" -> "dal", "pl-man-city" -> "man-city")
const getTeamAbbr = (teamId) => {
  const parts = teamId.split('-');
  parts.shift(); // remove prefix like "nhl", "nba", "pl", etc.
  return parts.join('-');
};

const findEntryForTeam = (entries, teamId) => {
  const suffix = getTeamAbbr(teamId).toUpperCase().replace(/-/g, '');
  return entries.find(e => {
    const abbr = (e.team?.abbreviation || '').toUpperCase().replace(/-/g, '');
    return abbr === suffix;
  });
};

const getStat = (stats, ...names) => {
  for (const name of names) {
    const s = stats?.find(s => s.name === name || s.abbreviation === name);
    if (s) return s.displayValue;
  }
  return '—';
};

function TeamStandingCard({ team, standing, loading }) {
  const leagueIcon = LEAGUES[team.league]?.icon || '🏆';
  const rawColor = team.color || LEAGUES[team.league]?.color;
  const borderColor = rawColor ? `#${rawColor.replace('#', '')}` : '#e5e7eb';

  // Per-league stat layout
  const isHockey = team.league === 'NHL';
  const isSoccer = ['Premier League', 'La Liga', 'MLS'].includes(team.league);
  const isBaseball = team.league === 'MLB';

  const stats = standing?.stats;

  const w = stats ? getStat(stats, 'wins', 'W') : '—';
  const l = stats ? getStat(stats, 'losses', 'L') : '—';
  const otl = stats ? getStat(stats, 'otLosses', 'OTL') : null;
  const pct = stats ? getStat(stats, 'winPercent', 'PCT') : '—';
  const pts = stats ? getStat(stats, 'points', 'PTS') : '—';
  const streak = stats ? getStat(stats, 'streak', 'STRK') : '—';
  const gp = stats ? getStat(stats, 'gamesPlayed', 'GP') : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
      style={{ border: `3px solid ${borderColor}` }}
    >
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Team header */}
        <div className="flex items-center gap-3">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.team_name} className="w-10 h-10 object-contain flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0">{leagueIcon}</div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{team.team_name}</div>
            <div className="text-xs text-gray-400">{team.league}</div>
          </div>
        </div>

        {/* Standings */}
        <div className="border-t border-gray-100 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
          ) : !standing ? (
            <div className="text-xs text-gray-400 text-center py-2">Standings unavailable</div>
          ) : isHockey ? (
            <div className="grid grid-cols-4 gap-1 text-center">
              {[['W', w], ['L', l], ['OTL', otl ?? '—'], ['PTS', pts]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-base font-bold text-gray-900">{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          ) : isSoccer ? (
            <div className="grid grid-cols-3 gap-1 text-center">
              {[['W', w], ['L', l], ['PTS', pts]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-base font-bold text-gray-900">{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 text-center">
              {[['W', w], ['L', l], isBaseball ? ['GB', getStat(stats, 'gamesBehind', 'GB')] : ['PCT', pct]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-base font-bold text-gray-900">{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          )}
          {standing && streak !== '—' && (
            <div className="text-xs text-center text-gray-400 mt-2">
              Streak: <span className="font-medium text-gray-600">{streak}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TeamsOverview({ favoriteTeams }) {
  const [standings, setStandings] = useState({}); // { team_id: entry | null }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favoriteTeams.length) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      // Group teams by league to minimize API calls
      const leagues = [...new Set(favoriteTeams.map(t => t.league))];
      const leagueEntries = {};
      await Promise.all(leagues.map(async league => {
        leagueEntries[league] = await fetchLeagueStandings(league);
      }));

      const result = {};
      favoriteTeams.forEach(team => {
        const entries = leagueEntries[team.league] || [];
        result[team.team_id] = findEntryForTeam(entries, team.team_id) || null;
      });
      setStandings(result);
      setLoading(false);
    };
    load();
  }, [favoriteTeams.map(t => t.team_id).join(',')]);

  if (favoriteTeams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
        <p className="text-gray-500">Add teams to see their standings here</p>
      </div>
    );
  }

  // Group by league
  const byLeague = favoriteTeams.reduce((acc, t) => {
    if (!acc[t.league]) acc[t.league] = [];
    acc[t.league].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(byLeague).map(([league, teams]) => (
        <div key={league}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {teams.map(team => (
              <TeamStandingCard
                key={team.team_id}
                team={{ ...team, color: standings[team.team_id]?.team?.color }}
                standing={standings[team.team_id]}
                loading={loading}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}