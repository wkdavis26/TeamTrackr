import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LEAGUES } from './teamsData';

let f1StandingsCache = null;

const fetchF1Standings = async () => {
  if (f1StandingsCache) return f1StandingsCache;
  try {
    const res = await fetch('https://site.api.espn.com/apis/v2/sports/racing/f1/standings');
    if (!res.ok) return { drivers: [], constructors: [] };
    const data = await res.json();

    const driverGroup = data.children?.find(c => c.name === 'Driver Standings');
    const constructorGroup = data.children?.find(c => c.name === 'Constructor Standings');

    const drivers = (driverGroup?.standings?.entries || []).map(entry => ({
      name: entry.athlete?.shortName || entry.athlete?.displayName || '',
      abbr: entry.athlete?.abbreviation || '',
      flagUrl: entry.athlete?.flag?.href || null,
      teamName: entry.team?.displayName || entry.team?.name || '',
      rank: parseInt(entry.stats?.find(s => s.name === 'rank')?.displayValue) || 0,
      pts: entry.stats?.find(s => s.name === 'championshipPts')?.displayValue || '0',
    }));

    const constructors = (constructorGroup?.standings?.entries || []).map(entry => ({
      name: entry.team?.displayName || entry.team?.name || '',
      rank: parseInt(entry.stats?.find(s => s.name === 'rank')?.displayValue) || 0,
      pts: entry.stats?.find(s => s.name === 'championshipPts')?.displayValue || '0',
    }));

    f1StandingsCache = { drivers, constructors };
    return f1StandingsCache;
  } catch (e) {
    return { drivers: [], constructors: [] };
  }
};

// Map team name from ESPN to our F1 team ID
const teamNameToId = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('red bull')) return 'f1-red-bull';
  if (n.includes('ferrari')) return 'f1-ferrari';
  if (n.includes('mercedes')) return 'f1-mercedes';
  if (n.includes('mclaren')) return 'f1-mclaren';
  if (n.includes('aston martin')) return 'f1-aston-martin';
  if (n.includes('alpine')) return 'f1-alpine';
  if (n.includes('williams')) return 'f1-williams';
  if (n.includes('racing bulls') || n.includes('rb') || n.includes('alphatauri')) return 'f1-alphatauri';
  if (n.includes('sauber') || n.includes('kick')) return 'f1-sauber';
  if (n.includes('haas')) return 'f1-haas';
  return null;
};

export default function F1StandingCard({ team }) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  const staticTeamData = LEAGUES.F1.teams?.find(t => t.id === team.team_id);
  const borderColor = staticTeamData?.color ? `#${staticTeamData.color}` : '#e5e7eb';
  const logoUrl = team.logo_url || staticTeamData?.logo || null;

  useEffect(() => {
    fetchF1Standings().then(data => {
      // Drivers for this team
      const teamDrivers = data.drivers
        .filter(d => teamNameToId(d.teamName) === team.team_id)
        .sort((a, b) => a.rank - b.rank);

      // Constructor standing for this team
      const constructor = data.constructors.find(c => teamNameToId(c.name) === team.team_id);

      setStandings({ drivers: teamDrivers, constructor });
      setLoading(false);
    });
  }, [team.team_id]);

  const teamUrl = createPageUrl(`TeamDetails?team_id=${team.team_id}&team_name=${encodeURIComponent(team.team_name)}&league=F1`);

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
          {/* Team header */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={team.team_name} className="w-10 h-10 object-contain flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0">🏎️</div>
            )}
            <div className="font-semibold text-gray-900 text-sm leading-tight">{team.team_name}</div>
          </div>

          {/* Constructors rank */}
          {!loading && standings?.constructor && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500 font-medium">Constructors</span>
              <span className="ml-auto font-bold text-gray-900 text-sm">
                #{standings.constructor.rank || '—'}
              </span>
              <span className="text-xs text-gray-400">{standings.constructor.pts} pts</span>
            </div>
          )}

          {/* Drivers */}
          <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              </div>
            ) : standings?.drivers?.length > 0 ? (
              standings.drivers.map(driver => (
                <div key={driver.abbr} className="flex items-center gap-2">
                  {driver.flagUrl && (
                    <img src={driver.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-700 flex-1 truncate">{driver.name}</span>
                  <span className="text-xs font-bold text-gray-900">
                    {driver.rank > 0 ? `#${driver.rank}` : '—'}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">{driver.pts} pts</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 text-center py-2">Season not started</div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}