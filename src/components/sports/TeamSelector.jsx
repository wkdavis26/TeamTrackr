import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEAGUES } from './teamsData';

export default function TeamSelector({ selectedTeams, onToggleTeam }) {
  const [expandedLeague, setExpandedLeague] = useState(null);

  const isTeamSelected = (teamId) => {
    return selectedTeams.some(t => t.team_id === teamId);
  };

  const getSelectedCountForLeague = (leagueKey) => {
    return selectedTeams.filter(t => t.league === leagueKey).length;
  };

  return (
    <div className="space-y-3">
      {Object.entries(LEAGUES).map(([leagueKey, league]) => {
        const isExpanded = expandedLeague === leagueKey;
        const selectedCount = getSelectedCountForLeague(leagueKey);
        
        return (
          <div key={leagueKey} className="overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <button
              onClick={() => setExpandedLeague(isExpanded ? null : leagueKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{league.icon}</span>
                <span className="font-semibold text-white">{league.name}</span>
                {selectedCount > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    {selectedCount} selected
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
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
                  <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {league.teams.map((team) => {
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
                            "relative flex items-center gap-2 p-3 rounded-xl transition-all duration-200",
                            selected 
                              ? "bg-emerald-500/20 border-2 border-emerald-500 text-white" 
                              : "bg-slate-700/50 border-2 border-transparent text-slate-300 hover:bg-slate-700"
                          )}
                        >
                          <span className="text-lg">{team.logo}</span>
                          <span className="text-sm font-medium truncate">{team.name}</span>
                          {selected && (
                            <Check className="absolute top-1 right-1 w-4 h-4 text-emerald-400" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}