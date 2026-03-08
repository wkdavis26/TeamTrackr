import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, List, Heart, Loader2, LayoutGrid, Tv2, Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TeamSelector from '@/components/sports/TeamSelector';
import UpcomingGames from '@/components/sports/UpcomingGames';
import CalendarView from '@/components/sports/CalendarView';
import TeamsOverview from '@/components/sports/TeamsOverview';
import LeagueGames from '@/components/sports/LeagueGames';
import { fetchAllSchedules } from '@/components/sports/sportsApi';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: List },
  { id: 'overview', label: 'Standings', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'league', label: 'All Games', icon: Tv2 },
  { id: 'teams', label: 'My Teams', icon: Settings },
];

export default function Home() {
  const [view, setView] = useState('overview');
  const [hidePreseason, setHidePreseason] = useState(() => {
    return localStorage.getItem('hidePreseason') === 'true';
  });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: favoriteTeams = [], isLoading } = useQuery({
    queryKey: ['favoriteTeams', currentUser?.email],
    queryFn: () => base44.entities.FavoriteTeam.filter({ created_by: currentUser.email }),
    enabled: !!currentUser
  });

  const { data: upcomingGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ['schedules-v3', favoriteTeams.map((t) => t.team_id).join(',')],
    queryFn: () => fetchAllSchedules(favoriteTeams),
    enabled: favoriteTeams.length > 0,
    staleTime: 0
  });

  const createTeamMutation = useMutation({
    mutationFn: (team) => base44.entities.FavoriteTeam.create(team),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteTeams'] })
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => {
      const team = favoriteTeams.find((t) => t.team_id === teamId);
      if (team) return base44.entities.FavoriteTeam.delete(team.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteTeams'] })
  });

  const handleToggleTeam = (team) => {
    const existing = favoriteTeams.find((t) => t.team_id === team.team_id);
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
    <div className="flex flex-col bg-gray-50" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe-top">
        <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">TeamTrackr</h1>
          {view === 'teams' && (
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1.5 text-sm text-gray-400 active:text-gray-700 transition-colors py-2 px-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-4">
          <AnimatePresence mode="wait">
            {view === 'upcoming' && (
              <motion.div key="upcoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {favoriteTeams.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
                    <p className="text-gray-500 mb-6">Select your favorite teams to see upcoming games</p>
                    <Button onClick={() => setView('teams')} className="bg-emerald-500 hover:bg-emerald-600">
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
                        onChange={(e) => {
                          setHidePreseason(e.target.checked);
                          localStorage.setItem('hidePreseason', e.target.checked);
                        }}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <label htmlFor="hide-preseason" className="text-sm text-gray-500 select-none">
                        Hide preseason games
                      </label>
                    </div>
                    <UpcomingGames games={hidePreseason ? upcomingGames.filter((g) => !g.isPreseason) : upcomingGames} />
                  </>
                )}
              </motion.div>
            )}

            {view === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Standings</h2>
                  <p className="text-gray-500 text-sm">Drag leagues to reorder</p>
                </div>
                <TeamsOverview favoriteTeams={favoriteTeams} />
              </motion.div>
            )}

            {view === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CalendarView
                  games={upcomingGames}
                  hidePreseason={hidePreseason}
                  onToggleHidePreseason={(checked) => {
                    setHidePreseason(checked);
                    localStorage.setItem('hidePreseason', checked);
                  }}
                />
              </motion.div>
            )}

            {view === 'league' && (
              <motion.div key="league" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LeagueGames favoriteTeams={favoriteTeams} />
              </motion.div>
            )}

            {view === 'teams' && (
              <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">My Teams</h2>
                  <p className="text-gray-500 text-sm">Choose teams from any league to track their games</p>
                </div>
                <TeamSelector selectedTeams={favoriteTeams} onToggleTeam={handleToggleTeam} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 pb-safe-bottom">
        <div className="flex items-stretch max-w-7xl mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = view === id;
            const badge = id === 'upcoming' && upcomingGames.length > 0 ? upcomingGames.length
              : id === 'teams' && favoriteTeams.length > 0 ? favoriteTeams.length
              : null;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors active:bg-gray-50",
                  isActive ? "text-emerald-500" : "text-gray-400"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium", isActive ? "text-emerald-500" : "text-gray-400")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}