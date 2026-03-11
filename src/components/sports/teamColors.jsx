// Static team color map by team ID (hex without #)
export const TEAM_COLORS = {
  // NBA
  'nba-bos': '007A33', 'nba-lal': '552583', 'nba-gsw': '1D428A', 'nba-chi': 'CE1141',
  'nba-mia': '98002E', 'nba-nyk': '006BB6', 'nba-bkn': '000000', 'nba-phi': '006BB6',
  'nba-mil': '00471B', 'nba-den': '0E2240', 'nba-phx': '1D1160', 'nba-dal': '00538C',
  'nba-mem': '5D76A9', 'nba-sas': '000000', 'nba-hou': 'CE1141', 'nba-okc': '007AC1',
  'nba-por': 'E03A3E', 'nba-sac': '5A2D81', 'nba-nop': '0C2340', 'nba-cha': '1D1160',
  'nba-det': 'C8102E', 'nba-atl': 'C8102E', 'nba-ind': '002D62', 'nba-cle': '860038',
  'nba-tor': 'CE1141', 'nba-uth': '002B5C', 'nba-min': '236192', 'nba-was': '002B5C',
  'nba-lac': 'C8102E', 'nba-orl': '0077C0',

  // NHL
  'nhl-bos': 'FCB514', 'nhl-nyr': '0038A8', 'nhl-tor': '003E7E', 'nhl-mtl': 'AF1E2D',
  'nhl-pit': 'FCB514', 'nhl-chi': 'CF0A2C', 'nhl-lak': '111111', 'nhl-edm': 'FF4C00',
  'nhl-tbl': '002868', 'nhl-col': '6F263D', 'nhl-fla': 'C8102E', 'nhl-dal': '006847',
  'nhl-wsh': 'CF0A2C', 'nhl-phi': 'F74902', 'nhl-njd': 'CE1126', 'nhl-nyi': '003087',
  'nhl-car': 'CC0000', 'nhl-cbj': '002654', 'nhl-min': '154734', 'nhl-nsh': 'FFB81C',
  'nhl-stl': '002F87', 'nhl-wpg': '041E42', 'nhl-uta': '69B3E7', 'nhl-sjs': '006D75',
  'nhl-ana': 'F47A38', 'nhl-cgy': 'C8102E', 'nhl-van': '00843D', 'nhl-vgk': 'B4975A',
  'nhl-sea': '001628', 'nhl-ott': 'C2912C', 'nhl-buf': '003087', 'nhl-det': 'CE1126',

  // NFL
  'nfl-chiefs': 'E31837', 'nfl-49ers': 'AA0000', 'nfl-eagles': '004C54', 'nfl-cowboys': '003594',
  'nfl-bills': '00338D', 'nfl-ravens': '241773', 'nfl-lions': '0076B6', 'nfl-dolphins': '008E97',
  'nfl-packers': '203731', 'nfl-jets': '125740', 'nfl-giants': '0B2265', 'nfl-patriots': '002244',
  'nfl-steelers': 'FFB612', 'nfl-bengals': 'FB4F14', 'nfl-browns': '311D00', 'nfl-texans': '03202F',
  'nfl-colts': '003A70', 'nfl-jaguars': '006778', 'nfl-titans': '4B92DB', 'nfl-broncos': 'FB4F14',
  'nfl-chargers': '0080C6', 'nfl-raiders': '000000', 'nfl-chiefs': 'E31837', 'nfl-vikings': '4F2683',
  'nfl-bears': '0B162A', 'nfl-lions': '0076B6', 'nfl-packers': '203731', 'nfl-falcons': 'A71930',
  'nfl-panthers': '0085CA', 'nfl-saints': 'D3BC8D', 'nfl-buccaneers': 'D50A0A', 'nfl-cardinals': '97233F',
  'nfl-rams': '003594', 'nfl-seahawks': '002244', 'nfl-49ers': 'AA0000', 'nfl-commanders': '5A1414',
  'nfl-giants': '0B2265', 'nfl-cowboys': '003594', 'nfl-eagles': '004C54', 'nfl-redskins': '773141',
};

export const getTeamColor = (teamId) => TEAM_COLORS[teamId] || null;