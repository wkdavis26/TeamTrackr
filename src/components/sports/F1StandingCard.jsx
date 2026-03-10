import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LEAGUES } from './teamsData';
import { base44 } from '@/api/base44Client';

let f1StandingsCache = null;

const fetchF1Standings = async () => {
  if (f1StandingsCache?.drivers?.length > 0) return f1StandingsCache;
  const res = await base44.functions.invoke('f1Standings', {});
  const data = res.data;
  f1StandingsCache = { drivers: data.drivers || [], constructors: data.constructors || [] };
  return f1StandingsCache;
};

export default function F1StandingCard({ team }) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  const staticTeamData = LEAGUES.F1.teams?.find(t => t.id === team.team_id);
  const borderColor = staticTeamData?.color ? `#${staticTeamData.color}` : '#e5e7eb';
  const logoUrl = team.logo_url || staticTeamData?.logo || null;

  useEffect(() => {
    fetchF1Standings().then(data => {
      const teamDrivers = data.drivers
        .filter(d => d.teamId === team.team_id)
        .sort((a, b) => a.rank - b.rank);

      const constructor = data.constructors.find(c => c.teamId === team.team_id);

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
          {!loading && (standings?.constructor || standings?.drivers?.length > 0) && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 flex-shrink-0" /> {/* spacer to align with flag */}
              <span className="text-xs text-gray-500 font-medium flex-1">{standings?.constructor?.team || team.team_name}</span>
              <span className="text-xs font-bold text-gray-900 w-8 text-right">
                {standings?.constructor?.rank ? `#${standings.constructor.rank}` : '—'}
              </span>
              <span className="text-xs text-gray-400 w-12 text-right">
                {standings?.drivers?.length > 0
                  ? `${standings.drivers.reduce((sum, d) => sum + (parseInt(d.pts) || 0), 0)} pts`
                  : standings?.constructor?.pts ? `${standings.constructor.pts} pts` : ''}
              </span>
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
                <div key={driver.rank} className="flex items-center gap-2">
                  {driver.flagUrl
                    ? <img src={driver.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                    : <div className="w-4 h-3 flex-shrink-0" />}
                  <span className="text-xs text-gray-700 flex-1 truncate">{driver.name}</span>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">
                    {driver.rank > 0 ? `#${driver.rank}` : '—'}
                  </span>
                  <span className="text-xs text-gray-400 w-12 text-right">{driver.pts} pts</span>
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