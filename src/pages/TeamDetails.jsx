import React, { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GameCard from '@/components/sports/GameCard';
import TeamNews from '@/components/sports/TeamNews';
import { fetchAllSchedules } from '@/components/sports/sportsApi';
import { LEAGUES } from '@/components/sports/teamsData';

export default function TeamDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team_id');
  const teamName = urlParams.get('team_name');
  const league = urlParams.get('league');

  // Redirect to Home if no team is selected (must be in useEffect to avoid calling hooks conditionally)
  useEffect(() => {
    if (!teamId) {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [teamId]);

  // Single query for all favorite teams (used both for team lookup and schedules)
  const { data: allFavoriteTeams = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favoriteTeams'],
    queryFn: () => base44.entities.FavoriteTeam.list(),
  });

  const favoriteTeam = allFavoriteTeams.find(t => t.team_id === teamId);

  // Fetch schedules for all teams
  const { data: allGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ['schedules-v2', allFavoriteTeams.map(t => t.team_id).join(',')],
    queryFn: () => fetchAllSchedules(allFavoriteTeams),
    enabled: allFavoriteTeams.length > 0,
    staleTime: 0,
  });

  // Filter games for this team only
  const teamGames = useMemo(() => {
    return allGames
      .filter(game => game.favoriteTeamId === teamId)
      .sort((a, b) => a.date - b.date);
  }, [allGames, teamId]);

  const getLeagueIcon = () => {
    const icons = {
      NFL: '🏈', NHL: '🏒', MLB: '⚾', NBA: '🏀',
      'Premier League': '⚽', 'La Liga': '⚽', F1: '🏎️',
      MLS: '⚽', NCAAF: '🏈', 'FIFA World Cup': '🌍',
      'UEFA Euro': '⚽', 'International': '🌏'
    };
    return icons[league] || '🏆';
  };

  useEffect(() => {
    if (!isLoadingFavorites && !favoriteTeam && teamId) {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [isLoadingFavorites, favoriteTeam, teamId]);

  const DRIVER_TEAM_MAP = {
    'RUS': 'f1-mercedes', 'ANT': 'f1-mercedes',
    'VER': 'f1-red-bull', 'HAD': 'f1-red-bull',
    'LEC': 'f1-ferrari',  'HAM': 'f1-ferrari',
    'NOR': 'f1-mclaren',  'PIA': 'f1-mclaren',
    'ALO': 'f1-aston-martin', 'STR': 'f1-aston-martin',
    'GAS': 'f1-alpine',   'DOO': 'f1-alpine',
    'ALB': 'f1-williams', 'SAI': 'f1-williams',
    'LAW': 'f1-alphatauri', 'TSU': 'f1-alphatauri',
    'HUL': 'f1-alfa-romeo', 'BOR': 'f1-alfa-romeo',
    'OCO': 'f1-haas',     'BEA': 'f1-haas',
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
    if (n.includes('racing bulls') || n.includes('rb') || n.includes('alphatauri')) return 'f1-alphatauri';
    if (n.includes('sauber') || n.includes('kick')) return 'f1-alfa-romeo';
    if (n.includes('haas')) return 'f1-haas';
    return null;
  };

  // F1 standings
  const [f1Standings, setF1Standings] = useState(null);
  useEffect(() => {
    if (league !== 'F1') return;
    (async () => {
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`https://site.api.espn.com/apis/v2/sports/racing/f1/standings?season=${year}`);
        if (!res.ok) return;
        const data = await res.json();
        const driverGroup = data.children?.find(c => c.name?.toLowerCase().includes('driver')) || data.children?.[0];
        const constructorGroup = data.children?.find(c => c.name?.toLowerCase().includes('constructor')) || data.children?.[1];
        const drivers = (driverGroup?.standings?.entries || []).map(entry => ({
          name: entry.athlete?.shortName || entry.athlete?.displayName || '',
          abbr: entry.athlete?.abbreviation || '',
          flagUrl: entry.athlete?.flag?.href || null,
          rank: parseInt(entry.stats?.find(s => s.name === 'rank')?.displayValue) || 0,
          pts: entry.stats?.find(s => s.name === 'championshipPts')?.displayValue || '0',
        }));
        const constructors = (constructorGroup?.standings?.entries || []).map(entry => ({
          name: entry.team?.displayName || entry.team?.name || '',
          rank: parseInt(entry.stats?.find(s => s.name === 'rank')?.displayValue) || 0,
          pts: entry.stats?.find(s => s.name === 'championshipPts')?.displayValue || '0',
        }));
        const teamDrivers = drivers.filter(d => DRIVER_TEAM_MAP[d.abbr] === teamId).sort((a, b) => a.rank - b.rank);
        const constructor = constructors.find(c => teamNameToId(c.name) === teamId);
        setF1Standings({ drivers: teamDrivers, constructor });
      } catch {}
    })();
  }, [league, teamId]);

  if (!teamId) return null;

  if (isLoadingFavorites || isLoadingGames) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!favoriteTeam) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Link to={createPageUrl('Home')}>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </motion.button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="text-5xl">{getLeagueIcon()}</div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{teamName}</h1>
            <p className="text-gray-500">{league} Upcoming Games</p>
          </div>
        </motion.div>

        {/* F1 Driver Standings */}
        {league === 'F1' && f1Standings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Standings</h2>
            {f1Standings.constructor && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                <span className="text-sm text-gray-600 font-medium">Constructors Championship</span>
                <span className="ml-auto font-bold text-gray-900">#{f1Standings.constructor.rank}</span>
                <span className="text-sm text-gray-400">{f1Standings.constructor.pts} pts</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {f1Standings.drivers.map(driver => (
                <div key={driver.abbr} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                  {driver.flagUrl && <img src={driver.flagUrl} alt="" className="w-5 h-4 object-cover rounded-sm flex-shrink-0" />}
                  <span className="text-sm text-gray-700 flex-1">{driver.name}</span>
                  <span className="font-bold text-gray-900 text-sm">#{driver.rank}</span>
                  <span className="text-sm text-gray-400 w-14 text-right">{driver.pts} pts</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* News */}
        <TeamNews teamId={teamId} league={league} />

        {/* Games list */}
        {isLoadingGames ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : teamGames.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🏁</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No upcoming games</h2>
            <p className="text-gray-500">Check back later for the schedule</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {teamGames.map((game) => (
              <GameCard key={game.id} game={game} compact={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}