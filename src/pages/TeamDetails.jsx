import React, { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GameCard from '@/components/sports/GameCard';
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

  // F1 standings
  const [f1Standings, setF1Standings] = useState(null);
  useEffect(() => {
    if (league !== 'F1') return;
    import('@/components/sports/F1StandingCard').then(mod => {
      // We can't import fetchF1Standings directly, so fetch inline
      const year = new Date().getFullYear();
      const urls = [
        `https://site.api.espn.com/apis/v2/sports/racing/f1/standings?season=${year}`,
        `https://site.api.espn.com/apis/v2/sports/racing/f1/standings`,
      ];
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
      (async () => {
        for (const url of urls) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            const driverGroup = data.children?.find(c => c.name?.toLowerCase().includes('driver')) || data.children?.[0];
            const constructorGroup = data.children?.find(c => c.name?.toLowerCase().includes('constructor')) || data.children?.[1];
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
            if (drivers.length > 0) {
              const teamDrivers = drivers.filter(d => teamNameToId(d.teamName) === teamId).sort((a, b) => a.rank - b.rank);
              const constructor = constructors.find(c => teamNameToId(c.name) === teamId);
              setF1Standings({ drivers: teamDrivers, constructor });
              return;
            }
          } catch {}
        }
      })();
    });
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