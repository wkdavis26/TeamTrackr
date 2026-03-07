// League metadata only - teams are loaded dynamically from ESPN API

export const LEAGUES = {
  NFL: {
    name: "NFL",
    icon: "🏈",
    espnPath: "football/nfl",
    color: "#013369",
  },
  NHL: {
    name: "NHL",
    icon: "🏒",
    espnPath: "hockey/nhl",
    color: "#000000",
  },
  MLB: {
    name: "MLB",
    icon: "⚾",
    espnPath: "baseball/mlb",
    color: "#002D72",
  },
  NBA: {
    name: "NBA",
    icon: "🏀",
    espnPath: "basketball/nba",
    color: "#C9082A",
  },
  "Premier League": {
    name: "Premier League",
    icon: "⚽",
    espnPath: "soccer/eng.1",
    color: "#3D195B",
  },
  "La Liga": {
    name: "La Liga",
    icon: "⚽",
    espnPath: "soccer/esp.1",
    color: "#EE8707",
  },
  NCAAF: {
    name: "NCAA Football",
    icon: "🏈",
    espnPath: "football/college-football",
    color: "#CC5500",
  },
  MLS: {
    name: "MLS",
    icon: "⚽",
    espnPath: "soccer/usa.1",
    color: "#002B5C",
  },
  F1: {
    name: "F1",
    icon: "🏎️",
    espnPath: null,
    color: "#E10600",
    teams: [
      { id: "f1-red-bull", name: "Red Bull Racing", color: "1E3A5F", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/red-bull-racing-logo.png" },
      { id: "f1-ferrari", name: "Scuderia Ferrari", color: "E8002D", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/ferrari-logo.png" },
      { id: "f1-mercedes", name: "Mercedes-AMG", color: "00A19C", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/mercedes-logo.png" },
      { id: "f1-mclaren", name: "McLaren", color: "FF8000", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/mclaren-logo.png" },
      { id: "f1-aston-martin", name: "Aston Martin", color: "00665E", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/aston-martin-logo.png" },
      { id: "f1-alpine", name: "Alpine", color: "0090FF", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/alpine-logo.png" },
      { id: "f1-williams", name: "Williams", color: "005AFF", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/williams-logo.png" },
      { id: "f1-alphatauri", name: "RB / Racing Bulls", color: "1434CB", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/rb-logo.png" },
      { id: "f1-sauber", name: "Kick Sauber", color: "52E252", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/kick-sauber-logo.png" },
      { id: "f1-haas", name: "Haas F1 Team", color: "B6BABD", logo: "https://media.formula1.com/content/dam/fom-website/teams/2025/haas-logo.png" },
    ]
  },
  "Champions League": {
    name: "Champions League",
    icon: "⭐",
    espnPath: "soccer/uefa.champions",
    color: "#003087",
  },
  "International Football": {
    name: "International Football",
    icon: "🌍",
    espnPath: "soccer/fifa.world",
    color: "#003399",
  },
  "Women's International Football": {
    name: "Women's International Football",
    icon: "🌍",
    espnPath: "soccer/fifa.wwc",
    color: "#8B0000",
  },
  "Serie A": {
    name: "Serie A",
    icon: "⚽",
    espnPath: "soccer/ita.1",
    color: "#003DA5",
  },
  "Bundesliga": {
    name: "Bundesliga",
    icon: "⚽",
    espnPath: "soccer/ger.1",
    color: "#D3010C",
  },
  WNBA: {
    name: "WNBA",
    icon: "🏀",
    espnPath: "basketball/wnba",
    color: "#FF6900",
  },
  "NCAAB": {
    name: "NCAA Basketball",
    icon: "🏀",
    espnPath: "basketball/mens-college-basketball",
    color: "#CC5500",
  },
  "NCAAB-Baseball": {
    name: "NCAA Baseball",
    icon: "⚾",
    espnPath: "baseball/college-baseball",
    color: "#003087",
  },
  PGA: {
    name: "PGA Tour",
    icon: "⛳",
    espnPath: null,
    color: "#1a4731",
  },
  PWHL: {
    name: "PWHL",
    icon: "🏒",
    espnPath: "hockey/pwhl",
    color: "#000000",
  },
  };

// Fetch all teams for a given league from ESPN
export const fetchLeagueTeams = async (leagueKey) => {
  const league = LEAGUES[leagueKey];
  if (!league || !league.espnPath) {
    // Return static data for F1 and International Football
    return league?.teams || [];
  }
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${league.espnPath}/teams?limit=500`
    );
    if (!response.ok) return [];
    const data = await response.json();
    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams.map(({ team }) => ({
      id: `${leagueKey.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}-${team.abbreviation.toLowerCase()}`,
      name: team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href || null,
      color: team.color,
    }));
  } catch (e) {
    console.error(`Error fetching teams for ${leagueKey}:`, e);
    return [];
  }
};

export const getLeagueColor = (league) => {
  const colors = {
    NFL: "bg-blue-800", NHL: "bg-slate-800", MLB: "bg-blue-900",
    NBA: "bg-orange-600", "Premier League": "bg-purple-800",
    "La Liga": "bg-amber-600", MLS: "bg-blue-900", F1: "bg-red-600",
    NCAAF: "bg-orange-700", "International Football": "bg-blue-900",
  };
  return colors[league] || "bg-slate-700";
};