// Sports API Service - fetches real schedule data from ESPN and NHL APIs
import { LEAGUES } from './teamsData';


// ESPN API base URLs (no auth required)
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Team ID mappings for ESPN
const ESPN_TEAM_IDS = {
  // NFL
  'nfl-chiefs': 12, 'nfl-49ers': 25, 'nfl-eagles': 21, 'nfl-cowboys': 6,
  'nfl-bills': 2, 'nfl-ravens': 33, 'nfl-lions': 8, 'nfl-dolphins': 15,
  'nfl-packers': 9, 'nfl-jets': 20, 'nfl-giants': 19, 'nfl-patriots': 17,
  
  // NHL
  'nhl-bruins': 1, 'nhl-rangers': 3, 'nhl-maple-leafs': 10, 'nhl-canadiens': 8,
  'nhl-penguins': 5, 'nhl-blackhawks': 4, 'nhl-kings': 26, 'nhl-oilers': 22,
  'nhl-lightning': 14, 'nhl-avalanche': 17, 'nhl-panthers': 13, 'nhl-stars': 25,
  
  // MLB
  'mlb-yankees': 10, 'mlb-red-sox': 2, 'mlb-dodgers': 19, 'mlb-cubs': 16,
  'mlb-giants': 26, 'mlb-cardinals': 24, 'mlb-astros': 18, 'mlb-braves': 15,
  'mlb-mets': 21, 'mlb-phillies': 22, 'mlb-padres': 25, 'mlb-mariners': 12,
  
  // NBA
  'nba-lakers': 13, 'nba-celtics': 2, 'nba-warriors': 9, 'nba-bulls': 4,
  'nba-heat': 14, 'nba-knicks': 18, 'nba-nets': 17, 'nba-76ers': 20,
  'nba-bucks': 15, 'nba-nuggets': 7, 'nba-suns': 21, 'nba-mavs': 6,
};

// NHL team ID to abbreviation mapping
const NHL_ID_TO_ABBR = {
  'nhl-bruins': 'BOS', 'nhl-rangers': 'NYR', 'nhl-maple-leafs': 'TOR', 'nhl-canadiens': 'MTL',
  'nhl-penguins': 'PIT', 'nhl-blackhawks': 'CHI', 'nhl-kings': 'LAK', 'nhl-oilers': 'EDM',
  'nhl-lightning': 'TBL', 'nhl-avalanche': 'COL', 'nhl-panthers': 'FLA', 'nhl-stars': 'DAL',
  'nhl-capitals': 'WSH', 'nhl-flyers': 'PHI', 'nhl-devils': 'NJD', 'nhl-islanders': 'NYI',
  'nhl-hurricanes': 'CAR', 'nhl-blue-jackets': 'CBJ', 'nhl-wild': 'MIN', 'nhl-predators': 'NSH',
  'nhl-blues': 'STL', 'nhl-jets': 'WPG', 'nhl-coyotes': 'UTA', 'nhl-sharks': 'SJS',
  'nhl-ducks': 'ANA', 'nhl-flames': 'CGY', 'nhl-canucks': 'VAN', 'nhl-golden-knights': 'VGK',
  'nhl-kraken': 'SEA', 'nhl-senators': 'OTT', 'nhl-sabres': 'BUF', 'nhl-red-wings': 'DET',
};

// Premier League team IDs (from ESPN soccer)
const PL_TEAM_IDS = {
  'pl-arsenal': 359, 'pl-chelsea': 363, 'pl-liverpool': 364, 'pl-man-city': 382,
  'pl-man-utd': 360, 'pl-tottenham': 367, 'pl-newcastle': 361, 'pl-aston-villa': 362,
  'pl-brighton': 331, 'pl-west-ham': 371, 'pl-everton': 368, 'pl-wolves': 380,
};

// La Liga team IDs
const LALIGA_TEAM_IDS = {
  'll-real-madrid': 86, 'll-barcelona': 83, 'll-atletico': 1068, 'll-sevilla': 243,
  'll-real-sociedad': 89, 'll-villarreal': 102, 'll-athletic': 93, 'll-betis': 244,
  'll-valencia': 94, 'll-celta': 85, 'll-getafe': 9812, 'll-osasuna': 97,
};

// Helper: format date as YYYYMMDD for ESPN
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

// Helper: fetch ESPN events using a date range string (e.g. 20260218-20260417)
// ESPN scoreboard supports ranges natively with limit=500
const fetchESPNScheduleRange = async (sportPath, endDate) => {
  const now = new Date();
  const end = endDate || new Date(now.getFullYear(), 11, 31); // through December 31
  const startStr = fmtDate(now);
  const endStr = fmtDate(end);
  try {
    const res = await fetch(`${ESPN_BASE}/${sportPath}/scoreboard?limit=500&dates=${startStr}-${endStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch (_) {
    return [];
  }
};

// Fetch NFL schedule
export const fetchNFLSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('football/nfl');
  } catch (error) {
    console.error('Error fetching NFL schedule:', error);
    return [];
  }
};

// Fetch NHL schedule via ESPN scoreboard — iterates day by day through end of regular season (Apr 17)
export const fetchNHLSchedule = async () => {
  // NHL regular season ends ~April 17, 2026
  const endOfSeason = new Date(2026, 3, 17); // April 17
  return fetchESPNScheduleRange('hockey/nhl', endOfSeason);
};

// Fetch MLB schedule (regular season ends ~Sep 27, 2026)
export const fetchMLBSchedule = async () => {
  try {
    const endOfSeason = new Date(2026, 8, 27); // Sep 27
    return await fetchESPNScheduleRange('baseball/mlb', endOfSeason);
  } catch (error) {
    console.error('Error fetching MLB schedule:', error);
    return [];
  }
};

// Fetch NBA schedule
export const fetchNBASchedule = async () => {
  try {
    return await fetchESPNScheduleRange('basketball/nba');
  } catch (error) {
    console.error('Error fetching NBA schedule:', error);
    return [];
  }
};

// Fetch Premier League schedule
export const fetchPremierLeagueSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/eng.1');
  } catch (error) {
    console.error('Error fetching Premier League schedule:', error);
    return [];
  }
};

// Fetch MLS schedule
export const fetchMLSSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/usa.1');
  } catch (error) {
    console.error('Error fetching MLS schedule:', error);
    return [];
  }
};

// Fetch La Liga schedule
export const fetchLaLigaSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/esp.1');
  } catch (error) {
    console.error('Error fetching La Liga schedule:', error);
    return [];
  }
};

// Fetch NCAA Football schedule
export const fetchNCAAFSchedule = async () => {
  try {
    const endOfSeason = new Date(2026, 5, 30); // through June
    return await fetchESPNScheduleRange('football/college-football', endOfSeason);
  } catch (error) {
    console.error('Error fetching NCAAF schedule:', error);
    return [];
  }
};

// Fetch NCAA Basketball schedule - must fetch day by day since range queries are unsupported
export const fetchNCAABSchedule = async () => {
  try {
    const now = new Date();
    const allEvents = [];
    // Fetch next 45 days one week at a time
    for (let weekOffset = 0; weekOffset < 7; weekOffset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + weekOffset * 7);
      const dateStr = fmtDate(day);
      try {
        const res = await fetch(`${ESPN_BASE}/basketball/mens-college-basketball/scoreboard?limit=500&dates=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          allEvents.push(...(data.events || []));
        }
      } catch (_) {}
    }
    return allEvents;
  } catch (error) {
    console.error('Error fetching NCAAB schedule:', error);
    return [];
  }
};

// Fetch NCAA Baseball schedule
export const fetchNCAABaseballSchedule = async () => {
  try {
    const endOfSeason = new Date(2026, 5, 30);
    return await fetchESPNScheduleRange('baseball/college-baseball', endOfSeason);
  } catch (error) {
    console.error('Error fetching NCAA Baseball schedule:', error);
    return [];
  }
};

// Fetch Serie A schedule
export const fetchSerieASchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/ita.1');
  } catch (error) {
    console.error('Error fetching Serie A schedule:', error);
    return [];
  }
};

// Fetch Bundesliga schedule
export const fetchBundesligaSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/ger.1');
  } catch (error) {
    console.error('Error fetching Bundesliga schedule:', error);
    return [];
  }
};

// Fetch F1 schedule
export const fetchF1Schedule = async () => {
  try {
    return await fetchESPNScheduleRange('racing/f1');
  } catch (error) {
    console.error('Error fetching F1 schedule:', error);
    return [];
  }
};

// Fetch FIFA World Cup schedule
export const fetchWorldCupSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/fifa.world');
  } catch (error) {
    console.error('Error fetching World Cup schedule:', error);
    return [];
  }
};

// Fetch UEFA Euro schedule
export const fetchEuroSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/uefa.euro');
  } catch (error) {
    console.error('Error fetching Euro schedule:', error);
    return [];
  }
};

// Fetch International friendlies schedule
export const fetchInternationalSchedule = async () => {
  try {
    return await fetchESPNScheduleRange('soccer/fifa.friendly');
  } catch (error) {
    console.error('Error fetching International schedule:', error);
    return [];
  }
};

// Map ESPN team abbreviation to our team ID
const mapESPNTeamToId = (abbr, league) => {
  if (!abbr) return null;
  // For NHL and MLB, derive id directly from ESPN abbreviation (matches what TeamSelector stores)
  if (league === 'NHL') return `nhl-${abbr.toLowerCase()}`;
  if (league === 'MLB') return `mlb-${abbr.toLowerCase()}`;
  const mapping = {
    NFL: {
      KC: 'nfl-chiefs', SF: 'nfl-49ers', PHI: 'nfl-eagles', DAL: 'nfl-cowboys',
      BUF: 'nfl-bills', BAL: 'nfl-ravens', DET: 'nfl-lions', MIA: 'nfl-dolphins',
      GB: 'nfl-packers', NYJ: 'nfl-jets', NYG: 'nfl-giants', NE: 'nfl-patriots',
    },
    NBA: {
      LAL: 'nba-lal', BOS: 'nba-bos', GSW: 'nba-gsw', GS: 'nba-gsw', 
      CHI: 'nba-chi', MIA: 'nba-mia', NYK: 'nba-nyk', NY: 'nba-nyk',
      BKN: 'nba-bkn', BRK: 'nba-bkn', PHI: 'nba-phi', MIL: 'nba-mil',
      DEN: 'nba-den', PHX: 'nba-phx', DAL: 'nba-dal',
    },
  };
  return mapping[league]?.[abbr] || null;
};

// Map Premier League team names
const mapPLTeamToId = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('arsenal')) return 'pl-arsenal';
  if (lowerName.includes('chelsea')) return 'pl-chelsea';
  if (lowerName.includes('liverpool')) return 'pl-liverpool';
  if (lowerName.includes('manchester city') || lowerName.includes('man city')) return 'pl-man-city';
  if (lowerName.includes('manchester united') || lowerName.includes('man utd') || lowerName.includes('man united')) return 'pl-man-utd';
  if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return 'pl-tottenham';
  if (lowerName.includes('newcastle')) return 'pl-newcastle';
  if (lowerName.includes('aston villa')) return 'pl-aston-villa';
  if (lowerName.includes('brighton')) return 'pl-brighton';
  if (lowerName.includes('west ham')) return 'pl-west-ham';
  if (lowerName.includes('everton')) return 'pl-everton';
  if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return 'pl-wolves';
  return null;
};

// Map MLS team names
const mapMLSTeamToId = (name) => {
if (!name) return null;
const lowerName = name.toLowerCase();
const slug = lowerName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
return `mls-${slug}`;
};

// Map Serie A team names (ESPN uses abbreviation for matching)
const mapSerieATeamToId = (abbr) => {
  if (!abbr) return null;
  return `serie-a-${abbr.toLowerCase()}`;
};

// Map Bundesliga team names (ESPN uses abbreviation for matching)
const mapBundesligaTeamToId = (abbr) => {
  if (!abbr) return null;
  return `bundesliga-${abbr.toLowerCase()}`;
};

// Map La Liga team names
const mapLaLigaTeamToId = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('real madrid')) return 'll-real-madrid';
  if (lowerName.includes('barcelona')) return 'll-barcelona';
  if (lowerName.includes('atlético') || lowerName.includes('atletico')) return 'll-atletico';
  if (lowerName.includes('sevilla')) return 'll-sevilla';
  if (lowerName.includes('real sociedad')) return 'll-real-sociedad';
  if (lowerName.includes('villarreal')) return 'll-villarreal';
  if (lowerName.includes('athletic')) return 'll-athletic';
  if (lowerName.includes('betis')) return 'll-betis';
  if (lowerName.includes('valencia')) return 'll-valencia';
  if (lowerName.includes('celta')) return 'll-celta';
  if (lowerName.includes('getafe')) return 'll-getafe';
  if (lowerName.includes('osasuna')) return 'll-osasuna';
  return null;
};

// Map international team names
const mapInternationalTeamToId = (name) => {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  const slug = lowerName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `intl-${slug}`;
};

// Map F1 team names
const mapF1TeamToId = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('red bull')) return 'f1-red-bull';
  if (lowerName.includes('ferrari')) return 'f1-ferrari';
  if (lowerName.includes('mercedes')) return 'f1-mercedes';
  if (lowerName.includes('mclaren')) return 'f1-mclaren';
  if (lowerName.includes('aston martin')) return 'f1-aston-martin';
  if (lowerName.includes('alpine')) return 'f1-alpine';
  if (lowerName.includes('williams')) return 'f1-williams';
  if (lowerName.includes('rb') || lowerName.includes('alphatauri') || lowerName.includes('racing bulls')) return 'f1-alphatauri';
  if (lowerName.includes('sauber') || lowerName.includes('kick') || lowerName.includes('alfa romeo')) return 'f1-alfa-romeo';
  if (lowerName.includes('haas')) return 'f1-haas';
  return null;
};

// Parse ESPN event to our game format
const parseESPNEvent = (event, league, favoriteTeamIds) => {
  if (!event.competitions?.[0]) return null;
  
  const competition = event.competitions[0];
  const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
  
  if (!homeTeam || !awayTeam) return null;
  
  let homeId, awayId;

  if (league === 'Premier League') {
    homeId = mapPLTeamToId(homeTeam.team?.displayName || '');
    awayId = mapPLTeamToId(awayTeam.team?.displayName || '');
  } else if (league === 'La Liga') {
    homeId = mapLaLigaTeamToId(homeTeam.team?.displayName || '');
    awayId = mapLaLigaTeamToId(awayTeam.team?.displayName || '');
  } else if (league === 'Serie A') {
    homeId = mapSerieATeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapSerieATeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'Bundesliga') {
    homeId = mapBundesligaTeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapBundesligaTeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'MLS') {
    homeId = mapMLSTeamToId(homeTeam.team?.displayName || '');
    awayId = mapMLSTeamToId(awayTeam.team?.displayName || '');
  } else if (league === 'NCAAB') {
    homeId = `ncaab-${homeTeam.team?.abbreviation?.toLowerCase()}`;
    awayId = `ncaab-${awayTeam.team?.abbreviation?.toLowerCase()}`;
  } else if (league === 'NCAAB-Baseball') {
    homeId = `ncaab-baseball-${homeTeam.team?.abbreviation?.toLowerCase()}`;
    awayId = `ncaab-baseball-${awayTeam.team?.abbreviation?.toLowerCase()}`;
  } else if (['FIFA World Cup', 'UEFA Euro', 'International', 'International Football'].includes(league)) {
    homeId = mapInternationalTeamToId(homeTeam.team?.displayName || '');
    awayId = mapInternationalTeamToId(awayTeam.team?.displayName || '');
  } else {
    homeId = mapESPNTeamToId(homeTeam.team?.abbreviation, league);
    awayId = mapESPNTeamToId(awayTeam.team?.abbreviation, league);
  }
  
  // Check if any favorite team is playing
  const favoriteTeamId = favoriteTeamIds.find(id => id === homeId || id === awayId);
  if (!favoriteTeamId) return null;
  
  return {
    id: event.id,
    date: new Date(event.date),
    league,
    leagueIcon: getLeagueIcon(league),
    homeTeam: {
      id: homeId || homeTeam.team?.abbreviation,
      name: homeTeam.team?.displayName || homeTeam.team?.name,
      logo: homeTeam.team?.logo || getTeamEmoji(homeId),
      color: homeTeam.team?.color || homeTeam.team?.alternateColor,
    },
    awayTeam: {
      id: awayId || awayTeam.team?.abbreviation,
      name: awayTeam.team?.displayName || awayTeam.team?.name,
      logo: awayTeam.team?.logo || getTeamEmoji(awayId),
      color: awayTeam.team?.color || awayTeam.team?.alternateColor,
    },
    favoriteTeamId,
    venue: competition.venue?.fullName || 'TBD',
    status: event.status?.type?.description || 'Scheduled',
    isPreseason: event.season?.type === 1 || event.season?.slug === 'preseason' || event.seasonType?.type?.id === '1',
  };
};

// Parse NHL event format
const parseNHLEvent = (game, favoriteTeamIds) => {
  const homeAbbr = game.homeTeam?.abbrev;
  const awayAbbr = game.awayTeam?.abbrev;

  // Always derive id as nhl-{abbrev.toLowerCase()} (e.g. DAL -> nhl-dal)
  const homeId = homeAbbr ? `nhl-${homeAbbr.toLowerCase()}` : null;
  const awayId = awayAbbr ? `nhl-${awayAbbr.toLowerCase()}` : null;

  const favoriteTeamId = favoriteTeamIds.find(id => id === homeId || id === awayId);
  if (!favoriteTeamId) return null;

  // Use gameDate (local date) to avoid UTC offset issues pushing the date backward
  const dateStr = game.gameDate || game.startTimeUTC?.slice(0, 10);
  const gameDate = new Date(dateStr + 'T12:00:00');

  return {
    id: `nhl-${game.id}`,
    date: gameDate,
    league: 'NHL',
    leagueIcon: '🏒',
    homeTeam: {
      id: homeId || game.homeTeam?.abbrev,
      name: (game.homeTeam?.placeName?.default || '') + ' ' + (game.homeTeam?.commonName?.default || ''),
      logo: game.homeTeam?.logo || getTeamEmoji(homeId),
    },
    awayTeam: {
      id: awayId || game.awayTeam?.abbrev,
      name: (game.awayTeam?.placeName?.default || '') + ' ' + (game.awayTeam?.commonName?.default || ''),
      logo: game.awayTeam?.logo || getTeamEmoji(awayId),
    },
    favoriteTeamId,
    venue: game.venue?.default || 'TBD',
  };
};

// Session types to include and their display labels
const F1_SESSION_TYPES = {
  'Qual': 'Qualifying',
  'SQ': 'Sprint Qualifying',
  'SR': 'Sprint Race',
  'Sprint': 'Sprint Race',
  'Race': 'Race',
};

// Session types we want to show (FP1/FP2/FP3 excluded)
const F1_SHOWN_SESSIONS = new Set(['Qual', 'SQ', 'SR', 'Sprint', 'Race']);

// Parse F1 event — creates one entry per relevant session per team
const parseF1Event = (event, favoriteTeamIds) => {
  if (!event) return null;

  const f1TeamIds = favoriteTeamIds.filter(id => id.startsWith('f1-'));
  if (f1TeamIds.length === 0) return null;

  const now = new Date();
  const sessions = (event.competitions || []).filter(c => {
    const abbr = c.type?.abbreviation;
    return F1_SHOWN_SESSIONS.has(abbr) && new Date(c.date) > now;
  });

  // If no individual sessions, fall back to the event date (Race)
  const entries = sessions.length > 0 ? sessions : [{ date: event.date, type: { abbreviation: 'Race' } }];

  const results = [];
  entries.forEach(session => {
    const abbr = session.type?.abbreviation || 'Race';
    const sessionLabel = F1_SESSION_TYPES[abbr] || abbr;
    const grandPrixName = (event.name || event.shortName || 'Grand Prix')
      .replace(/^[^A-Z]*/, '') // strip sponsor prefix if any
      .trim();

    f1TeamIds.forEach(teamId => {
        const f1TeamData = LEAGUES.F1.teams.find(t => t.id === teamId);
        results.push({
          id: `${event.id}-${session.id || abbr}-${teamId}`,
          date: new Date(session.date),
          league: 'F1',
          leagueIcon: '🏎️',
          homeTeam: {
            id: teamId,
            name: getF1TeamName(teamId),
            logo: f1TeamData?.logo || '🏎️',
            color: f1TeamData?.color || null,
          },
          awayTeam: {
            id: 'f1-race',
            name: `${event.name || 'Grand Prix'} – ${sessionLabel}`,
            logo: abbr === 'Race' ? '🏁' : '⏱️',
          },
          favoriteTeamId: teamId,
          venue: event.circuit?.fullName || event.name || 'TBD',
          isF1Race: true,
          f1Session: sessionLabel,
          isMainRace: abbr === 'Race',
          f1Country: event.circuit?.country || event.competitions?.[0]?.venue?.address?.country || extractF1Country(event.name || ''),
        });
    });
  });

  return results;
};

// Extract country from F1 event name (e.g. "Formula 1 Australian Grand Prix" -> "Australia")
const extractF1Country = (name) => {
  const m = name.match(/(\w[\w\s]*)Grand Prix/i);
  return m ? m[1].trim() : '';
};

const getF1TeamName = (teamId) => {
  const names = {
    'f1-red-bull': 'Red Bull Racing',
    'f1-ferrari': 'Scuderia Ferrari',
    'f1-mercedes': 'Mercedes-AMG',
    'f1-mclaren': 'McLaren',
    'f1-aston-martin': 'Aston Martin',
    'f1-alpine': 'Alpine',
    'f1-williams': 'Williams',
    'f1-alphatauri': 'RB',
    'f1-alfa-romeo': 'Kick Sauber',
    'f1-haas': 'Haas F1 Team',
  };
  return names[teamId] || teamId;
};

const getLeagueIcon = (league) => {
  const icons = {
    NFL: '🏈', NHL: '🏒', MLB: '⚾', NBA: '🏀',
    'Premier League': '⚽', 'La Liga': '⚽', F1: '🏎️',
  };
  return icons[league] || '🏆';
};

const getTeamEmoji = (teamId) => {
  if (!teamId) return '🏆';
  // Return a generic emoji based on sport
  if (teamId.startsWith('nfl-')) return '🏈';
  if (teamId.startsWith('nhl-')) return '🏒';
  if (teamId.startsWith('mlb-')) return '⚾';
  if (teamId.startsWith('nba-')) return '🏀';
  if (teamId.startsWith('pl-') || teamId.startsWith('ll-')) return '⚽';
  if (teamId.startsWith('f1-')) return '🏎️';
  return '🏆';
};

// Main function to fetch all schedules for favorite teams
export const fetchAllSchedules = async (favoriteTeams) => {
  if (!favoriteTeams || favoriteTeams.length === 0) return [];
  
  const teamIdsByLeague = {};
  favoriteTeams.forEach(team => {
    if (!teamIdsByLeague[team.league]) {
      teamIdsByLeague[team.league] = [];
    }
    teamIdsByLeague[team.league].push(team.team_id);
  });
  
  const allGames = [];
  const now = new Date();

  // Fetch all schedules in parallel
  const [nflGames, nhlGames, mlbGames, nbaGames, plGames, laligaGames, mlsGames, f1Games, ncaafGames, worldCupGames, euroGames, intlGames, serieAGames, bundesligaGames, ncaabGames, ncaaBaseballGames] = await Promise.all([
    teamIdsByLeague['NFL'] ? fetchNFLSchedule() : Promise.resolve([]),
    teamIdsByLeague['NHL'] ? fetchNHLSchedule() : Promise.resolve([]),
    teamIdsByLeague['MLB'] ? fetchMLBSchedule() : Promise.resolve([]),
    teamIdsByLeague['NBA'] ? fetchNBASchedule() : Promise.resolve([]),
    teamIdsByLeague['Premier League'] ? fetchPremierLeagueSchedule() : Promise.resolve([]),
    teamIdsByLeague['La Liga'] ? fetchLaLigaSchedule() : Promise.resolve([]),
    teamIdsByLeague['MLS'] ? fetchMLSSchedule() : Promise.resolve([]),
    teamIdsByLeague['F1'] ? fetchF1Schedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAF'] ? fetchNCAAFSchedule() : Promise.resolve([]),
    teamIdsByLeague['International Football'] ? fetchWorldCupSchedule() : Promise.resolve([]),
    teamIdsByLeague['International Football'] ? fetchEuroSchedule() : Promise.resolve([]),
    teamIdsByLeague['International Football'] ? fetchInternationalSchedule() : Promise.resolve([]),
    teamIdsByLeague['Serie A'] ? fetchSerieASchedule() : Promise.resolve([]),
    teamIdsByLeague['Bundesliga'] ? fetchBundesligaSchedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAB'] ? fetchNCAABSchedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAB-Baseball'] ? fetchNCAABaseballSchedule() : Promise.resolve([]),
  ]);

      // Parse NCAAF games
      if (teamIdsByLeague['NCAAF']) {
        const ncaafIds = teamIdsByLeague['NCAAF'];
        ncaafGames.forEach(event => {
          if (!event.competitions?.[0]) return;
          const competition = event.competitions[0];
          const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
          if (!homeTeam || !awayTeam) return;
          const homeId = `ncaaf-${homeTeam.team?.abbreviation?.toLowerCase()}`;
          const awayId = `ncaaf-${awayTeam.team?.abbreviation?.toLowerCase()}`;
          const favoriteTeamId = ncaafIds.find(id => id === homeId || id === awayId);
          if (!favoriteTeamId) return;
          const gameDate = new Date(event.date);
          if (gameDate <= now) return;
          allGames.push({
            id: event.id,
            date: gameDate,
            league: 'NCAAF',
            leagueIcon: '🏈',
            homeTeam: {
              id: homeId,
              name: homeTeam.team?.displayName || homeTeam.team?.name,
              logo: homeTeam.team?.logo,
              color: homeTeam.team?.color || homeTeam.team?.alternateColor,
            },
            awayTeam: {
              id: awayId,
              name: awayTeam.team?.displayName || awayTeam.team?.name,
              logo: awayTeam.team?.logo,
              color: awayTeam.team?.color || awayTeam.team?.alternateColor,
            },
            favoriteTeamId,
            venue: competition.venue?.fullName || 'TBD',
            status: event.status?.type?.description || 'Scheduled',
            isPreseason: event.season?.type === 1 || event.season?.slug === 'preseason' || event.seasonType?.type?.id === '1',
          });
        });
      }

      // Parse NFL games
  if (teamIdsByLeague['NFL']) {
    nflGames.forEach(event => {
      const game = parseESPNEvent(event, 'NFL', teamIdsByLeague['NFL']);
      if (game && game.date > now) allGames.push(game);
    });
  }
  
  // Parse NHL games (ESPN format)
  if (teamIdsByLeague['NHL']) {
    console.log('[NHL] favorite team IDs:', JSON.stringify(teamIdsByLeague['NHL']));
    console.log('[NHL] total ESPN events fetched:', nhlGames.length);
    // Log a sample of abbreviations ESPN returned
    const sampleAbbrs = nhlGames.slice(0, 5).map(e => {
      const c = e.competitions?.[0];
      const home = c?.competitors?.find(t => t.homeAway === 'home')?.team?.abbreviation;
      const away = c?.competitors?.find(t => t.homeAway === 'away')?.team?.abbreviation;
      return `${away}@${home}`;
    });
    console.log('[NHL] sample matchups:', JSON.stringify(sampleAbbrs));
    // Log any DAL games specifically
    const dalGames = nhlGames.filter(e => {
      const c = e.competitions?.[0];
      return c?.competitors?.some(t => t.team?.abbreviation === 'DAL');
    });
    console.log('[NHL] DAL games found in raw ESPN data:', dalGames.length, dalGames.map(e => e.date));
    nhlGames.forEach(event => {
      const game = parseESPNEvent(event, 'NHL', teamIdsByLeague['NHL']);
      if (game && game.date > now) allGames.push(game);
    });
  }
  
  // Parse MLB games - for MLB include games from today onwards (Spring Training games may have already started today)
  if (teamIdsByLeague['MLB']) {
    const todayMidnight = new Date(now); todayMidnight.setHours(0,0,0,0);
    mlbGames.forEach(event => {
      const game = parseESPNEvent(event, 'MLB', teamIdsByLeague['MLB']);
      if (game && game.date >= todayMidnight) allGames.push(game);
    });
  }
  
  // Parse NBA games
  if (teamIdsByLeague['NBA']) {
    console.log('[NBA] favorite team IDs:', JSON.stringify(teamIdsByLeague['NBA']));
    console.log('[NBA] total ESPN events fetched:', nbaGames.length);
    const sampleAbbrs = nbaGames.slice(0, 5).map(e => {
      const c = e.competitions?.[0];
      const home = c?.competitors?.find(t => t.homeAway === 'home')?.team?.abbreviation;
      const away = c?.competitors?.find(t => t.homeAway === 'away')?.team?.abbreviation;
      return `${away}@${home}`;
    });
    console.log('[NBA] sample matchups:', JSON.stringify(sampleAbbrs));
    nbaGames.forEach(event => {
      const game = parseESPNEvent(event, 'NBA', teamIdsByLeague['NBA']);
      if (game && game.date > now) allGames.push(game);
    });
  }
  
  // Parse Premier League games
  if (teamIdsByLeague['Premier League']) {
    plGames.forEach(event => {
      const game = parseESPNEvent(event, 'Premier League', teamIdsByLeague['Premier League']);
      if (game && game.date > now) allGames.push(game);
    });
  }
  
  // Parse MLS games
  if (teamIdsByLeague['MLS']) {
    mlsGames.forEach(event => {
      const game = parseESPNEvent(event, 'MLS', teamIdsByLeague['MLS']);
      if (game && game.date > now) allGames.push(game);
    });
  }

  // Parse La Liga games
  if (teamIdsByLeague['La Liga']) {
    laligaGames.forEach(event => {
      const game = parseESPNEvent(event, 'La Liga', teamIdsByLeague['La Liga']);
      if (game && game.date > now) allGames.push(game);
    });
  }
  
  // Parse F1 races/sessions
  if (teamIdsByLeague['F1']) {
    f1Games.forEach(event => {
      const sessions = parseF1Event(event, teamIdsByLeague['F1']);
      if (sessions) {
        sessions.forEach(s => {
          if (s.date > now) allGames.push(s);
        });
      }
    });
  }

  // Parse International Football games (World Cup + Euro + International combined)
    if (teamIdsByLeague['International Football']) {
      // For international football, any game matches since user selected "All International"
      const intlTeamIds = teamIdsByLeague['International Football'];
      const parseIntlEvent = (event, leagueName) => {
        if (!event.competitions?.[0]) return null;
        const competition = event.competitions[0];
        const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
        if (!homeTeam || !awayTeam) return null;
        const homeId = mapInternationalTeamToId(homeTeam.team?.displayName || '');
        const awayId = mapInternationalTeamToId(awayTeam.team?.displayName || '');
        return {
          id: `${leagueName}-${event.id}`,
          date: new Date(event.date),
          league: 'International Football',
          leagueIcon: '🌍',
          homeTeam: {
            id: homeId,
            name: homeTeam.team?.displayName || homeTeam.team?.name,
            logo: homeTeam.team?.logo,
            color: homeTeam.team?.color,
          },
          awayTeam: {
            id: awayId,
            name: awayTeam.team?.displayName || awayTeam.team?.name,
            logo: awayTeam.team?.logo,
            color: awayTeam.team?.color,
          },
          favoriteTeamId: intlTeamIds[0],
          venue: competition.venue?.fullName || 'TBD',
          status: event.status?.type?.description || 'Scheduled',
        };
      };
      [...worldCupGames, ...euroGames, ...intlGames].forEach(event => {
        const game = parseIntlEvent(event, event.id);
        if (game && game.date > now) allGames.push(game);
      });
    }

  // Parse Serie A games
  if (teamIdsByLeague['Serie A']) {
    serieAGames.forEach(event => {
      const game = parseESPNEvent(event, 'Serie A', teamIdsByLeague['Serie A']);
      if (game && game.date > now) allGames.push(game);
    });
  }

  // Parse Bundesliga games
  if (teamIdsByLeague['Bundesliga']) {
    bundesligaGames.forEach(event => {
      const game = parseESPNEvent(event, 'Bundesliga', teamIdsByLeague['Bundesliga']);
      if (game && game.date > now) allGames.push(game);
    });
  }

  // Parse NCAA Basketball games
  if (teamIdsByLeague['NCAAB']) {
    const ncaabIds = teamIdsByLeague['NCAAB'];
    ncaabGames.forEach(event => {
      if (!event.competitions?.[0]) return;
      const competition = event.competitions[0];
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeTeam || !awayTeam) return;
      const homeId = `ncaab-${homeTeam.team?.abbreviation?.toLowerCase()}`;
      const awayId = `ncaab-${awayTeam.team?.abbreviation?.toLowerCase()}`;
      const favoriteTeamId = ncaabIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(event.date);
      if (gameDate <= now) return;
      allGames.push({
        id: event.id,
        date: gameDate,
        league: 'NCAAB',
        leagueIcon: '🏀',
        homeTeam: { id: homeId, name: homeTeam.team?.displayName, logo: homeTeam.team?.logo, color: homeTeam.team?.color },
        awayTeam: { id: awayId, name: awayTeam.team?.displayName, logo: awayTeam.team?.logo, color: awayTeam.team?.color },
        favoriteTeamId,
        venue: competition.venue?.fullName || 'TBD',
        status: event.status?.type?.description || 'Scheduled',
        isPreseason: false,
      });
    });
  }

  // Parse NCAA Baseball games
  if (teamIdsByLeague['NCAAB-Baseball']) {
    const ncaaBaseballIds = teamIdsByLeague['NCAAB-Baseball'];
    ncaaBaseballGames.forEach(event => {
      if (!event.competitions?.[0]) return;
      const competition = event.competitions[0];
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeTeam || !awayTeam) return;
      const homeId = `ncaa-baseball-${homeTeam.team?.abbreviation?.toLowerCase()}`;
      const awayId = `ncaa-baseball-${awayTeam.team?.abbreviation?.toLowerCase()}`;
      const favoriteTeamId = ncaaBaseballIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(event.date);
      if (gameDate <= now) return;
      allGames.push({
        id: event.id,
        date: gameDate,
        league: 'NCAAB-Baseball',
        leagueIcon: '⚾',
        homeTeam: { id: homeId, name: homeTeam.team?.displayName, logo: homeTeam.team?.logo, color: homeTeam.team?.color },
        awayTeam: { id: awayId, name: awayTeam.team?.displayName, logo: awayTeam.team?.logo, color: awayTeam.team?.color },
        favoriteTeamId,
        venue: competition.venue?.fullName || 'TBD',
        status: event.status?.type?.description || 'Scheduled',
        isPreseason: false,
      });
    });
  }

  // Sort by date
  return allGames.sort((a, b) => a.date - b.date);
};