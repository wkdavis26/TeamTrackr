// Comprehensive teams data for all leagues
export const LEAGUES = {
  NHL: {
    name: "NHL",
    color: "#000000",
    bgColor: "bg-slate-800",
    icon: "🏒",
    teams: [
      { id: "nhl-bruins", name: "Boston Bruins", logo: "🐻" },
      { id: "nhl-rangers", name: "New York Rangers", logo: "🗽" },
      { id: "nhl-maple-leafs", name: "Toronto Maple Leafs", logo: "🍁" },
      { id: "nhl-canadiens", name: "Montreal Canadiens", logo: "🔴" },
      { id: "nhl-penguins", name: "Pittsburgh Penguins", logo: "🐧" },
      { id: "nhl-blackhawks", name: "Chicago Blackhawks", logo: "🪶" },
      { id: "nhl-kings", name: "Los Angeles Kings", logo: "👑" },
      { id: "nhl-oilers", name: "Edmonton Oilers", logo: "🛢️" },
      { id: "nhl-lightning", name: "Tampa Bay Lightning", logo: "⚡" },
      { id: "nhl-avalanche", name: "Colorado Avalanche", logo: "🏔️" },
      { id: "nhl-panthers", name: "Florida Panthers", logo: "🐆" },
      { id: "nhl-stars", name: "Dallas Stars", logo: "⭐" },
    ]
  },
  MLB: {
    name: "MLB",
    color: "#002D72",
    bgColor: "bg-blue-900",
    icon: "⚾",
    teams: [
      { id: "mlb-yankees", name: "New York Yankees", logo: "🗽" },
      { id: "mlb-red-sox", name: "Boston Red Sox", logo: "🧦" },
      { id: "mlb-dodgers", name: "Los Angeles Dodgers", logo: "🔵" },
      { id: "mlb-cubs", name: "Chicago Cubs", logo: "🐻" },
      { id: "mlb-giants", name: "San Francisco Giants", logo: "🌉" },
      { id: "mlb-cardinals", name: "St. Louis Cardinals", logo: "🐦" },
      { id: "mlb-astros", name: "Houston Astros", logo: "⭐" },
      { id: "mlb-braves", name: "Atlanta Braves", logo: "🪓" },
      { id: "mlb-mets", name: "New York Mets", logo: "🍎" },
      { id: "mlb-phillies", name: "Philadelphia Phillies", logo: "🔔" },
      { id: "mlb-padres", name: "San Diego Padres", logo: "🎭" },
      { id: "mlb-mariners", name: "Seattle Mariners", logo: "⚓" },
    ]
  },
  NBA: {
    name: "NBA",
    color: "#C9082A",
    bgColor: "bg-orange-600",
    icon: "🏀",
    teams: [
      { id: "nba-lakers", name: "Los Angeles Lakers", logo: "💜" },
      { id: "nba-celtics", name: "Boston Celtics", logo: "☘️" },
      { id: "nba-warriors", name: "Golden State Warriors", logo: "🌉" },
      { id: "nba-bulls", name: "Chicago Bulls", logo: "🐂" },
      { id: "nba-heat", name: "Miami Heat", logo: "🔥" },
      { id: "nba-knicks", name: "New York Knicks", logo: "🗽" },
      { id: "nba-nets", name: "Brooklyn Nets", logo: "🌃" },
      { id: "nba-76ers", name: "Philadelphia 76ers", logo: "🔔" },
      { id: "nba-bucks", name: "Milwaukee Bucks", logo: "🦌" },
      { id: "nba-nuggets", name: "Denver Nuggets", logo: "⛏️" },
      { id: "nba-suns", name: "Phoenix Suns", logo: "☀️" },
      { id: "nba-mavs", name: "Dallas Mavericks", logo: "🐴" },
    ]
  },
  "Premier League": {
    name: "Premier League",
    color: "#3D195B",
    bgColor: "bg-purple-800",
    icon: "⚽",
    teams: [
      { id: "pl-arsenal", name: "Arsenal", logo: "🔴" },
      { id: "pl-chelsea", name: "Chelsea", logo: "🔵" },
      { id: "pl-liverpool", name: "Liverpool", logo: "🔴" },
      { id: "pl-man-city", name: "Manchester City", logo: "🩵" },
      { id: "pl-man-utd", name: "Manchester United", logo: "🔴" },
      { id: "pl-tottenham", name: "Tottenham Hotspur", logo: "⚪" },
      { id: "pl-newcastle", name: "Newcastle United", logo: "⚫" },
      { id: "pl-aston-villa", name: "Aston Villa", logo: "🟤" },
      { id: "pl-brighton", name: "Brighton", logo: "🔵" },
      { id: "pl-west-ham", name: "West Ham United", logo: "🟣" },
      { id: "pl-everton", name: "Everton", logo: "🔵" },
      { id: "pl-wolves", name: "Wolverhampton", logo: "🟠" },
    ]
  },
  "La Liga": {
    name: "La Liga",
    color: "#EE8707",
    bgColor: "bg-amber-600",
    icon: "⚽",
    teams: [
      { id: "ll-real-madrid", name: "Real Madrid", logo: "⚪" },
      { id: "ll-barcelona", name: "FC Barcelona", logo: "🔵🔴" },
      { id: "ll-atletico", name: "Atlético Madrid", logo: "🔴⚪" },
      { id: "ll-sevilla", name: "Sevilla FC", logo: "🔴" },
      { id: "ll-real-sociedad", name: "Real Sociedad", logo: "🔵⚪" },
      { id: "ll-villarreal", name: "Villarreal CF", logo: "🟡" },
      { id: "ll-athletic", name: "Athletic Bilbao", logo: "🔴⚪" },
      { id: "ll-betis", name: "Real Betis", logo: "🟢" },
      { id: "ll-valencia", name: "Valencia CF", logo: "🦇" },
      { id: "ll-celta", name: "Celta Vigo", logo: "🩵" },
      { id: "ll-getafe", name: "Getafe CF", logo: "🔵" },
      { id: "ll-osasuna", name: "CA Osasuna", logo: "🔴" },
    ]
  },
  F1: {
    name: "F1",
    color: "#E10600",
    bgColor: "bg-red-600",
    icon: "🏎️",
    teams: [
      { id: "f1-red-bull", name: "Red Bull Racing", logo: "🐂" },
      { id: "f1-ferrari", name: "Scuderia Ferrari", logo: "🐎" },
      { id: "f1-mercedes", name: "Mercedes-AMG", logo: "⭐" },
      { id: "f1-mclaren", name: "McLaren", logo: "🧡" },
      { id: "f1-aston-martin", name: "Aston Martin", logo: "🟢" },
      { id: "f1-alpine", name: "Alpine", logo: "🔵" },
      { id: "f1-williams", name: "Williams", logo: "🔵" },
      { id: "f1-alphatauri", name: "RB", logo: "⚪" },
      { id: "f1-alfa-romeo", name: "Kick Sauber", logo: "🟢" },
      { id: "f1-haas", name: "Haas F1 Team", logo: "⚫🔴" },
    ]
  }
};

// Generate mock upcoming games for favorite teams
export const generateUpcomingGames = (favoriteTeams) => {
  const games = [];
  const now = new Date();
  
  favoriteTeams.forEach(team => {
    const league = LEAGUES[team.league];
    if (!league) return;
    
    const otherTeams = league.teams.filter(t => t.id !== team.team_id);
    
    // Generate 3-5 upcoming games per team
    const numGames = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numGames; i++) {
      const daysAhead = Math.floor(Math.random() * 30) + 1;
      const gameDate = new Date(now);
      gameDate.setDate(gameDate.getDate() + daysAhead);
      gameDate.setHours(Math.floor(Math.random() * 8) + 12, 0, 0, 0);
      
      const opponent = otherTeams[Math.floor(Math.random() * otherTeams.length)];
      const isHome = Math.random() > 0.5;
      
      games.push({
        id: `${team.team_id}-${i}-${daysAhead}`,
        date: gameDate,
        league: team.league,
        leagueIcon: league.icon,
        homeTeam: isHome ? { id: team.team_id, name: team.team_name, logo: league.teams.find(t => t.id === team.team_id)?.logo || "🏆" } : opponent,
        awayTeam: isHome ? opponent : { id: team.team_id, name: team.team_name, logo: league.teams.find(t => t.id === team.team_id)?.logo || "🏆" },
        favoriteTeamId: team.team_id,
        venue: isHome ? `${team.team_name} Arena` : `${opponent.name} Arena`
      });
    }
  });
  
  return games.sort((a, b) => a.date - b.date);
};

export const getLeagueColor = (league) => {
  return LEAGUES[league]?.bgColor || "bg-slate-700";
};