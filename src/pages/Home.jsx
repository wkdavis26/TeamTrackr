import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, List, Settings, Heart, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TeamSelector from '@/components/sports/TeamSelector';
import UpcomingGames from '@/components/sports/UpcomingGames';
import CalendarView from '@/components/sports/CalendarView';
import { LEAGUES } from '@/components/sports/teamsData';
import { fetchAllSchedules } from '@/components/sports/sportsApi';

export default function Home() {
  const [view, setView] = useState('upcoming'); // 'upcoming', 'calendar', 'teams'
  const queryClient = useQueryClient();

  // Fetch favorite teams
  const { data: favoriteTeams = [], isLoading } = useQuery({
    queryKey: ['favoriteTeams'],
    queryFn: () => base44.entities.FavoriteTeam.list(),
  });

  // Fetch real schedule data from APIs
  const { data: upcomingGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ['schedules', favoriteTeams.map(t => t.team_id).join(',')],
    queryFn: () => fetchAllSchedules(favoriteTeams),
    enabled: favoriteTeams.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (team) => base44.entities.FavoriteTeam.create(team),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteTeams'] }),
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => {
      const team = favoriteTeams.find(t => t.team_id === teamId);
      if (team) return base44.entities.FavoriteTeam.delete(team.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteTeams'] }),
  });

  const handleToggleTeam = (team) => {
    const existing = favoriteTeams.find(t => t.team_id === team.team_id);
    if (existing) {
      deleteTeamMutation.mutate(team.team_id);
    } else {
      createTeamMutation.mutate({
        team_id: team.team_id,
        team_name: team.team_name,
        league: team.league,
        logo_url: team.logo
      });
    }
  };



  if (isLoading || isLoadingGames) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            My Sports
          </h1>
          <p className="text-slate-400">
            Track your favorite teams across all leagues
          </p>
        </motion.header>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-6 mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="text-white font-medium">{favoriteTeams.length}</span>
            <span className="text-slate-400 text-sm">Teams</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-white font-medium">{upcomingGames.length}</span>
            <span className="text-slate-400 text-sm">Upcoming</span>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <Button
              variant="ghost"
              onClick={() => setView('upcoming')}
              className={cn(
                "rounded-xl px-6 transition-all duration-200",
                view === 'upcoming' 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <List className="w-4 h-4 mr-2" />
              Upcoming
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('calendar')}
              className={cn(
                "rounded-xl px-6 transition-all duration-200",
                view === 'calendar' 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('teams')}
              className={cn(
                "rounded-xl px-6 transition-all duration-200",
                view === 'teams' 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <Settings className="w-4 h-4 mr-2" />
              My Teams
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'upcoming' && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {favoriteTeams.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No teams selected</h3>
                  <p className="text-slate-400 mb-6">Select your favorite teams to see upcoming games</p>
                  <Button 
                    onClick={() => setView('teams')}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Choose Teams
                  </Button>
                </div>
              ) : (
                <UpcomingGames games={upcomingGames} />
              )}
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CalendarView games={upcomingGames} />
            </motion.div>
          )}

          {view === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Teams</h2>
                <p className="text-slate-400">Choose teams from any league to track their games</p>
              </div>
              <TeamSelector 
                selectedTeams={favoriteTeams}
                onToggleTeam={handleToggleTeam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}