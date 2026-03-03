import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, List, Settings, Heart, Loader2, LayoutGrid } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TeamSelector from '@/components/sports/TeamSelector';
import UpcomingGames from '@/components/sports/UpcomingGames';
import CalendarView from '@/components/sports/CalendarView';
import TeamsOverview from '@/components/sports/TeamsOverview';
import { LEAGUES } from '@/components/sports/teamsData';
import { fetchAllSchedules } from '@/components/sports/sportsApi';

export default function Home() {
  const [view, setView] = useState('overview'); // 'upcoming', 'overview', 'calendar', 'teams'
  const [hidePreseason, setHidePreseason] = useState(() => {
    return localStorage.getItem('hidePreseason') === 'true';
  });
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



  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            TeamTrackr
          </h1>
          <p className="text-gray-500">
            Track all your favorite teams so you never miss a play
          </p>
        </motion.header>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-x-auto max-w-full">
            <Button
              variant="ghost"
              onClick={() => setView('upcoming')}
              className={cn(
                "rounded-xl px-3 md:px-6 transition-all duration-200 whitespace-nowrap",
                view === 'upcoming'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <List className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-sm">Upcoming {upcomingGames.length > 0 && `(${upcomingGames.length})`}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('overview')}
              className={cn(
                "rounded-xl px-3 md:px-6 transition-all duration-200 whitespace-nowrap",
                view === 'overview'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-sm">Standings</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('calendar')}
              className={cn(
                "rounded-xl px-3 md:px-6 transition-all duration-200 whitespace-nowrap",
                view === 'calendar'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Calendar className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-sm">Calendar</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('teams')}
              className={cn(
                "rounded-xl px-3 md:px-6 transition-all duration-200 whitespace-nowrap",
                view === 'teams'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Settings className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-sm">My Teams {favoriteTeams.length > 0 && `(${favoriteTeams.length})`}</span>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
                  <p className="text-gray-500 mb-6">Select your favorite teams to see upcoming games</p>
                  <Button
                    onClick={() => setView('teams')}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Choose Teams
                  </Button>
                </div>
              ) : isLoadingGames ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-2" />
                  <span className="text-gray-500">Loading schedules...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="hide-preseason"
                      checked={hidePreseason}
                      onChange={e => {
                        setHidePreseason(e.target.checked);
                        localStorage.setItem('hidePreseason', e.target.checked);
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="hide-preseason" className="text-sm text-gray-500 cursor-pointer select-none">
                      Hide preseason games
                    </label>
                  </div>
                  <UpcomingGames games={hidePreseason ? upcomingGames.filter(g => !g.isPreseason) : upcomingGames} />
                </>
              )}
            </motion.div>
          )}

          {view === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Standings</h2>
                <p className="text-gray-500">Current standings for your favorite teams · drag leagues to reorder</p>
              </div>
              <TeamsOverview favoriteTeams={favoriteTeams} />
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CalendarView
                games={upcomingGames}
                hidePreseason={hidePreseason}
                onToggleHidePreseason={checked => {
                  setHidePreseason(checked);
                  localStorage.setItem('hidePreseason', checked);
                }}
              />
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Teams</h2>
                <p className="text-gray-500">Choose teams from any league to track their games</p>
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