import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { LEAGUES } from './teamsData';

const fetchStandings = async (league, teamId) => {
  const leagueData = LEAGUES[league];
  if (!leagueData?.espnPath) return null;
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${leagueData.espnPath}/standings`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entries = data.standings?.entries || data.children?.flatMap(c => c.standings?.entries || []) || [];
    // Find matching team entry
    const entry = entries.find(e => {
      const abbr = e.team?.abbreviation?.toLowerCase();
      const suffix = teamId.split('-').slice(1).join('-');
      return abbr === suffix || teamId.endsWith(`-${abbr}`);
    });
    if (!entry) return null;
    const stats = {};
    entry.stats?.forEach(s => { stats[s.name] = s.displayValue; });
    return {
      rank: entry.note?.rank || entries.indexOf(entry) + 1,
      wins: stats.wins || stats.W || stats.w || '—',
      losses: stats.losses || stats.L || stats.l || '—',
      pct: stats.winPercent || stats.PCT || stats.pct || null,
      streak: stats.streak || stats.streakCode || null,
      gb: stats.gamesBehind || stats.GB || null,
      pts: stats.points || stats.PTS || null,
    };
  } catch {
    return null;
  }
};

function TeamStandingCard({ team }) {
  const [standing, setStanding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings(team.league, team.team_id).then(s => {
      setStanding(s);
      setLoading(false);
    });
  }, [team.team_id, team.league]);

  const leagueColor = LEAGUES[team.league]?.color || '#6b7280';
  const leagueIcon = LEAGUES[team.league]?.icon || '🏆';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: leagueColor }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Team header */}
        <div className="flex items-center gap-3">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.team_name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-2xl">{leagueIcon}</div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{team.team_name}</div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{leagueIcon}</span>
              <span>{team.league}</span>
            </div>
          </div>
        </div>

        {/* Standings */}
        <div className="border-t border-gray-100 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
          ) : standing ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{standing.wins}</div>
                <div className="text-xs text-gray-400">W</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{standing.losses}</div>
                <div className="text-xs text-gray-400">L</div>
              </div>
              <div>
                {standing.pct ? (
                  <>
                    <div className="text-lg font-bold text-gray-900">{standing.pct}</div>
                    <div className="text-xs text-gray-400">PCT</div>
                  </>
                ) : standing.pts ? (
                  <>
                    <div className="text-lg font-bold text-gray-900">{standing.pts}</div>
                    <div className="text-xs text-gray-400">PTS</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-900">—</div>
                    <div className="text-xs text-gray-400">—</div>
                  </>
                )}
              </div>
              {standing.streak && (
                <div className="col-span-3 text-xs text-gray-400 mt-1">
                  Streak: <span className="font-medium text-gray-600">{standing.streak}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-2">Standings unavailable</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TeamsOverview({ favoriteTeams }) {
  if (favoriteTeams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
        <p className="text-gray-500">Add teams to see their standings here</p>
      </div>
    );
  }

  // Group by league
  const byLeague = favoriteTeams.reduce((acc, t) => {
    if (!acc[t.league]) acc[t.league] = [];
    acc[t.league].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(byLeague).map(([league, teams]) => (
        <div key={league}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{LEAGUES[league]?.icon || '🏆'}</span>
            <h3 className="text-lg font-bold text-gray-900">{league}</h3>
            <span className="text-sm text-gray-400">({teams.length} team{teams.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {teams.map(team => (
              <TeamStandingCard key={team.team_id} team={team} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}