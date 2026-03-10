import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

let nflStandingsCache = null;
let nflStandingsCacheKey = null;

const fetchNFLStandings = async () => {
  const today = new Date().toDateString();
  if (nflStandingsCache?.length > 0 && nflStandingsCacheKey === today) return nflStandingsCache;
  const res = await base44.functions.invoke('nflStandings', {});
  const standings = res.data?.standings || [];
  nflStandingsCache = standings;
  nflStandingsCacheKey = today;
  return standings;
};

export default function NFLStandingCard({ team }) {
  const [standing, setStanding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFLStandings().then(standings => {
      const entry = standings.find(s => s.teamId === team.team_id);
      setStanding(entry || null);
      setLoading(false);
    });
  }, [team.team_id]);

  const teamUrl = createPageUrl(`TeamDetails?team_id=${team.team_id}&team_name=${encodeURIComponent(team.team_name)}&league=NFL`);
  const logoUrl = team.logo_url || null;

  const confShort = standing?.conference?.includes('American') ? 'AFC' : standing?.conference?.includes('National') ? 'NFC' : '';
  const divShort = standing?.division?.replace('AFC ', '').replace('NFC ', '') || '';

  return (
    <Link to={teamUrl}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
        style={{ border: '3px solid #013369', minHeight: '200px' }}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Team header */}
          <div className="flex items-center gap-3 mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={team.team_name} className="w-10 h-10 object-contain flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0">🏈</div>
            )}
            <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{team.team_name}</div>
          </div>

          {/* Conference & Division ranks */}
          {!loading && standing && (
            <div className="flex gap-3 text-xs mb-1">
              {confShort && (
                <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1 flex-1">
                  <span className="font-bold text-gray-900 text-sm">#{standing.rank}</span>
                  <span className="text-gray-400 text-center">{confShort} {divShort}</span>
                </div>
              )}
            </div>
          )}

          {/* W/L */}
          <div className="border-t border-gray-100 pt-3">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              </div>
            ) : !standing ? (
              <div className="text-xs text-gray-400 text-center py-2">Standings unavailable</div>
            ) : (
              <div className="grid grid-cols-2 gap-1 text-center">
                {[['W', standing.wins], ['L', standing.losses]].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-base font-bold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}