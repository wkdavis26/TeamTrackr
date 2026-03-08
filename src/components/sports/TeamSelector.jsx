import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { LEAGUES, fetchLeagueTeams } from './teamsData';

const SPORT_GROUPS = [
  { label: 'Football', keys: ['NFL', 'NCAAF'] },
  { label: 'Basketball', keys: ['NBA', 'WNBA', 'NCAAB'] },
  { label: 'Baseball', keys: ['MLB', 'NCAAB-Baseball'] },
  { label: 'Hockey', keys: ['NHL', 'PWHL'] },
  { label: 'Soccer', keys: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'MLS', 'NWSL', 'International Football', "Women's International Football"] },
  { label: 'Motorsport', keys: ['F1'] },
];

const LEAGUE_LOGOS = {
  NFL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png&w=80&h=80',
  NHL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png&w=80&h=80',
  MLB: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png&w=80&h=80',
  NBA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png&w=80&h=80',
  WNBA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/wnba.png&w=80&h=80',
  'Premier League': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/23.png&w=80&h=80',
  'La Liga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/15.png&w=80&h=80',
  'Serie A': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/12.png&w=80&h=80',
  'Bundesliga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/10.png&w=80&h=80',
  MLS: 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/19.png&w=80&h=80',
  'International Football': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/4.png&w=80&h=80',
  "Women's International Football": 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/49.png&w=80&h=80',
  NCAAF: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/ncf.png&w=80&h=80',
  NCAAB: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mens-college-basketball.png&w=80&h=80',
  'NCAAB-Baseball': 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/college-baseball.png&w=80&h=80',
  F1: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png&w=80&h=80',
  PWHL: 'https://1000logos.net/wp-content/uploads/2024/10/PWHL-Logo-500x281.png',
  NWSL: 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/182.png&w=80&h=80',
  };

const LeagueLogo = ({ leagueKey, league }) => {
  const [imgError, setImgError] = React.useState(false);
  const logo = LEAGUE_LOGOS[leagueKey];
  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={league?.name || leagueKey}
        className="w-8 h-8 object-contain"
        onError={() => setImgError(true)}
      />
    );
  }
  return <span className="text-2xl">{league?.icon || '🏆'}</span>;
};

export default function TeamSelector({ selectedTeams, onToggleTeam }) {
  const [expandedLeague, setExpandedLeague] = useState(null);
  const [leagueTeams, setLeagueTeams] = useState({});
  const [loadingLeague, setLoadingLeague] = useState(null);

  const isTeamSelected = (teamId) =>
    selectedTeams.some(t => t.team_id === teamId);

  const getSelectedCountForLeague = (leagueKey) =>
    selectedTeams.filter(t => t.league === leagueKey).length;

  const handleToggleLeague = async (leagueKey) => {
    if (expandedLeague === leagueKey) {
      setExpandedLeague(null);
      return;
    }
    setExpandedLeague(leagueKey);
    if (!leagueTeams[leagueKey]) {
      setLoadingLeague(leagueKey);
      const teams = await fetchLeagueTeams(leagueKey);
      setLeagueTeams(prev => ({ ...prev, [leagueKey]: teams }));
      setLoadingLeague(null);
    }
  };

  return (
    <div className="space-y-6">
      {SPORT_GROUPS.map(group => {
        const groupLeagues = group.keys.filter(k => LEAGUES[k]);
        if (groupLeagues.length === 0) return null;
        return (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.label}</h3>
            <div className="space-y-3">
              {groupLeagues.map((leagueKey) => {
                const league = LEAGUES[leagueKey];
                const isExpanded = expandedLeague === leagueKey;
                const selectedCount = getSelectedCountForLeague(leagueKey);
                const teams = leagueTeams[leagueKey] || [];
                const isLoading = loadingLeague === leagueKey;

                return (
                  <div key={leagueKey} className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
                    <button
                      onClick={() => handleToggleLeague(leagueKey)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <LeagueLogo leagueKey={leagueKey} league={league} />
                        <span className="font-semibold text-gray-900">{league.name}</span>
                        {selectedCount > 0 && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            {selectedCount} selected
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-100">
                            {isLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                              </div>
                            ) : (
                              <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {teams.map((team) => {
                                  const selected = isTeamSelected(team.id);
                                  return (
                                    <motion.button
                                      key={team.id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => onToggleTeam({
                                        team_id: team.id,
                                        team_name: team.name,
                                        league: leagueKey,
                                        logo: team.logo
                                      })}
                                      className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 text-center",
                                        selected
                                          ? "bg-emerald-50 border-2 border-emerald-500"
                                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                      )}
                                    >
                                      {team.logo ? (
                                        <img
                                          src={team.logo}
                                          alt={team.name}
                                          className="w-10 h-10 object-contain"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 flex items-center justify-center text-xl">
                                          {league.icon}
                                        </div>
                                      )}
                                      <span className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">
                                        {team.name}
                                      </span>
                                      {selected && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                          <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}