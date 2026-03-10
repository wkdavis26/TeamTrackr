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
  if (n.includes('sauber') || n.includes('kick')) return 'f1-sauber';
  if (n.includes('haas')) return 'f1-haas';
  return null;
};

const DRIVER_FLAG = {
  'VER': 'nl', 'HAM': 'gb', 'LEC': 'mc', 'SAI': 'es', 'NOR': 'gb',
  'PIA': 'au', 'RUS': 'gb', 'ALO': 'es', 'STR': 'ca', 'PER': 'mx',
  'GAS': 'fr', 'OCO': 'fr', 'TSU': 'jp', 'ALB': 'gb', 'HUL': 'de',
  'MAG': 'dk', 'BOT': 'fi', 'ZHO': 'cn', 'LAW': 'nz', 'BEA': 'gb',
  'DOO': 'au', 'ANT': 'us', 'HAD': 'us', 'BOR': 'it', 'COL': 'ar',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [d2025, t2025] = await Promise.all([
      apiFetch(`/rankings/drivers?season=2025`),
      apiFetch(`/rankings/teams?season=2025`),
    ]);
    return Response.json({ drivers2025: d2025.response?.length, teams2025: t2025.response?.length, errors: { d: d2025.errors, t: t2025.errors } });
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

    const drivers = (driversData.response || []).map(entry => {
      const abbr = entry.driver?.abbr || '';
      const countryCode = DRIVER_FLAG[abbr] || null;
      return {
        name: entry.driver?.name || '',
        abbr,
        teamName: entry.team?.name || '',
        teamId: teamNameToId(entry.team?.name),
        flagUrl: countryCode ? `https://flagcdn.com/16x12/${countryCode}.png` : null,
        rank: entry.position || 0,
        pts: String(entry.points ?? 0),
      };
    });

    const constructors = (teamsData.response || []).map(entry => ({
      name: entry.team?.name || '',
      teamId: teamNameToId(entry.team?.name),
      rank: entry.position || 0,
      pts: String(entry.points ?? 0),
    }));

    return Response.json({ _year: year, _driverCount: drivers.length, first: drivers[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});