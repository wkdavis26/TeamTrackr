import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LEAGUES } from './teamsData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  'FIFA World Cup': 'soccer/fifa.wc',
  'UEFA Euro':      'soccer/uefa.euro',
  'International':  'soccer/international',
};

const standingsCache = {};

const fetchLeagueStandings = async (league) => {
  if (standingsCache[league]) return standingsCache[league];
  const path = STANDINGS_PATHS[league];
  if (!path) return [];
  try {
    const res = await fetch(`https://site.api.espn.com/apis/v2/sports/${path}/standings`);
    if (!res.ok) return [];
    const data = await res.json();
    const entries = (data.children || [data]).flatMap(
      child => (child.children || [child]).flatMap(
        sub => sub.standings?.entries || []
      )
    );
    standingsCache[league] = entries;
    return entries;
  } catch (e) {
    console.error(`Error fetching ${league}:`, e);
    return [];
  }
};

const teamIdToName = {
  'pl-arsenal': 'Arsenal', 'pl-chelsea': 'Chelsea', 'pl-liverpool': 'Liverpool',
  'pl-man-city': 'Manchester City', 'pl-man-utd': 'Manchester United',
  'pl-tottenham': 'Tottenham', 'pl-newcastle': 'Newcastle', 'pl-aston-villa': 'Aston Villa',
  'pl-brighton': 'Brighton', 'pl-west-ham': 'West Ham', 'pl-everton': 'Everton',
  'pl-wolves': 'Wolves',
  'll-real-madrid': 'Real Madrid', 'll-barcelona': 'Barcelona', 'll-atletico': 'Atlético',
  'll-sevilla': 'Sevilla', 'll-real-sociedad': 'Real Sociedad', 'll-villarreal': 'Villarreal',
  'll-athletic': 'Athletic', 'll-betis': 'Betis', 'll-valencia': 'Valencia',
  'll-celta': 'Celta', 'll-getafe': 'Getafe', 'll-osasuna': 'Osasuna',
};

const getTeamAbbr = (teamId) => {
  const parts = teamId.split('-');
  parts.shift();
  return parts.join('-');
};

const findEntryForTeam = (entries, teamId) => {
  if (teamId.startsWith('intl-')) {
    const teamName = teamId.replace('intl-', '').replace(/-/g, ' ').toUpperCase();
    return entries.find(e => {
      const displayName = (e.team?.displayName || '').toUpperCase();
      return displayName.includes(teamName) || displayName === teamName;
    });
  }
  if (teamId.startsWith('pl-') || teamId.startsWith('ll-')) {
    const teamName = teamIdToName[teamId];
    if (teamName) {
      return entries.find(e => {
        const displayName = (e.team?.displayName || '').toLowerCase();
        return displayName.includes(teamName.toLowerCase());
      });
    }
  }
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

const TEAM_COLOR_OVERRIDES = {
  'nhl-dal': '006D60',
};

function TeamStandingCard({ team, standing, loading }) {
  const leagueIcon = LEAGUES[team.league]?.icon || '🏆';

  const staticTeamData = team.league === 'F1'
    ? LEAGUES.F1.teams?.find(t => t.id === team.team_id)
    : null;

  const logoUrl = team.logo_url || staticTeamData?.logo || null;

  // standing.team?.color is the ESPN-provided team color (hex without #)
  const espnColor = standing?.team?.color;

  const rawColor = TEAM_COLOR_OVERRIDES[team.team_id]
    || espnColor
    || team.color
    || staticTeamData?.color
    || LEAGUES[team.league]?.color?.replace('#', '');
  const borderColor = rawColor ? `#${rawColor.replace('#', '')}` : '#e5e7eb';

  const isHockey = team.league === 'NHL';
  const isSoccer = ['Premier League', 'La Liga', 'MLS'].includes(team.league);
  const isBaseball = team.league === 'MLB';

  const stats = standing?.stats;
  const w = stats ? getStat(stats, 'wins', 'W') : '—';
  const l = stats ? getStat(stats, 'losses', 'L') : '—';
  const otl = stats ? getStat(stats, 'otLosses', 'OTL') : null;
  const pct = stats ? getStat(stats, 'winPercent', 'PCT') : '—';
  const pts = stats ? getStat(stats, 'points', 'PTS') : '—';

  const teamUrl = createPageUrl(`TeamDetails?team_id=${team.team_id}&team_name=${encodeURIComponent(team.team_name)}&league=${encodeURIComponent(team.league)}`);

  return (
    <Link to={teamUrl}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
        style={{ border: `3px solid ${borderColor}` }}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3 mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={team.team_name} className="w-10 h-10 object-contain flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0">{leagueIcon}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{team.team_name}</div>
              <div className="text-xs text-gray-400">{team.league}</div>
            </div>
          </div>

          {!loading && standing && (standing.conferenceRank || standing.divisionRank) && (
            <div className="text-xs text-gray-500 space-y-0.5 mb-2">
              {standing.conferenceRank && (
                <div>Conf: <span className="font-semibold text-gray-700">#{standing.conferenceRank}</span></div>
              )}
              {standing.divisionRank && (
                <div>Div: <span className="font-semibold text-gray-700">#{standing.divisionRank}</span></div>
              )}
            </div>
          )}

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
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function TeamsOverview({ favoriteTeams }) {
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [leagueOrder, setLeagueOrder] = useState([]);

  useEffect(() => {
    if (!favoriteTeams.length) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const leagues = [...new Set(favoriteTeams.map(t => t.league))];
      const leagueEntries = {};
      await Promise.all(leagues.map(async league => {
        leagueEntries[league] = await fetchLeagueStandings(league);
      }));
      const result = {};
      favoriteTeams.forEach(team => {
        const entries = leagueEntries[team.league] || [];
        const entry = findEntryForTeam(entries, team.team_id);
        result[team.team_id] = entry || null;
      });
      setStandings(result);
      setLoading(false);
    };
    load();
  }, [favoriteTeams.map(t => t.team_id).join(',')]);

  // Group by league
  const byLeague = favoriteTeams.reduce((acc, t) => {
    if (!acc[t.league]) acc[t.league] = [];
    acc[t.league].push(t);
    return acc;
  }, {});

  const availableLeagues = Object.keys(byLeague);

  const orderedLeagues = [
    ...leagueOrder.filter(l => availableLeagues.includes(l)),
    ...availableLeagues.filter(l => !leagueOrder.includes(l)),
  ];

  useEffect(() => {
    setLeagueOrder(prev => [
      ...prev.filter(l => availableLeagues.includes(l)),
      ...availableLeagues.filter(l => !prev.includes(l)),
    ]);
  }, [availableLeagues.join(',')]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(orderedLeagues);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setLeagueOrder(newOrder);
  };

  if (favoriteTeams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
        <p className="text-gray-500">Add teams to see their standings here</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="leagues">
        {(provided) => (
          <div className="space-y-6" ref={provided.innerRef} {...provided.droppableProps}>
            {orderedLeagues.map((league, index) => {
              const teams = byLeague[league];
              return (
                <Draggable key={league} draggableId={league} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`rounded-2xl transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{league}</span>
                      </div>
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
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}