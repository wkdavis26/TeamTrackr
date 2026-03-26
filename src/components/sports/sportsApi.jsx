// Sports API Service - fetches real schedule data from ESPN and NHL APIs
import { LEAGUES } from './teamsData';


// No ESPN - all data via api-sports backend functions



// Fetch NFL schedule from api-sports backend function
export const fetchNFLSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('nflSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NFL schedule:', error);
    return [];
  }
};

// Fetch NHL schedule via api-sports
export const fetchNHLSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('nhlSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NHL schedule:', error);
    return [];
  }
};

// Fetch MLB schedule via api-sports backend function
export const fetchMLBSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('mlbSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching MLB schedule:', error);
    return [];
  }
};

// Fetch WNBA schedule via api-sports
export const fetchWNBASchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('wnbaSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching WNBA schedule:', error);
    return [];
  }
};

// Fetch NBA schedule from api-sports backend function
export const fetchNBASchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('nbaSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NBA schedule:', error);
    return [];
  }
};

// Fetch Champions League schedule via api-sports
export const fetchChampionsLeagueSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('championsLeagueSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching Champions League schedule:', error);
    return [];
  }
};

// Fetch Premier League schedule via api-sports
export const fetchPremierLeagueSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('soccerSchedule', { league: 'Premier League' });
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching Premier League schedule:', error);
    return [];
  }
};

// Fetch MLS schedule via api-sports
export const fetchMLSSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('soccerSchedule', { league: 'MLS' });
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching MLS schedule:', error);
    return [];
  }
};

// Fetch La Liga schedule via api-sports
export const fetchLaLigaSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('soccerSchedule', { league: 'La Liga' });
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching La Liga schedule:', error);
    return [];
  }
};

// Fetch NCAA Football schedule from api-sports backend function
export const fetchNCAAFSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('ncaafSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NCAAF schedule:', error);
    return [];
  }
};

// Fetch NCAA Basketball schedule via api-sports
export const fetchNCAABSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('ncaabScheduleBasketball', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NCAAB schedule:', error);
    return [];
  }
};

// Fetch NCAA Baseball schedule via api-sports
export const fetchNCAABaseballSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('ncaaBaseballSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NCAA Baseball schedule:', error);
    return [];
  }
};

// Fetch Serie A schedule via api-sports
export const fetchSerieASchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('soccerSchedule', { league: 'Serie A' });
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching Serie A schedule:', error);
    return [];
  }
};

// Fetch Bundesliga schedule via api-sports
export const fetchBundesligaSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('soccerSchedule', { league: 'Bundesliga' });
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching Bundesliga schedule:', error);
    return [];
  }
};

// Fetch NWSL schedule via api-sports
export const fetchNWSLSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('nwslSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching NWSL schedule:', error);
    return [];
  }
};

// Fetch PWHL schedule from leaguestat public API (via backend to avoid CORS)
export const fetchPWHLSchedule = async () => {
  try {
    // PWHL team ID map: our id -> leaguestat numeric id
    const PWHL_TEAMS = {
      'pwhl-1': { name: 'Boston Fleet', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/1.png', color: '0B2D6E' },
      'pwhl-2': { name: 'Minnesota Frost', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/2.png', color: '154734' },
      'pwhl-3': { name: 'Montréal Victoire', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/3.png', color: 'A6192E' },
      'pwhl-4': { name: 'New York Sirens', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/4.png', color: '00539B' },
      'pwhl-5': { name: 'Ottawa Charge', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/5.png', color: '000000' },
      'pwhl-6': { name: 'Toronto Sceptres', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/6.png', color: '702F8A' },
      'pwhl-8': { name: 'Seattle Torrent', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/8.png', color: '005C8A' },
      'pwhl-9': { name: 'Vancouver Goldeneyes', logo: 'https://assets.leaguestat.com/pwhl/logos/50x50/9.png', color: '005C2E' },
    };
    // leaguestat numeric -> our id
    const LSID_TO_PWHL = { '1': 'pwhl-1', '2': 'pwhl-2', '3': 'pwhl-3', '4': 'pwhl-4', '5': 'pwhl-5', '6': 'pwhl-6', '8': 'pwhl-8', '9': 'pwhl-9' };

    const { base44 } = await import('@/api/base44Client');
    const response = await base44.functions.invoke('pwhlSchedule', {});
    return { games: response.data?.games || [], PWHL_TEAMS, LSID_TO_PWHL };
  } catch {
    return { games: [], PWHL_TEAMS: {}, LSID_TO_PWHL: {} };
  }
};

// Fetch F1 schedule from api-sports backend function
export const fetchF1Schedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('f1Schedule', {});
    return res.data?.sessions || [];
  } catch (error) {
    console.error('Error fetching F1 schedule:', error);
    return [];
  }
};

// Fetch International Football schedule via api-sports (World Cup, Euro, Friendlies)
export const fetchInternationalFootballSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('internationalFootballSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching International Football schedule:', error);
    return [];
  }
};

// Fetch Women's International Football schedule via api-sports
export const fetchWomensInternationalSchedule = async () => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('womensInternationalSchedule', {});
    return res.data?.games || [];
  } catch (error) {
    console.error('Error fetching Women\'s International schedule:', error);
    return [];
  }
};

// Map ESPN team abbreviation to our team ID
const mapESPNTeamToId = (abbr, league) => {
  if (!abbr) return null;
  // Derive id directly from ESPN abbreviation (matches what TeamSelector stores)
  if (league === 'NHL') return `nhl-${abbr.toLowerCase()}`;
  if (league === 'MLB') return `mlb-${abbr.toLowerCase()}`;
  if (league === 'NBA') return `nba-${abbr.toLowerCase()}`;
  if (league === 'WNBA') return `wnba-${abbr.toLowerCase()}`;
  const mapping = {
    NFL: {
      KC: 'nfl-chiefs', SF: 'nfl-49ers', PHI: 'nfl-eagles', DAL: 'nfl-cowboys',
      BUF: 'nfl-bills', BAL: 'nfl-ravens', DET: 'nfl-lions', MIA: 'nfl-dolphins',
      GB: 'nfl-packers', NYJ: 'nfl-jets', NYG: 'nfl-giants', NE: 'nfl-patriots',
    },
    NBA: {}, // handled by direct abbreviation mapping below
  };
  return mapping[league]?.[abbr] || null;
};

// Map Premier League team abbreviation to ID (matches what fetchLeagueTeams stores)
const mapPLTeamToId = (abbr) => {
  if (!abbr) return null;
  return `premier-league-${abbr.toLowerCase()}`;
};

// Map MLS team abbreviation to ID (matches what TeamSelector stores via fetchLeagueTeams)
const mapMLSTeamToId = (abbr) => {
  if (!abbr) return null;
  return `mls-${abbr.toLowerCase()}`;
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

// Map La Liga team abbreviation to ID (matches what fetchLeagueTeams stores)
const mapLaLigaTeamToId = (abbr) => {
  if (!abbr) return null;
  return `la-liga-${abbr.toLowerCase()}`;
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
    homeId = mapPLTeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapPLTeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'La Liga') {
    homeId = mapLaLigaTeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapLaLigaTeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'Serie A') {
    homeId = mapSerieATeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapSerieATeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'Bundesliga') {
    homeId = mapBundesligaTeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapBundesligaTeamToId(awayTeam.team?.abbreviation || '');
  } else if (league === 'MLS') {
    homeId = mapMLSTeamToId(homeTeam.team?.abbreviation || '');
    awayId = mapMLSTeamToId(awayTeam.team?.abbreviation || '');
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
  
  const getRecord = (competitor) => {
    const rec = competitor.records?.find(r => r.type === 'total' || !r.type);
    return rec?.summary || null;
  };

  const broadcasts = (competition.broadcasts || [])
    .flatMap(b => b.names || [b.market, typeof b.type === 'string' ? b.type : null].filter(Boolean))
    .filter(v => typeof v === 'string');

  if (!homeId && !awayId) return null;

  return {
    id: event.id,
    date: new Date(event.date),
    league,
    leagueIcon: getLeagueIcon(league),
    homeTeam: {
      id: homeId || homeTeam.team?.abbreviation,
      name: homeTeam.team?.displayName || homeTeam.team?.name,
      logo: homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href || getTeamEmoji(homeId),
      color: homeTeam.team?.color || homeTeam.team?.alternateColor,
      record: getRecord(homeTeam),
    },
    awayTeam: {
      id: awayId || awayTeam.team?.abbreviation,
      name: awayTeam.team?.displayName || awayTeam.team?.name,
      logo: awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href || getTeamEmoji(awayId),
      color: awayTeam.team?.color || awayTeam.team?.alternateColor,
      record: getRecord(awayTeam),
    },
    favoriteTeamId,
    venue: competition.venue?.fullName || 'TBD',
    status: event.status?.type?.description || 'Scheduled',
    isPreseason: event.season?.type === 1 || event.season?.slug === 'preseason' || event.seasonType?.type?.id === '1',
    broadcasts: broadcasts.length > 0 ? broadcasts : null,
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

// Session type labels from api-sports type strings
const F1_SESSION_LABEL = {
  'Race': 'Race',
  'Qualifying': 'Qualifying',
  'Sprint': 'Sprint Race',
  'Sprint Qualifying': 'Sprint Qualifying',
  '1st Practice': 'Practice 1',
  '2nd Practice': 'Practice 2',
  '3rd Practice': 'Practice 3',
};

// Session types to show
const F1_SHOWN_TYPES = new Set(['Race', 'Qualifying', 'Sprint', 'Sprint Qualifying', '1st Practice', '2nd Practice', '3rd Practice']);

// Parse a flat F1 session from api-sports — creates one entry per team
const parseF1Session = (session, favoriteTeamIds) => {
  if (!session) return null;

  const f1TeamIds = favoriteTeamIds.filter(id => id.startsWith('f1-'));
  if (f1TeamIds.length === 0) return null;

  if (!F1_SHOWN_TYPES.has(session.type)) return null;

  const sessionDate = new Date(session.date);
  const now = new Date();
  if (sessionDate <= now) return null;

  const sessionLabel = F1_SESSION_LABEL[session.type] || session.type;
  const grandPrixName = session.competitionName || 'Grand Prix';
  const isMainRace = session.type === 'Race';

  return f1TeamIds.map(teamId => {
    const f1TeamData = LEAGUES.F1.teams.find(t => t.id === teamId);
    return {
      id: `${session.id}-${teamId}`,
      date: sessionDate,
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
        name: `${grandPrixName} – ${sessionLabel}`,
        logo: isMainRace ? '🏁' : '⏱️',
      },
      favoriteTeamId: teamId,
      venue: session.circuit || grandPrixName,
      isF1Race: true,
      f1Session: sessionLabel,
      isMainRace,
      f1Country: session.country || '',
      broadcasts: null,
    };
  });
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
  // Allow games that started up to 4 hours ago (to show live/in-progress games)
  const liveWindowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  // Fetch all schedules in parallel
  const hasEuropeanLeague = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga'].some(l => teamIdsByLeague[l]);

  const [nflGames, nhlGames, mlbGames, nbaGames, wnbaGames, plGames, laligaGames, mlsGames, f1Games, ncaafGames, intlGames, womensIntlGames, serieAGames, bundesligaGames, ncaabGames, ncaaBaseballGames, pwhlResult, nwslGames, championsLeagueGames] = await Promise.all([
    teamIdsByLeague['NFL'] ? fetchNFLSchedule() : Promise.resolve([]),
    teamIdsByLeague['NHL'] ? fetchNHLSchedule() : Promise.resolve([]),
    teamIdsByLeague['MLB'] ? fetchMLBSchedule() : Promise.resolve([]),
    teamIdsByLeague['NBA'] ? fetchNBASchedule() : Promise.resolve([]),
    teamIdsByLeague['WNBA'] ? fetchWNBASchedule() : Promise.resolve([]),
    teamIdsByLeague['Premier League'] ? fetchPremierLeagueSchedule() : Promise.resolve([]),
    teamIdsByLeague['La Liga'] ? fetchLaLigaSchedule() : Promise.resolve([]),
    teamIdsByLeague['MLS'] ? fetchMLSSchedule() : Promise.resolve([]),
    teamIdsByLeague['F1'] ? fetchF1Schedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAF'] ? fetchNCAAFSchedule() : Promise.resolve([]),
    teamIdsByLeague['International Football'] ? fetchInternationalFootballSchedule() : Promise.resolve([]),
    teamIdsByLeague["Women's International Football"] ? fetchWomensInternationalSchedule() : Promise.resolve([]),
    teamIdsByLeague['Serie A'] ? fetchSerieASchedule() : Promise.resolve([]),
    teamIdsByLeague['Bundesliga'] ? fetchBundesligaSchedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAB'] ? fetchNCAABSchedule() : Promise.resolve([]),
    teamIdsByLeague['NCAAB-Baseball'] ? fetchNCAABaseballSchedule() : Promise.resolve([]),
    teamIdsByLeague['PWHL'] ? fetchPWHLSchedule() : Promise.resolve({ games: [], PWHL_TEAMS: {}, LSID_TO_PWHL: {} }),
    teamIdsByLeague['NWSL'] ? fetchNWSLSchedule() : Promise.resolve([]),
    hasEuropeanLeague ? fetchChampionsLeagueSchedule() : Promise.resolve([]),
  ]);

  // Parse NCAAF games (flat format from api-sports ncaafSchedule function)
  if (teamIdsByLeague['NCAAF']) {
    const ncaafIds = teamIdsByLeague['NCAAF'];
    ncaafGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = ncaafIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (gameDate <= now) return;
      allGames.push({
        id: `ncaaf-${g.id}`,
        date: gameDate,
        league: 'NCAAF',
        leagueIcon: '🏈',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'NS',
        isPreseason: g.stage === 'Pre Season',
      });
    });
  }

      // Parse NFL games (flat format from api-sports nflSchedule function)
  if (teamIdsByLeague['NFL']) {
    const nflIds = teamIdsByLeague['NFL'];
    nflGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = nflIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (gameDate <= now) return;
      allGames.push({
        id: `nfl-${g.id}`,
        date: gameDate,
        league: 'NFL',
        leagueIcon: '🏈',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'NS',
        isPreseason: g.stage === 'Pre Season',
        odds: g.odds || null,
      });
    });
  }
  
  // Parse NHL games (flat api-sports format, same as NBA)
  if (teamIdsByLeague['NHL']) {
    const nhlIds = teamIdsByLeague['NHL'];
    nhlGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = nhlIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `nhl-${g.id}`,
        date: gameDate,
        league: 'NHL',
        leagueIcon: '🏒',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'NS',
        odds: g.odds || null,
      });
    });
  }
  
  // Parse MLB games (flat format from api-sports mlbSchedule function)
  if (teamIdsByLeague['MLB']) {
    const mlbIds = teamIdsByLeague['MLB'];
    const todayMidnight = new Date(now); todayMidnight.setHours(0, 0, 0, 0);
    mlbGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = mlbIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate < todayMidnight) return;
      allGames.push({
        id: `mlb-${g.id}`,
        date: gameDate,
        league: 'MLB',
        leagueIcon: '⚾',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
        odds: g.odds || null,
      });
    });
  }
  
  // Parse NBA games (flat format from api-sports nbaSchedule function)
  if (teamIdsByLeague['NBA']) {
    const nbaIds = teamIdsByLeague['NBA'];
    nbaGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const gameDate = new Date(g.date);
      const favoriteTeamId = nbaIds.find(id => id === homeId || id === awayId);
      
      if (!favoriteTeamId) return;
      if (isNaN(gameDate.getTime())) return;
      if (gameDate <= liveWindowStart) return;
      
      allGames.push({
        id: `nba-${g.id}`,
        date: gameDate,
        league: 'NBA',
        leagueIcon: '🏀',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'NS',
        odds: g.odds || null,
      });
    });
  }
  
  // Parse WNBA games (flat api-sports format)
  if (teamIdsByLeague['WNBA']) {
    const wnbaIds = teamIdsByLeague['WNBA'];
    wnbaGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = wnbaIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `wnba-${g.id}`,
        date: gameDate,
        league: 'WNBA',
        leagueIcon: '🏀',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
        odds: g.odds || null,
      });
    });
  }

  // Parse Premier League games (from api-sports backend function)
  if (teamIdsByLeague['Premier League']) {
    const plIds = teamIdsByLeague['Premier League'];
    plGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = plIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime()) || gameDate <= now) return;
      allGames.push({
        id: `pl-${game.id}`,
        date: gameDate,
        league: 'Premier League',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }

  // Parse Champions League games (from api-sports backend function)
  if (hasEuropeanLeague && championsLeagueGames.length > 0) {
    const europeanLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga'];
    championsLeagueGames.forEach(game => {
      const gameDate = new Date(game.date);
      if (gameDate <= now) return;
      
      // Match team IDs against favorite teams from any European league
      for (const league of europeanLeagues) {
        if (!teamIdsByLeague[league]) continue;
        
        // Extract numeric ID from the game's team IDs
        const homeNumId = game.homeTeam?.id?.toString();
        const awayNumId = game.awayTeam?.id?.toString();
        
        // Build league-specific IDs
        const homeId = homeNumId ? `${league.toLowerCase().replace(/\s+/g, '-')}-${homeNumId}` : null;
        const awayId = awayNumId ? `${league.toLowerCase().replace(/\s+/g, '-')}-${awayNumId}` : null;
        
        const favoriteTeamId = teamIdsByLeague[league].find(id => id === homeId || id === awayId);
        if (!favoriteTeamId) continue;
        
        // Avoid duplicate if already added
        if (allGames.find(g => g.id === `ucl-${game.id}`)) break;
        
        allGames.push({
          id: `ucl-${game.id}`,
          date: gameDate,
          league,
          leagueIcon: '⭐',
          isChampionsLeague: true,
          competitionLabel: 'UEFA Champions League',
          homeTeam: {
            id: homeId,
            name: game.homeTeam?.name,
            logo: game.homeTeam?.logo,
          },
          awayTeam: {
            id: awayId,
            name: game.awayTeam?.name,
            logo: game.awayTeam?.logo,
          },
          favoriteTeamId,
          venue: game.venue || 'TBD',
          status: game.status || 'Scheduled',
          broadcasts: null,
        });
        break;
      }
    });
  }

  // Parse MLS games
  if (teamIdsByLeague['MLS']) {
    const mlsIds = teamIdsByLeague['MLS'];
    mlsGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = mlsIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      const todayMidnight = new Date(now); todayMidnight.setHours(0,0,0,0);
      if (isNaN(gameDate.getTime()) || gameDate < todayMidnight) return;
      allGames.push({
        id: `mls-${game.id}`,
        date: gameDate,
        league: 'MLS',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }

  // Parse La Liga games (from api-sports backend function)
  if (teamIdsByLeague['La Liga']) {
    const laligaIds = teamIdsByLeague['La Liga'];
    laligaGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = laligaIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime()) || gameDate <= now) return;
      allGames.push({
        id: `ll-${game.id}`,
        date: gameDate,
        league: 'La Liga',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }
  
  // Parse F1 races/sessions (flat sessions from api-sports)
  if (teamIdsByLeague['F1']) {
    f1Games.forEach(session => {
      const entries = parseF1Session(session, teamIdsByLeague['F1']);
      if (entries) entries.forEach(s => allGames.push(s));
    });
  }

  // Parse International Football games (flat api-sports format)
  if (teamIdsByLeague['International Football']) {
    const intlIds = teamIdsByLeague['International Football'];
    intlGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = intlIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `intl-${g.id}`,
        date: gameDate,
        league: 'International Football',
        leagueIcon: '🌍',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
      });
    });
  }

  // Parse Women's International Football games (flat api-sports format)
  if (teamIdsByLeague["Women's International Football"]) {
    const wIntlIds = teamIdsByLeague["Women's International Football"];
    womensIntlGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = wIntlIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `wintl-${g.id}`,
        date: gameDate,
        league: "Women's International Football",
        leagueIcon: '🌍',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
      });
    });
  }

  // Parse Serie A games (from api-sports backend function)
  if (teamIdsByLeague['Serie A']) {
    const serieAIds = teamIdsByLeague['Serie A'];
    serieAGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = serieAIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime()) || gameDate <= now) return;
      allGames.push({
        id: `sa-${game.id}`,
        date: gameDate,
        league: 'Serie A',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }

  // Parse Bundesliga games (from api-sports backend function)
  if (teamIdsByLeague['Bundesliga']) {
    const bundesligaIds = teamIdsByLeague['Bundesliga'];
    bundesligaGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = bundesligaIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime()) || gameDate <= now) return;
      allGames.push({
        id: `bl-${game.id}`,
        date: gameDate,
        league: 'Bundesliga',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }

  // Parse NCAA Basketball games (from api-sports backend function)
  if (teamIdsByLeague['NCAAB']) {
    const ncaabIds = teamIdsByLeague['NCAAB'];
    ncaabGames.forEach(game => {
      const homeId = game.homeTeam?.id;
      const awayId = game.awayTeam?.id;
      const favoriteTeamId = ncaabIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime()) || gameDate <= now) return;
      allGames.push({
        id: `ncaab-${game.id}`,
        date: gameDate,
        league: 'NCAAB',
        leagueIcon: '🏀',
        homeTeam: { id: homeId, name: game.homeTeam?.name, logo: game.homeTeam?.logo },
        awayTeam: { id: awayId, name: game.awayTeam?.name, logo: game.awayTeam?.logo },
        favoriteTeamId,
        venue: game.venue || 'TBD',
        status: game.status || 'Scheduled',
        odds: game.odds || null,
      });
    });
  }

  // Parse NCAA Baseball games (flat api-sports format)
  if (teamIdsByLeague['NCAAB-Baseball']) {
    const ncaaBaseballIds = teamIdsByLeague['NCAAB-Baseball'];
    ncaaBaseballGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = ncaaBaseballIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `ncaab-baseball-${g.id}`,
        date: gameDate,
        league: 'NCAAB-Baseball',
        leagueIcon: '⚾',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
      });
    });
  }

  // Parse NWSL games (flat api-sports format)
  if (teamIdsByLeague['NWSL']) {
    const nwslIds = teamIdsByLeague['NWSL'];
    nwslGames.forEach(g => {
      const homeId = g.homeTeam?.id;
      const awayId = g.awayTeam?.id;
      const favoriteTeamId = nwslIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      const gameDate = new Date(g.date);
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      allGames.push({
        id: `nwsl-${g.id}`,
        date: gameDate,
        league: 'NWSL',
        leagueIcon: '⚽',
        homeTeam: { id: homeId, name: g.homeTeam?.name, logo: g.homeTeam?.logo },
        awayTeam: { id: awayId, name: g.awayTeam?.name, logo: g.awayTeam?.logo },
        favoriteTeamId,
        venue: g.venue || 'TBD',
        status: g.status || 'Scheduled',
      });
    });
  }

  // Parse PWHL games
  if (teamIdsByLeague['PWHL'] && pwhlResult?.games?.length) {
    const { games: pwhlGames, PWHL_TEAMS, LSID_TO_PWHL } = pwhlResult;
    const pwhlIds = teamIdsByLeague['PWHL'];
    pwhlGames.forEach(game => {
      const homeId = LSID_TO_PWHL[String(game.home_team)];
      const awayId = LSID_TO_PWHL[String(game.visiting_team)];
      if (!homeId || !awayId) return;
      const favoriteTeamId = pwhlIds.find(id => id === homeId || id === awayId);
      if (!favoriteTeamId) return;
      // Parse date using ISO8601 field from leaguestat
      const gameDate = new Date(game.GameDateISO8601 || game.date_with_timezone || (game.date_played + 'T12:00:00'));
      if (isNaN(gameDate.getTime()) || gameDate <= liveWindowStart) return;
      const homeTeamData = PWHL_TEAMS[homeId];
      const awayTeamData = PWHL_TEAMS[awayId];
      allGames.push({
        id: `pwhl-${game.game_id}`,
        date: gameDate,
        league: 'PWHL',
        leagueIcon: '🏒',
        homeTeam: { id: homeId, name: homeTeamData?.name || homeId, logo: homeTeamData?.logo || null, color: homeTeamData?.color || null },
        awayTeam: { id: awayId, name: awayTeamData?.name || awayId, logo: awayTeamData?.logo || null, color: awayTeamData?.color || null },
        favoriteTeamId,
        venue: game.venue_name || game.venue || 'TBD',
        status: game.game_status || 'Scheduled',
        isPreseason: false,
        broadcasts: null,
      });
    });
  }

  return allGames.sort((a, b) => a.date - b.date);
};