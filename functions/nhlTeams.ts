import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.hockey.api-sports.io';

const nhlAbbreviations = {
  'Boston Bruins': 'BOS', 'New York Rangers': 'NYR', 'Toronto Maple Leafs': 'TOR', 'Montreal Canadiens': 'MTL',
  'Pittsburgh Penguins': 'PIT', 'Chicago Blackhawks': 'CHI', 'Los Angeles Kings': 'LAK', 'Edmonton Oilers': 'EDM',
  'Tampa Bay Lightning': 'TBL', 'Colorado Avalanche': 'COL', 'Florida Panthers': 'FLA', 'Dallas Stars': 'DAL',
  'Washington Capitals': 'WSH', 'Philadelphia Flyers': 'PHI', 'New Jersey Devils': 'NJD', 'New York Islanders': 'NYI',
  'Carolina Hurricanes': 'CAR', 'Columbus Blue Jackets': 'CBJ', 'Minnesota Wild': 'MIN', 'Nashville Predators': 'NSH',
  'St. Louis Blues': 'STL', 'Winnipeg Jets': 'WPG', 'Utah Hockey Club': 'UTA', 'San Jose Sharks': 'SJS',
  'Anaheim Ducks': 'ANA', 'Calgary Flames': 'CGY', 'Vancouver Canucks': 'VAN', 'Vegas Golden Knights': 'VGK',
  'Seattle Kraken': 'SEA', 'Ottawa Senators': 'OTT', 'Buffalo Sabres': 'BUF', 'Detroit Red Wings': 'DET',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(`${BASE_URL}/teams?league=57&season=2025`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const raw = data.response || [];

    const teams = raw
      .filter(t => t.id && t.name && nhlAbbreviations[t.name])
      .map(t => {
        const abbr = nhlAbbreviations[t.name];
        return {
          id: `nhl-${abbr.toLowerCase()}`,
          name: t.name,
          abbreviation: abbr,
          logo: t.logo || null,
        };
      });

    return Response.json({ teams }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});