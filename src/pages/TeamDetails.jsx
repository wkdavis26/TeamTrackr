import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GameCard from '@/components/sports/GameCard';
import { fetchAllSchedules } from '@/components/sports/sportsApi';

export default function TeamDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team_id');
  const teamName = urlParams.get('team_name');
  const league = urlParams.get('league');

  // Single query for all favorite teams (used both for team lookup and schedules)
  const { data: allFavoriteTeams = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favoriteTeams'],
    queryFn: () => base44.entities.FavoriteTeam.list(),
  });

  const favoriteTeam = allFavoriteTeams.find(t => t.team_id === teamId);

  // Fetch schedules for all teams
  const { data: allGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ['schedules', allFavoriteTeams.map(t => t.team_id).join(',')],
    queryFn: () => fetchAllSchedules(allFavoriteTeams),
    enabled: allFavoriteTeams.length > 0,
    staleTime: 1000 * 60 * 5,
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

  if (isLoadingFavorites || isLoadingGames) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!favoriteTeam && !isLoadingTeam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team not found</h1>
          <Link to={createPageUrl('Home')} className="text-emerald-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

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