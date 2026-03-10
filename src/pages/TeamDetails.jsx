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

  // Filter games for this team only, grouped by date
  const teamGames = useMemo(() => {
    return allGames
      .filter(game => game.favoriteTeamId === teamId)
      .sort((a, b) => a.date - b.date);
  }, [allGames, teamId]);

  const gamesByDate = useMemo(() => {
    const groups = {};
    teamGames.forEach(game => {
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(game.date));
      if (!groups[key]) groups[key] = [];
      groups[key].push(game);
    });
    return groups;
  }, [teamGames]);

  const formatDateHeader = (dateKey) => {
    const d = new Date(dateKey + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(today);
    const tomorrowKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(tomorrow);
    if (dateKey === todayKey) return 'Today';
    if (dateKey === tomorrowKey) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

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

  // F1 standings
  const [f1Standings, setF1Standings] = useState(null);
  useEffect(() => {
    if (league !== 'F1') return;
    (async () => {
      const res = await base44.functions.invoke('f1Standings', {});
      const data = res.data;
      const allDrivers = data.drivers || [];
      const allConstructors = data.constructors || [];
      const teamDrivers = allDrivers.filter(d => d.teamId === teamId).sort((a, b) => a.rank - b.rank);
      const constructor = allConstructors.find(c => c.teamId === teamId);
      setF1Standings({ drivers: teamDrivers, constructor });
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
          {favoriteTeam?.logo_url ? (
            <img src={favoriteTeam.logo_url} alt={teamName} className="w-16 h-16 object-contain" />
          ) : (
            <div className="text-5xl">{getLeagueIcon()}</div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{teamName}</h1>
            <p className="text-gray-500">{league} Upcoming {league === 'F1' ? 'Races' : 'Games'}</p>
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
            <div className="flex flex-col gap-2">
              {f1Standings.constructor && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-700 flex-1">Constructors Championship</span>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">#{f1Standings.constructor.rank}</span>
                  <span className="text-sm text-gray-400 w-14 text-right">{f1Standings.constructor.pts} pts</span>
                </div>
              )}
              {f1Standings.drivers.map(driver => (
                <div key={driver.abbr} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                  {driver.flagUrl && <img src={driver.flagUrl} alt="" className="w-5 h-4 object-cover rounded-sm flex-shrink-0" />}
                  <span className="text-sm text-gray-700 flex-1">{driver.name}</span>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">#{driver.rank}</span>
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
          <div className="space-y-6">
            {Object.entries(gamesByDate).map(([dateKey, games]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {formatDateHeader(dateKey)}
                </h3>
                <div className="space-y-4">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} compact={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}