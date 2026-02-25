import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LEAGUES } from './teamsData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
const colorsCache = {};
let ncaafApRankingsCache = null;

const fetchNCAAFApRankings = async () => {
  if (ncaafApRankingsCache) return ncaafApRankingsCache;
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings');
    if (!res.ok) return {};
    const data = await res.json();
    const apPoll = data.rankings?.find(r => r.type === 'ap');
    const map = {};
    apPoll?.ranks?.forEach(r => {
      if (r.team?.abbreviation) map[r.team.abbreviation.toUpperCase()] = r.current;
    });
    ncaafApRankingsCache = map;
    return map;
  } catch (e) {
    return {};
  }
};

// NBA division group IDs: Southwest=26, Northwest=27, Pacific=25, Atlantic=1, Central=2, Southeast=3
const NBA_DIVISION_GROUPS = [
  { id: 25, conf: 'Western Conference', div: 'Pacific' },
  { id: 26, conf: 'Western Conference', div: 'Southwest' },
  { id: 27, conf: 'Western Conference', div: 'Northwest' },
  { id: 1,  conf: 'Eastern Conference', div: 'Atlantic' },
  { id: 2,  conf: 'Eastern Conference', div: 'Central' },
  { id: 3,  conf: 'Eastern Conference', div: 'Southeast' },
];

const fetchNBAStandings = async () => {
  const allEntries = [];
  await Promise.all(NBA_DIVISION_GROUPS.map(async ({ id, conf, div }) => {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?group=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const divEntries = data.standings?.entries || [];
      // Sort by win percentage descending to get correct division rank
      const sorted = [...divEntries].sort((a, b) =>
        parseFloat(b.stats?.find(s => s.name === 'winPercent')?.value ?? 0) -
        parseFloat(a.stats?.find(s => s.name === 'winPercent')?.value ?? 0)
      );
      sorted.forEach((entry, rank) => {
        allEntries.push({ ...entry, _confName: conf, _divName: div, _divRank: rank + 1 });
      });
    } catch {}
  }));
  // Compute conference rank
  const confMap = {};
  allEntries.forEach(e => {
    if (!confMap[e._confName]) confMap[e._confName] = [];
    confMap[e._confName].push(e);
  });
  Object.values(confMap).forEach(list => {
    list.sort((a, b) => parseFloat(b.stats?.find(s => s.name === 'wins')?.value ?? 0) - parseFloat(a.stats?.find(s => s.name === 'wins')?.value ?? 0));
    list.forEach((e, i) => { e._confRank = i + 1; });
  });
  return allEntries;
};

const fetchLeagueStandings = async (league) => {
  if (standingsCache[league]) return standingsCache[league];
  const path = STANDINGS_PATHS[league];
  if (!path) return [];
  try {
    if (league === 'NBA') {
      const entries = await fetchNBAStandings();
      standingsCache[league] = entries;
      return entries;
    }

    const url = `https://site.api.espn.com/apis/v2/sports/${path}/standings?level=3`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    // Walk the hierarchy: top-level = conference, next = division
    const entries = [];
    const topGroups = data.children || [data];
    topGroups.forEach((confGroup) => {
      const confName = confGroup.name || null;
      const divGroups = confGroup.children || [];

      if (divGroups.length > 0) {
        // Has divisions under conference
        divGroups.forEach((divGroup) => {
          const divName = divGroup.name || null;
          const divEntries = divGroup.standings?.entries || [];
          divEntries.forEach((entry, rank) => {
            entries.push({
              ...entry,
              _confName: confName,
              _divName: divName,
              _divRank: rank + 1,
            });
          });
        });
      } else {
        // No divisions, entries are directly under conference
        const confEntries = confGroup.standings?.entries || [];
        confEntries.forEach((entry, rank) => {
          entries.push({
            ...entry,
            _confName: confName,
            _divName: null,
            _divRank: rank + 1,
          });
        });
      }
    });

    // Compute conference rank per conference
    const confEntriesMap = {};
    entries.forEach(e => {
      if (e._confName) {
        if (!confEntriesMap[e._confName]) confEntriesMap[e._confName] = [];
        confEntriesMap[e._confName].push(e);
      }
    });
    // Sort by points or wins descending to assign conf rank
    Object.values(confEntriesMap).forEach(confEntries => {
      confEntries.sort((a, b) => {
        const getPts = (e) => parseFloat(e.stats?.find(s => s.name === 'points' || s.name === 'wins')?.value ?? 0);
        return getPts(b) - getPts(a);
      });
      confEntries.forEach((e, i) => { e._confRank = i + 1; });
    });

    standingsCache[league] = entries;
    return entries;
  } catch (e) {
    return [];
  }
};

// Returns { ABBR: 'hexcolor' } from ESPN teams endpoint
const fetchLeagueTeamColors = async (league) => {
  if (colorsCache[league]) return colorsCache[league];
  const path = STANDINGS_PATHS[league];
  if (!path) return {};
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/teams?limit=100`);
    if (!res.ok) return {};
    const data = await res.json();
    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    const map = {};
    teams.forEach(({ team }) => {
      if (team?.abbreviation) map[team.abbreviation.toUpperCase()] = team.color || null;
    });
    colorsCache[league] = map;
    return map;
  } catch (e) {
    return {};
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

  // Soccer teams (both old pl-/ll- prefix style and new premier-league-/la-liga- style)
  // Extract the ESPN abbreviation from the end of the team_id
  const soccerPrefixes = ['premier-league-', 'la-liga-', 'pl-', 'll-', 'mls-'];
  const isSoccer = soccerPrefixes.some(p => teamId.startsWith(p));
  if (isSoccer) {
    // The abbreviation is the last segment after the prefix
    const prefix = soccerPrefixes.find(p => teamId.startsWith(p));
    const abbrFromId = teamId.slice(prefix.length).toUpperCase();
    // Try direct abbreviation match first
    const byAbbr = entries.find(e =>
      (e.team?.abbreviation || '').toUpperCase() === abbrFromId
    );
    if (byAbbr) return byAbbr;
    // Fallback: displayName contains the abbreviation slug
    return entries.find(e => {
      const displayName = (e.team?.displayName || '').toLowerCase();
      const slug = abbrFromId.toLowerCase().replace(/-/g, ' ');
      return displayName.includes(slug);
    });
  }

  // All other sports: match by abbreviation derived from team_id suffix
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

function TeamStandingCard({ team, standing, loading, resolvedColor, apRankings = {} }) {
  const leagueIcon = LEAGUES[team.league]?.icon || '🏆';

  const staticTeamData = team.league === 'F1'
    ? LEAGUES.F1.teams?.find(t => t.id === team.team_id)
    : null;

  const logoUrl = team.logo_url || staticTeamData?.logo || null;

  const rawColor = TEAM_COLOR_OVERRIDES[team.team_id]
    || resolvedColor
    || staticTeamData?.color
    || LEAGUES[team.league]?.color?.replace('#', '');
  const borderColor = rawColor ? `#${rawColor.replace('#', '')}` : '#e5e7eb';

  const isHockey = team.league === 'NHL';
  const isSoccer = ['Premier League', 'La Liga', 'MLS'].includes(team.league);
  const isBaseball = team.league === 'MLB';
  const isNCAAF = team.league === 'NCAAF';

  // AP ranking for NCAAF: look up by team abbreviation from the standing entry
  const ncaafAbbr = standing?.team?.abbreviation?.toUpperCase();
  const apRank = isNCAAF && ncaafAbbr ? apRankings[ncaafAbbr] || null : null;

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
        style={{ border: `3px solid ${borderColor}`, minHeight: '200px' }}
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

            </div>
          </div>

          {!loading && standing && (standing._confRank || standing._divRank || (isNCAAF && apRank)) && (
            <div className="flex gap-3 text-xs mb-1">
              {standing._confName && standing._confRank && (
                <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1 flex-1">
                  <span className="font-bold text-gray-900 text-sm">#{standing._confRank}</span>
                  <span className="text-gray-400 truncate max-w-full text-center" title={standing._confName}>
                    {standing._confName
                      .replace('National Football Conference', 'NFC')
                      .replace('American Football Conference', 'AFC')
                      .replace('Eastern Conference', 'East')
                      .replace('Western Conference', 'West')
                      .replace('Conference', 'Conf')}
                  </span>
                </div>
              )}
              {isNCAAF ? (
                apRank ? (
                  <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1 flex-1">
                    <span className="font-bold text-gray-900 text-sm">#{apRank}</span>
                    <span className="text-gray-400 text-center">AP Poll</span>
                  </div>
                ) : null
              ) : (
              standing._divRank && standing._divName && (
              <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1 flex-1">
                <span className="font-bold text-gray-900 text-sm">#{standing._divRank}</span>
                <span className="text-gray-400 truncate max-w-full text-center" title={standing._divName}>
                  {standing._divName.replace(' Division', '')}
                </span>
              </div>
              )
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
  const [teamColors, setTeamColors] = useState({});
  const [apRankings, setApRankings] = useState({});
  const [loading, setLoading] = useState(true);
  const [leagueOrder, setLeagueOrder] = useState([]);

  useEffect(() => {
    if (!favoriteTeams.length) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const leagues = [...new Set(favoriteTeams.map(t => t.league))];

      // Fetch standings, team colors, and AP rankings in parallel
      const [standingsList, colorsList, apMap] = await Promise.all([
        Promise.all(leagues.map(async l => ({ league: l, entries: await fetchLeagueStandings(l) }))),
        Promise.all(leagues.map(async l => ({ league: l, colors: await fetchLeagueTeamColors(l) }))),
        leagues.includes('NCAAF') ? fetchNCAAFApRankings() : Promise.resolve({}),
      ]);

      const entriesByLeague = {};
      standingsList.forEach(({ league, entries }) => { entriesByLeague[league] = entries; });

      // Keep per-league color maps (avoid cross-league abbreviation collisions)
      const colorsByLeague = {};
      colorsList.forEach(({ league, colors }) => { colorsByLeague[league] = colors; });

      const result = {};
      const colors = {};
      favoriteTeams.forEach(team => {
        const entries = entriesByLeague[team.league] || [];
        const entry = findEntryForTeam(entries, team.team_id);
        result[team.team_id] = entry || null;

        const leagueColorMap = colorsByLeague[team.league] || {};
        const abbrKey = entry?.team?.abbreviation?.toUpperCase()
          || getTeamAbbr(team.team_id).toUpperCase().replace(/-/g, '');
        const resolvedColor = leagueColorMap[abbrKey] || null;
        if (['Premier League', 'La Liga'].includes(team.league)) {
          console.log(`[COLOR] ${team.team_id} | entryAbbr=${entry?.team?.abbreviation} | abbrKey=${abbrKey} | colorMapKeys=${JSON.stringify(Object.keys(leagueColorMap))} | resolved=${resolvedColor}`);
        }
        colors[team.team_id] = resolvedColor;
      });

      setStandings(result);
      setTeamColors(colors);
      setApRankings(apMap);
      setLoading(false);
    };
    load();
  }, [favoriteTeams.map(t => t.team_id).join(',')]);

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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map(team => (
                          <TeamStandingCard
                           key={team.team_id}
                           team={team}
                           standing={standings[team.team_id]}
                           loading={loading}
                           resolvedColor={teamColors[team.team_id]}
                           apRankings={apRankings}
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