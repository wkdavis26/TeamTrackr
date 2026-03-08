import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays, addMonths } from 'date-fns';
import { LEAGUES } from './teamsData';
import GameCard from './GameCard';

// ESPN league logo URLs
const LEAGUE_LOGOS = {
  NFL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png&w=80&h=80',
  NHL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png&w=80&h=80',
  MLB: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png&w=80&h=80',
  NBA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png&w=80&h=80',
  WNBA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/wnba.png&w=80&h=80',
  'Premier League': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/23.png&w=80&h=80',
  'La Liga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/15.png&w=80&h=80',
  'Serie A': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/12.png&w=80&h=80',
  'Bundesliga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/10.png&w=80&h=80',
  'Champions League': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/2.png&w=80&h=80',
  MLS: 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/19.png&w=80&h=80',
  NWSL: 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/182.png&w=80&h=80',
  'International Football': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/4.png&w=80&h=80',
  NCAAF: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/ncf.png&w=80&h=80',
  NCAAB: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mens-college-basketball.png&w=80&h=80',
  'NCAAB-Baseball': 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/college-baseball.png&w=80&h=80',
  F1: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png&w=80&h=80',
  PGA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/pga.png&w=80&h=80',
  PWHL: 'https://1000logos.net/wp-content/uploads/2024/10/PWHL-Logo-500x281.png',
};

// PWHL team data (static, since ESPN doesn't support PWHL)
const PWHL_TEAMS_DATA = {
  'pwhl-1': { name: 'Boston Fleet', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/1.png', color: '0B2D6E' },
  'pwhl-2': { name: 'Minnesota Frost', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/2.png', color: '154734' },
  'pwhl-3': { name: 'Montréal Victoire', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/3.png', color: 'A6192E' },
  'pwhl-4': { name: 'New York Sirens', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/4.png', color: '00539B' },
  'pwhl-5': { name: 'Ottawa Charge', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/5.png', color: '000000' },
  'pwhl-6': { name: 'Toronto Sceptres', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/6.png', color: '702F8A' },
  'pwhl-8': { name: 'Seattle Torrent', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/8.png', color: '005C8A' },
  'pwhl-9': { name: 'Vancouver Goldeneyes', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/9.png', color: '005C2E' },
};
const PWHL_LSID = { '1': 'pwhl-1', '2': 'pwhl-2', '3': 'pwhl-3', '4': 'pwhl-4', '5': 'pwhl-5', '6': 'pwhl-6', '8': 'pwhl-8', '9': 'pwhl-9' };

const LeagueLogo = ({ leagueKey, size = 'md' }) => {
  const [imgError, setImgError] = React.useState(false);
  const logo = LEAGUE_LOGOS[leagueKey];
  const league = LEAGUES[leagueKey];
  const sizeClass = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={league?.name || leagueKey}
        className={`${sizeClass} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }
  return <span className="text-2xl">{league?.icon || '🏆'}</span>;
};

const LEAGUE_SCOREBOARD_PATHS = {
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NBA: 'basketball/nba',
  'Premier League': 'soccer/eng.1',
  'La Liga': 'soccer/esp.1',
  'Serie A': 'soccer/ita.1',
  'Bundesliga': 'soccer/ger.1',
  'Champions League': 'soccer/uefa.champions',
  MLS: 'soccer/usa.1',
  NWSL: 'soccer/usa.nwsl',
  NCAAF: 'football/college-football',
  WNBA: 'basketball/wnba',
  NCAAB: 'basketball/mens-college-basketball',
  'NCAAB-Baseball': 'baseball/college-baseball',
};

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

async function fetchF1Games() {
  const now = new Date();
  const end = addMonths(now, 1);
  const startStr = fmtDate(now);
  const endStr = fmtDate(end);
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard?limit=500&dates=${startStr}-${endStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = [];
    for (const event of (data.events || [])) {
      const competition = event.competitions?.[0];
      const venue = competition?.venue?.fullName || event.circuit?.fullName || 'TBD';
      const countryName = event.circuit?.address?.country || event.circuit?.address?.city || event.name || '';
      // Each event may have multiple competitions (sessions)
      const competitions = event.competitions || [];
      const sessions = competitions.length > 0 ? competitions : [competition].filter(Boolean);
      for (const session of sessions) {
        if (!session) continue;
        const sessionDate = new Date(session.date || event.date);
        if (sessionDate <= now) continue;
        // Determine session type from session type abbreviation
        const abbr = session.type?.abbreviation || 'Race';
        const SESSION_LABELS = {
          'FP1': 'Practice 1', 'FP2': 'Practice 2', 'FP3': 'Practice 3',
          'Qual': 'Qualifying', 'SQ': 'Sprint Qualifying', 'Sprint': 'Sprint Qualifying',
          'SR': 'Sprint Race', 'Race': 'Race',
        };
        const sessionLabel = SESSION_LABELS[abbr] || abbr;
        results.push({
          id: `${event.id}-${session.id || sessionName}`,
          date: sessionDate,
          league: 'F1',
          leagueIcon: '🏎️',
          isF1Race: true,
          f1Country: countryName,
          f1Session: sessionLabel,
          homeTeam: { id: 'f1', name: 'F1', logo: null, color: 'E10600' },
          awayTeam: { id: 'f1', name: 'F1', logo: null, color: 'E10600' },
          favoriteTeamId: null,
          venue: session.venue?.fullName || venue,
          status: session.status?.type?.description || 'Scheduled',
          isPreseason: false,
          broadcasts: null,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// European leagues that should also show Champions League games
const EUROPEAN_LEAGUES = new Set(['Premier League', 'La Liga', 'Serie A', 'Bundesliga']);

const parseESPNEvents = (events, leagueKey, now) => {
  return events.map(event => {
    const competition = event.competitions?.[0];
    if (!competition) return null;
    const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
    if (!homeTeam || !awayTeam) return null;
    const gameDate = new Date(event.date);
    if (gameDate <= now) return null;
    const broadcasts = (competition.broadcasts || [])
      .flatMap(b => b.names || [b.market || b.type].filter(Boolean));
    const getRecord = (competitor) => {
      const rec = competitor.records?.find(r => r.type === 'total' || !r.type);
      return rec?.summary || null;
    };
    return {
      id: event.id,
      date: gameDate,
      league: leagueKey,
      leagueIcon: LEAGUES[leagueKey]?.icon || '🏆',
      homeTeam: {
        id: homeTeam.team?.abbreviation,
        name: homeTeam.team?.displayName || homeTeam.team?.name,
        logo: homeTeam.team?.logo,
        color: homeTeam.team?.color,
        record: getRecord(homeTeam),
      },
      awayTeam: {
        id: awayTeam.team?.abbreviation,
        name: awayTeam.team?.displayName || awayTeam.team?.name,
        logo: awayTeam.team?.logo,
        color: awayTeam.team?.color,
        record: getRecord(awayTeam),
      },
      favoriteTeamId: homeTeam.team?.abbreviation,
      venue: competition.venue?.fullName || 'TBD',
      status: event.status?.type?.description || 'Scheduled',
      isPreseason: event.season?.type === 1 || event.seasonType?.type?.id === '1',
      broadcasts: broadcasts.length > 0 ? broadcasts : null,
    };
  }).filter(Boolean);
};

async function fetchPGAGames() {
  const now = new Date();
  const end = addMonths(now, 1);
  const startStr = fmtDate(now);
  const endStr = fmtDate(end);
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?limit=50&dates=${startStr}-${endStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = [];
    for (const event of (data.events || [])) {
      const comps = event.competitions || [];
      if (comps.length === 0) continue;
      
      // Create separate entry for each round
      comps.forEach((comp, idx) => {
        const compDate = new Date(comp.date);
        if (compDate <= now) return;
        
        const venueName = comp?.venue?.fullName || event.venue?.fullName;
        const venueCity = comp?.venue?.address?.city || comp?.venue?.address?.summary;
        const venue = venueName || venueCity || event.location || event.name?.replace(/\d{4}\s*/, '') || 'TBD';
        
        const roundType = comp.type?.text || comp.type?.abbreviation || `Round ${idx + 1}`;
        
        results.push({
          id: `${event.id}-round-${idx}`,
          date: compDate,
          league: 'PGA',
          leagueIcon: '⛳',
          isPGA: true,
          pgaRound: roundType,
          homeTeam: { id: 'pga', name: event.name || 'PGA Tour', logo: null, color: '1a4731' },
          awayTeam: { id: 'pga', name: event.name || 'PGA Tour', logo: null, color: '1a4731' },
          favoriteTeamId: null,
          venue,
          pgaEventName: event.shortName || event.name || 'PGA Tour Event',
          status: comp.status?.type?.description || 'Scheduled',
          isPreseason: false,
          broadcasts: null,
        });
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchPWHLGames() {
  try {
    const res = await fetch('https://lscluster.hockeytech.com/feed/index.php?feed=modulekit&view=schedule&key=446521baf8c38984&fmt=json&client_code=pwhl&lang_id=1&season_id=8&team_id=0&league_id=1');
    const data = res.ok ? await res.json() : null;
    const games = data?.SiteKit?.Schedule || [];
    return games.map(game => {
      const homeId = PWHL_LSID[String(game.home_team)];
      const awayId = PWHL_LSID[String(game.visiting_team)];
      if (!homeId || !awayId) return null;
      // Skip completed games
      if (game.final === '1' || game.game_status === 'Final' || game.game_status === 'Final OT') return null;
      const gameDate = new Date(game.GameDateISO8601 || game.date_with_timezone || (game.date_played + 'T12:00:00'));
      if (isNaN(gameDate.getTime())) return null;
      return {
        id: `pwhl-${game.game_id}`,
        date: gameDate,
        league: 'PWHL',
        leagueIcon: '🏒',
        homeTeam: { id: homeId, name: PWHL_TEAMS_DATA[homeId]?.name || homeId, logo: PWHL_TEAMS_DATA[homeId]?.logo, color: PWHL_TEAMS_DATA[homeId]?.color },
        awayTeam: { id: awayId, name: PWHL_TEAMS_DATA[awayId]?.name || awayId, logo: PWHL_TEAMS_DATA[awayId]?.logo, color: PWHL_TEAMS_DATA[awayId]?.color },
        favoriteTeamId: homeId,
        venue: game.venue_name || game.venue || 'TBD',
        status: game.game_status || 'Scheduled',
        isPreseason: false,
      };
    }).filter(Boolean).sort((a, b) => a.date - b.date);
  } catch {
    return [];
  }
}

async function fetchLeagueAllGames(leagueKey) {
  if (leagueKey === 'F1') return fetchF1Games();
  if (leagueKey === 'PGA') return fetchPGAGames();
  if (leagueKey === 'PWHL') return fetchPWHLGames();
  const path = LEAGUE_SCOREBOARD_PATHS[leagueKey];
  if (!path) return [];
  const now = new Date();
  const end = addMonths(now, 1);
  const startStr = fmtDate(now);
  const endStr = fmtDate(end);

  try {
    const fetches = [fetch(`${ESPN_BASE}/${path}/scoreboard?limit=500&dates=${startStr}-${endStr}`)];

    // Also fetch Champions League and domestic cups for European domestic leagues
    if (EUROPEAN_LEAGUES.has(leagueKey)) {
      fetches.push(fetch(`${ESPN_BASE}/soccer/uefa.champions/scoreboard?limit=500&dates=${startStr}-${endStr}`));
      
      // Add domestic cup fetches
      const cupPaths = {
        'Premier League': 'soccer/eng.fa',
        'La Liga': 'soccer/esp.copa',
        'Serie A': 'soccer/ita.coppa',
        'Bundesliga': 'soccer/ger.dfb',
      };
      if (cupPaths[leagueKey]) {
        fetches.push(fetch(`${ESPN_BASE}/${cupPaths[leagueKey]}/scoreboard?limit=500&dates=${startStr}-${endStr}`));
      }
    }

    const responses = await Promise.all(fetches);
    const [leagueData, uclData, cupData] = await Promise.all(responses.map(r => r.ok ? r.json() : {}));

    const leagueEvents = parseESPNEvents(leagueData.events || [], leagueKey, now);
    const uclEvents = uclData
      ? parseESPNEvents(uclData.events || [], leagueKey, now).map(g => ({ ...g, isChampionsLeague: true, competitionLabel: 'UEFA Champions League' }))
      : [];
    
    const cupLabels = {
      'Premier League': 'FA Cup',
      'La Liga': 'Copa del Rey',
      'Serie A': 'Coppa Italia',
      'Bundesliga': 'DFB-Pokal',
    };
    
    const cupEvents = cupData
      ? parseESPNEvents(cupData.events || [], leagueKey, now).map(g => ({ ...g, isDomesticCup: true, competitionLabel: cupLabels[leagueKey] || 'Cup' }))
      : [];

    // Merge and deduplicate by id
    const seenIds = new Set();
    const merged = [];
    for (const g of [...leagueEvents, ...uclEvents, ...cupEvents]) {
      if (!seenIds.has(g.id)) {
        seenIds.add(g.id);
        merged.push(g);
      }
    }

    return merged.sort((a, b) => a.date - b.date);
  } catch {
    return [];
  }
}

const getCTDateKey = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(date));

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const dateSuffix = format(date, "MMMM d");
  if (isToday(date)) return `Today, ${dateSuffix}`;
  if (isTomorrow(date)) return `Tomorrow, ${dateSuffix}`;
  const days = differenceInDays(date, new Date());
  if (days < 7) return `${format(date, "EEEE")}, ${dateSuffix}`;
  return format(date, "EEEE, MMMM d");
};

function LeagueDetail({ leagueKey, onBack }) {
  const league = LEAGUES[leagueKey];
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['leagueAllGames', leagueKey, todayStr],
    queryFn: () => fetchLeagueAllGames(leagueKey),
    staleTime: 1000 * 60 * 5,
  });

  const grouped = games.reduce((acc, game) => {
    const key = getCTDateKey(game.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">All Leagues</span>
      </button>

      <div className="flex items-center gap-3 mb-6">
        <LeagueLogo leagueKey={leagueKey} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{league?.name || leagueKey}</h2>
          {!isLoading && <p className="text-sm text-gray-500">{games.length} games in the next month</p>}
        </div>
        {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin ml-2" />}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-2" />
          <span className="text-gray-500">Loading games...</span>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No upcoming games in the next month.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateStr => (
            <div key={dateStr}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-600">{getDateLabel(dateStr)}</h3>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{grouped[dateStr].length} games</span>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {grouped[dateStr].map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const SPORT_GROUPS = [
  { label: 'Football', keys: ['NFL', 'NCAAF'] },
  { label: 'Basketball', keys: ['NBA', 'WNBA', 'NCAAB'] },
  { label: 'Baseball', keys: ['MLB', 'NCAAB-Baseball'] },
  { label: 'Hockey', keys: ['NHL', 'PWHL'] },
  { label: 'Soccer', keys: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Champions League', 'MLS', 'NWSL', 'International Football'] },
  { label: 'Motorsport', keys: ['F1'] },
  { label: 'Golf', keys: ['PGA'] },
];

function LeagueList({ leagues, onSelect }) {
  const leagueSet = new Set(leagues);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">All Games</h2>
        <p className="text-gray-500">Select a league to view all upcoming games</p>
      </div>
      <div className="space-y-6">
        {SPORT_GROUPS.map(group => {
          const groupLeagues = group.keys.filter(k => leagueSet.has(k));
          if (groupLeagues.length === 0) return null;
          return (
            <div key={group.label}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.label}</h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {groupLeagues.map(leagueKey => {
                  const league = LEAGUES[leagueKey];
                  return (
                    <motion.button
                      key={leagueKey}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect(leagueKey)}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <LeagueLogo leagueKey={leagueKey} />
                        <span className="font-semibold text-gray-900">{league?.name || leagueKey}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function LeagueGames({ favoriteTeams }) {
  const [selectedLeague, setSelectedLeague] = useState(null);

  const leagues = [...Object.keys(LEAGUE_SCOREBOARD_PATHS), 'F1', 'PGA', 'PWHL'];

  if (leagues.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No supported leagues</h3>
        <p className="text-gray-500">Add teams from supported leagues to see all games</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {selectedLeague ? (
        <LeagueDetail
          key={selectedLeague}
          leagueKey={selectedLeague}
          onBack={() => setSelectedLeague(null)}
        />
      ) : (
        <LeagueList
          key="list"
          leagues={leagues}
          onSelect={setSelectedLeague}
        />
      )}
    </AnimatePresence>
  );
}