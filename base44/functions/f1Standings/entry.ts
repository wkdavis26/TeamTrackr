import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_KEY = Deno.env.get('Sports_API_Key');
const BASE_URL = 'https://v1.formula-1.api-sports.io';

const apiFetch = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

const teamNameToId = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('red bull')) return 'f1-red-bull';
  if (n.includes('ferrari')) return 'f1-ferrari';
  if (n.includes('mercedes')) return 'f1-mercedes';
  if (n.includes('mclaren')) return 'f1-mclaren';
  if (n.includes('aston martin')) return 'f1-aston-martin';
  if (n.includes('alpine')) return 'f1-alpine';
  if (n.includes('williams')) return 'f1-williams';
  if (n.includes('racing bulls') || n.includes('rb') || n.includes('alphatauri') || n.includes('visa')) return 'f1-alphatauri';
  if (n.includes('sauber') || n.includes('kick') || n.includes('audi')) return 'f1-sauber';
  if (n.includes('haas')) return 'f1-haas';
  return null;
};

const DRIVER_FLAG = {
  'VER': 'nl', 'HAM': 'gb', 'LEC': 'mc', 'SAI': 'es', 'NOR': 'gb',
  'PIA': 'au', 'RUS': 'gb', 'ALO': 'es', 'STR': 'ca', 'PER': 'mx',
  'GAS': 'fr', 'OCO': 'fr', 'TSU': 'jp', 'ALB': 'gb', 'HUL': 'de',
  'MAG': 'dk', 'BOT': 'fi', 'ZHO': 'cn', 'LAW': 'nz', 'BEA': 'gb',
  'DOO': 'au', 'ANT': 'it', 'HAD': 'fr', 'BOR': 'br', 'COL': 'ar', 'LIN': 'se',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 2026 season roster - hardcoded to ensure all drivers show even with 0 pts
    const ROSTER_2026 = [
      { abbr: 'VER', teamId: 'f1-red-bull' },
      { abbr: 'HAD', teamId: 'f1-red-bull' },
      { abbr: 'LEC', teamId: 'f1-ferrari' },
      { abbr: 'HAM', teamId: 'f1-ferrari' },
      { abbr: 'NOR', teamId: 'f1-mclaren' },
      { abbr: 'PIA', teamId: 'f1-mclaren' },
      { abbr: 'RUS', teamId: 'f1-mercedes' },
      { abbr: 'ANT', teamId: 'f1-mercedes' },
      { abbr: 'ALO', teamId: 'f1-aston-martin' },
      { abbr: 'STR', teamId: 'f1-aston-martin' },
      { abbr: 'GAS', teamId: 'f1-alpine' },
      { abbr: 'DOO', teamId: 'f1-alpine' },
      { abbr: 'ALB', teamId: 'f1-williams' },
      { abbr: 'SAI', teamId: 'f1-williams' },
      { abbr: 'LAW', teamId: 'f1-alphatauri' },
      { abbr: 'LIN', teamId: 'f1-alphatauri' },
      { abbr: 'BOR', teamId: 'f1-sauber' },
      { abbr: 'HUL', teamId: 'f1-sauber' },
      { abbr: 'BEA', teamId: 'f1-haas' },
      { abbr: 'OCO', teamId: 'f1-haas' },
    ];

    // Try current year first, fall back up to 3 years until we get data
    const currentYear = new Date().getFullYear();
    let year = currentYear;
    let driversData, teamsData;

    for (let attempt = 0; attempt < 3; attempt++) {
      [driversData, teamsData] = await Promise.all([
        apiFetch(`/rankings/drivers?season=${year}`),
        apiFetch(`/rankings/teams?season=${year}`),
      ]);
      if (driversData.response?.length > 0 || teamsData.response?.length > 0) break;
      year--;
    }

    // Build a lookup of ranked drivers by abbr
    const rankedByAbbr = {};
    for (const entry of (driversData.response || [])) {
      const abbr = entry.driver?.abbr || '';
      if (abbr) rankedByAbbr[abbr] = {
        name: entry.driver?.name || '',
        rank: entry.position || 0,
        pts: String(entry.points ?? 0),
      };
    }

    // Also build lookup by name for drivers with missing abbr in rankings
    const rankedByName = {};
    for (const entry of (driversData.response || [])) {
      const name = entry.driver?.name || '';
      rankedByName[name] = {
        abbr: entry.driver?.abbr || '',
        rank: entry.position || 0,
        pts: String(entry.points ?? 0),
      };
    }

    // Build driver name lookup from abbr (from rankings data)
    const DRIVER_NAMES = {
      'VER': 'Max Verstappen', 'HAD': 'Isack Hadjar', 'LEC': 'Charles Leclerc',
      'HAM': 'Lewis Hamilton', 'NOR': 'Lando Norris', 'PIA': 'Oscar Piastri',
      'RUS': 'George Russell', 'ANT': 'Andrea Kimi Antonelli', 'ALO': 'Fernando Alonso',
      'STR': 'Lance Stroll', 'GAS': 'Pierre Gasly', 'DOO': 'Jack Doohan',
      'ALB': 'Alexander Albon', 'SAI': 'Carlos Sainz', 'LAW': 'Liam Lawson',
      'LIN': 'Arvid Lindblad', 'BOR': 'Gabriel Bortoleto', 'HUL': 'Nico Hulkenberg',
      'BEA': 'Oliver Bearman', 'OCO': 'Esteban Ocon',
    };

    const drivers = ROSTER_2026.map(({ abbr, teamId }) => {
      const name = rankedByAbbr[abbr]?.name || DRIVER_NAMES[abbr] || abbr;
      const ranked = rankedByAbbr[abbr] || rankedByName[name] || { rank: 0, pts: '0' };
      const countryCode = DRIVER_FLAG[abbr] || null;
      return {
        name,
        abbr,
        teamId,
        flagUrl: countryCode ? `https://flagcdn.com/16x12/${countryCode}.png` : null,
        rank: ranked.rank,
        pts: ranked.pts,
      };
    });

    const constructors = (teamsData.response || []).map(entry => ({
      name: entry.team?.name || '',
      teamId: teamNameToId(entry.team?.name),
      rank: entry.position || 0,
      pts: String(entry.points ?? 0),
    }));

    return Response.json({ drivers, constructors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});