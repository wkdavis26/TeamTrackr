import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LEAGUES } from './teamsData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import F1StandingCard from './F1StandingCard';
import NFLStandingCard from './NFLStandingCard';

const STANDINGS_PATHS = {
  // NFL handled via api-sports backend function (NFLStandingCard)
  NHL:              'hockey/nhl',
  MLB:              'baseball/mlb',
  NBA:              'basketball/nba',
  WNBA:             'basketball/wnba',
  'Premier League': 'soccer/eng.1',
  'La Liga':        'soccer/esp.1',
  MLS:              'soccer/usa.1',
  NCAAF:            'football/college-football',
  NCAAB:            'basketball/mens-college-basketball',
  'NCAAB-Baseball': 'baseball/college-baseball',
  'FIFA World Cup': 'soccer/fifa.wc',
  'UEFA Euro':      'soccer/uefa.euro',
  'International':  'soccer/international',
};

const standingsCache = {}; // keyed by league
const colorsCache = {};
let ncaafApRankingsCache = null;

const fetchNCAAFApRankings = async () => {
  if (ncaafApRankingsCache) return ncaafApRankingsCache;
  try {
    const [footballRes, basketballRes] = await Promise.all([
      fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings'),
      fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings'),
    ]);
    const map = {};
    if (footballRes.ok) {
      const data = await footballRes.json();
      const apPoll = data.rankings?.find(r => r.type === 'ap');
      apPoll?.ranks?.forEach(r => {
        if (r.team?.abbreviation) map[r.team.abbreviation.toUpperCase()] = r.current;
      });
    }
    if (basketballRes.ok) {
      const data = await basketballRes.json();
      const apPoll = data.rankings?.find(r => r.type === 'ap');
      apPoll?.ranks?.forEach(r => {
        if (r.team?.abbreviation) map[r.team.abbreviation.toUpperCase()] = r.current;
      });
    }
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
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('leagueStandings', { league: 'NBA' });
    return res.data?.standings || [];
  } catch (e) {
    return [];
  }
};

const fetchLeagueStandings = async (league) => {
  if (league === 'NFL') return []; // NFL standings handled in NFLStandingCard
  if (standingsCache[league]) return standingsCache[league];
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('leagueStandings', { league });
    const entries = res.data?.standings || [];
    standingsCache[league] = entries;
    return entries;
  } catch (e) {
    return [];
  }
};

// Returns { ABBR: 'hexcolor' } from ESPN teams endpoint
const fetchLeagueTeamColors = async (league) => {
  if (league === 'NFL') return {}; // NFL colors handled in NFLStandingCard
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
  const soccerPrefixes = ['premier-league-', 'la-liga-', 'serie-a-', 'bundesliga-', 'mls-', 'pl-', 'll-'];
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

const SPLIT_TYPES = new Set(['home', 'away', 'road', 'neutral', 'streak', 'lastTen', 'lastFive', 'vsConf', 'vsDiv']);

const getStat = (stats, ...names) => {
  for (const name of names) {
    const exact = stats?.find(s =>
      (s.name === name || s.abbreviation === name) &&
      !SPLIT_TYPES.has(s.type)
    );
    if (exact) return exact.displayValue;
  }
  return '—';
};

// Parse overall W-L from the "total" record summary (most reliable source)
const getWLFromSummary = (stats) => {
  const totalRecord = stats?.find(s => s.type === 'total');
  if (totalRecord?.summary) {
    const parts = totalRecord.summary.split('-');
    if (parts.length === 2) return { w: parts[0], l: parts[1] };
  }
  return null;
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
  const isNBA = team.league === 'NBA' || team.league === 'WNBA';
  const isNCAAF = team.league === 'NCAAF';
  const isNCAAB = team.league === 'NCAAB';

  // AP ranking for NCAAF/NCAAB
  const ncaaAbbr = standing?.team?.abbreviation?.toUpperCase();
  const apRank = (isNCAAF || isNCAAB) && ncaaAbbr ? apRankings[ncaaAbbr] || null : null;

  const stats = standing?.stats;
  const wlSummary = (isNCAAF || isNCAAB) ? getWLFromSummary(stats) : null;
  const w = wlSummary ? wlSummary.w : (stats ? getStat(stats, 'wins', 'W') : '—');
  const l = wlSummary ? wlSummary.l : (stats ? getStat(stats, 'losses', 'L') : '—');
  const otl = stats ? getStat(stats, 'otLosses', 'OTL') : null;
  const pct = stats ? getStat(stats, 'winPercent', 'PCT') : '—';
  const pts = stats ? getStat(stats, 'points', 'PTS') : '—';
  const gb = stats ? getStat(stats, 'gamesBehind', 'GB') : '—';

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

          {!loading && standing && (standing._confRank || standing._divRank || ((isNCAAF || isNCAAB) && apRank)) && (
            <div className="flex gap-3 text-xs mb-1">
              {standing._confName && standing._confRank && (
                <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1 flex-1">
                  <span className="font-bold text-gray-900 text-sm">#{standing._confRank}</span>
                  <span className="text-gray-400 truncate max-w-full text-center" title={standing._confName}>
                    {standing._confName
                      .replace('National Football Conference', 'NFC')
                      .replace('American Football Conference', 'AFC')
                      .replace('Eastern Conference', 'East Conf.')
                      .replace('Western Conference', 'West Conf.')
                      .replace('Conference', 'Conf.')}
                  </span>
                  {isHockey && standing._confPtsBack != null && (
                    <span className="text-gray-400 text-xs">{standing._confPtsBack === 0 ? 'Leader' : `-${standing._confPtsBack} pts`}</span>
                  )}
                  {isNBA && standing._confGamesBack != null && (
                    <span className="text-gray-400 text-xs">{standing._confGamesBack === 0 ? 'Leader' : `${standing._confGamesBack % 1 === 0 ? standing._confGamesBack : standing._confGamesBack.toFixed(1)} GB`}</span>
                  )}
                </div>
              )}
              {(isNCAAF || isNCAAB) ? (
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
                  {standing._divName.replace(' Division', ' Div.').replace(/^(\w+)$/, '$1 Div.')}
                </span>
                {isHockey && standing._divPtsBack != null && (
                  <span className="text-gray-400 text-xs">{standing._divPtsBack === 0 ? 'Leader' : `-${standing._divPtsBack} pts`}</span>
                )}
                {isNBA && standing._divGamesBack != null && (
                  <span className="text-gray-400 text-xs">{standing._divGamesBack === 0 ? 'Leader' : `${standing._divGamesBack % 1 === 0 ? standing._divGamesBack : standing._divGamesBack.toFixed(1)} GB`}</span>
                )}
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
            ) : isNBA ? (
              <div className="grid grid-cols-2 gap-1 text-center">
                {[['W', w], ['L', l]].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-base font-bold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-1 text-center ${(isNCAAF || isNCAAB || team.league === 'NFL') ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {[['W', w], ['L', l], ...(isNCAAF || isNCAAB || team.league === 'NFL' ? [] : [isBaseball ? ['GB', gb] : ['PCT', pct]])].map(([label, val]) => (
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
      // Deduplicate teams by team_id to prevent duplicate key issues
      const uniqueTeams = Array.from(new Map(favoriteTeams.map(t => [t.team_id, t])).values());
      const leagues = [...new Set(uniqueTeams.map(t => t.league))];

      // Fetch standings, team colors, and AP rankings in parallel
      const [standingsList, colorsList, apMap] = await Promise.all([
        Promise.all(leagues.map(async l => ({ league: l, entries: await fetchLeagueStandings(l) }))),
        Promise.all(leagues.map(async l => ({ league: l, colors: await fetchLeagueTeamColors(l) }))),
        (leagues.includes('NCAAF') || leagues.includes('NCAAB')) ? fetchNCAAFApRankings() : Promise.resolve({}),
      ]);

      const entriesByLeague = {};
      standingsList.forEach(({ league, entries }) => { entriesByLeague[league] = entries; });

      // Keep per-league color maps (avoid cross-league abbreviation collisions)
      const colorsByLeague = {};
      colorsList.forEach(({ league, colors }) => { colorsByLeague[league] = colors; });

      const result = {};
      const colors = {};
      uniqueTeams.forEach(team => {
        const entries = entriesByLeague[team.league] || [];
        const entry = findEntryForTeam(entries, team.team_id);
        result[team.team_id] = entry || null;

        const leagueColorMap = colorsByLeague[team.league] || {};
        const abbrKey = entry?.team?.abbreviation?.toUpperCase()
          || getTeamAbbr(team.team_id).toUpperCase().replace(/-/g, '');
        const resolvedColor = leagueColorMap[abbrKey] || null;
        colors[team.team_id] = resolvedColor;
      });

      setStandings(result);
      setTeamColors(colors);
      setApRankings(apMap);
      setLoading(false);
    };
    load();
  }, [favoriteTeams.map(t => t.team_id).sort().join(',')]);

  // Deduplicate teams by team_id
  const uniqueTeams = Array.from(new Map(favoriteTeams.map(t => [t.team_id, t])).values());
  
  const byLeague = uniqueTeams.reduce((acc, t) => {
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
                          league === 'F1' ? (
                            <F1StandingCard key={team.team_id} team={team} />
                          ) : league === 'NFL' ? (
                            <NFLStandingCard key={team.team_id} team={team} />
                          ) : (
                          <TeamStandingCard
                           key={team.team_id}
                           team={team}
                           standing={standings[team.team_id]}
                           loading={loading}
                           resolvedColor={teamColors[team.team_id]}
                           apRankings={apRankings}
                          />
                          )
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