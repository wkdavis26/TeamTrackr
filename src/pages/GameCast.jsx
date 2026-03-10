import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const SPORT_PATHS = {
  NFL: 'football/nfl',
  NBA: 'basketball/nba',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NCAAF: 'football/college-football',
  NCAAB: 'basketball/mens-college-basketball',
  WNBA: 'basketball/wnba',
  'Premier League': 'soccer/eng.1',
  'La Liga': 'soccer/esp.1',
  'Serie A': 'soccer/ita.1',
  'Bundesliga': 'soccer/ger.1',
  MLS: 'soccer/usa.1',
  NWSL: 'soccer/usa.nwsl',
};

const STAT_KEYS = {
  NFL:   [{ key: 'totalYards', label: 'Total Yards' }, { key: 'netPassingYards', label: 'Pass Yds' }, { key: 'rushingYards', label: 'Rush Yds' }, { key: 'firstDowns', label: '1st Downs' }, { key: 'turnovers', label: 'Turnovers' }, { key: 'possessionTime', label: 'Possession' }],
  NCAAF: [{ key: 'totalYards', label: 'Total Yards' }, { key: 'netPassingYards', label: 'Pass Yds' }, { key: 'rushingYards', label: 'Rush Yds' }, { key: 'firstDowns', label: '1st Downs' }, { key: 'turnovers', label: 'Turnovers' }, { key: 'possessionTime', label: 'Possession' }],
  NBA:   [{ key: 'fieldGoalPct', label: 'FG%' }, { key: 'threePointPct', label: '3P%' }, { key: 'rebounds', label: 'Rebounds' }, { key: 'assists', label: 'Assists' }, { key: 'turnovers', label: 'Turnovers' }, { key: 'steals', label: 'Steals' }],
  WNBA:  [{ key: 'fieldGoalPct', label: 'FG%' }, { key: 'threePointPct', label: '3P%' }, { key: 'rebounds', label: 'Rebounds' }, { key: 'assists', label: 'Assists' }, { key: 'turnovers', label: 'Turnovers' }, { key: 'steals', label: 'Steals' }],
  NCAAB: [{ key: 'fieldGoalPct', label: 'FG%' }, { key: 'threePointPct', label: '3P%' }, { key: 'rebounds', label: 'Rebounds' }, { key: 'assists', label: 'Assists' }, { key: 'turnovers', label: 'Turnovers' }, { key: 'steals', label: 'Steals' }],
  NHL:   [{ key: 'saves', label: 'Saves' }, { key: 'powerPlayGoals', label: 'PPG' }, { key: 'faceOffWinPercentage', label: 'Faceoffs %' }, { key: 'hits', label: 'Hits' }, { key: 'blockedShots', label: 'Blocks' }, { key: 'pim', label: 'PIM' }],
};
const SOCCER_STATS = [{ key: 'possessionPct', label: 'Possession' }, { key: 'totalShots', label: 'Shots' }, { key: 'shotsOnTarget', label: 'On Target' }, { key: 'saves', label: 'Saves' }, { key: 'fouls', label: 'Fouls' }, { key: 'corners', label: 'Corners' }];
['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'MLS', 'NWSL'].forEach(l => { STAT_KEYS[l] = SOCCER_STATS; });

const getPeriodLabel = (index, league) => {
  if (['NFL', 'NCAAF'].includes(league)) return `Q${index + 1}`;
  if (['NBA', 'NCAAB', 'WNBA'].includes(league)) return index < 4 ? `Q${index + 1}` : `OT${index > 4 ? index - 3 : ''}`;
  if (league === 'NHL') return ['1st', '2nd', '3rd'][index] || 'OT';
  if (league === 'MLB') return `${index + 1}`;
  return `${index + 1}`;
};

function TeamHeader({ team }) {
  const logo = team?.team?.logos?.[0]?.href || team?.team?.logo;
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      {logo
        ? <img src={logo} alt={team?.team?.displayName} className="w-16 h-16 object-contain" />
        : <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🏆</div>
      }
      <div className="text-center">
        <div className="text-sm font-bold text-gray-900">{team?.team?.displayName || team?.team?.name}</div>
        <div className="text-xs text-gray-400 uppercase">{team?.homeAway}</div>
      </div>
    </div>
  );
}

function StatBar({ label, awayVal, homeVal }) {
  const awayNum = parseFloat(awayVal) || 0;
  const homeNum = parseFloat(homeVal) || 0;
  const total = awayNum + homeNum;
  const awayPct = total > 0 ? (awayNum / total) * 100 : 50;
  const homePct = total > 0 ? (homeNum / total) * 100 : 50;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-gray-800 w-16">{awayVal}</span>
        <span className="text-xs text-gray-400 text-center flex-1 mx-2">{label}</span>
        <span className="text-sm font-semibold text-gray-800 w-16 text-right">{homeVal}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        <div className="bg-blue-500 transition-all duration-700" style={{ width: `${awayPct}%` }} />
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${homePct}%` }} />
      </div>
    </div>
  );
}

export default function GameCast() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game_id');
  const league = urlParams.get('league');
  const sportPath = SPORT_PATHS[league];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    if (!gameId || !sportPath) return;
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${gameId}`);
      if (!res.ok) return;
      setData(await res.json());
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  }, [gameId, sportPath]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  const competition = data?.header?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const status = competition?.status;
  const isLive = status?.type?.state === 'in';
  const isFinal = status?.type?.state === 'post';

  const awayTeam = competitors.find(c => c.homeAway === 'away');
  const homeTeam = competitors.find(c => c.homeAway === 'home');

  const boxTeams = data?.boxscore?.teams || [];
  const awayStats = (boxTeams.find(t => t.homeAway === 'away') || boxTeams[0])?.statistics || [];
  const homeStats = (boxTeams.find(t => t.homeAway === 'home') || boxTeams[1])?.statistics || [];

  const awayLinescores = awayTeam?.linescores || [];
  const homeLinescores = homeTeam?.linescores || [];

  const scoringPlays = data?.scoringPlays || [];
  const statKeys = STAT_KEYS[league] || [];
  const playerTeams = data?.boxscore?.players || [];

  const statusText = isLive
    ? `${status?.displayClock || ''} · ${status?.period ? getPeriodLabel(status.period - 1, league) : ''}`
    : isFinal ? 'Final'
    : status?.type?.shortDetail || 'Scheduled';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Home')}>
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
          </Link>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <RefreshCw className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Score Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-center gap-2 mb-5">
            {isLive ? (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-red-600 uppercase tracking-wide">{statusText}</span>
              </div>
            ) : (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isFinal ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}>
                {statusText}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <TeamHeader team={awayTeam} />
            <div className="flex flex-col items-center gap-1">
              <div className="text-5xl font-black text-gray-900 tracking-tighter">
                {awayTeam?.score ?? '–'} <span className="text-gray-200">–</span> {homeTeam?.score ?? '–'}
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{league}</div>
            </div>
            <TeamHeader team={homeTeam} />
          </div>
        </motion.div>

        {/* Line Score */}
        {awayLinescores.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 overflow-x-auto">
            <table className="w-full text-sm text-center min-w-[300px]">
              <thead>
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="text-left px-2 pb-2 font-medium w-16">Team</th>
                  {awayLinescores.map((_, i) => (
                    <th key={i} className="px-2 pb-2 font-medium">{getPeriodLabel(i, league)}</th>
                  ))}
                  <th className="px-2 pb-2 font-bold text-gray-600">T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[{ team: awayTeam, linescores: awayLinescores }, { team: homeTeam, linescores: homeLinescores }].map(({ team, linescores }) => (
                  <tr key={team?.homeAway}>
                    <td className="text-left px-2 py-2 font-bold text-gray-800 whitespace-nowrap">
                      {team?.team?.abbreviation || (team?.homeAway === 'away' ? 'Away' : 'Home')}
                    </td>
                    {linescores.map((ls, i) => (
                      <td key={i} className="px-2 py-2 text-gray-600">{ls.displayValue ?? ls.value ?? '—'}</td>
                    ))}
                    <td className="px-2 py-2 font-bold text-gray-900">{team?.score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Team Stats */}
        {statKeys.length > 0 && (awayStats.length > 0 || homeStats.length > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              <span>{awayTeam?.team?.abbreviation || 'Away'}</span>
              <span>Team Stats</span>
              <span>{homeTeam?.team?.abbreviation || 'Home'}</span>
            </div>
            <div className="space-y-4">
              {statKeys.map(({ key, label }) => {
                const a = awayStats.find(s => s.name === key);
                const h = homeStats.find(s => s.name === key);
                if (!a && !h) return null;
                return <StatBar key={key} label={label} awayVal={a?.displayValue || '0'} homeVal={h?.displayValue || '0'} />;
              })}
            </div>
          </motion.div>
        )}

        {/* Individual Player Stats */}
        {playerTeams.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Player Stats</h3>
            {playerTeams.map((teamEntry, ti) => {
              const teamAbbr = teamEntry.team?.abbreviation || (ti === 0 ? awayTeam?.team?.abbreviation : homeTeam?.team?.abbreviation) || `Team ${ti + 1}`;
              return (
                <div key={ti} className={ti > 0 ? 'mt-6' : ''}>
                  <div className="text-xs font-bold text-gray-600 mb-3 pb-1 border-b border-gray-100">{teamAbbr}</div>
                  {(teamEntry.statistics || []).map((statGroup, gi) => {
                    const athletes = statGroup.athletes || [];
                    const labels = statGroup.labels || [];
                    const keys = statGroup.keys || [];
                    if (!athletes.length || !labels.length) return null;
                    return (
                      <div key={gi} className="mb-5 last:mb-0">
                        <div className="text-xs font-semibold text-emerald-600 mb-2">{statGroup.name}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[360px]">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left pb-1.5 font-medium w-32">Player</th>
                                {labels.map((l, li) => (
                                  <th key={li} className="text-right pb-1.5 font-medium px-1">{l}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {athletes.filter(a => a.active !== false && a.athlete).map((a, ai) => (
                                <tr key={ai} className="hover:bg-gray-50">
                                  <td className="py-1.5 pr-2 font-medium text-gray-800 whitespace-nowrap truncate max-w-[120px]">
                                    {a.athlete?.shortName || a.athlete?.displayName}
                                    {a.starter && <span className="ml-1 text-gray-300 text-[10px]">•</span>}
                                  </td>
                                  {(a.stats || []).map((val, vi) => (
                                    <td key={vi} className="py-1.5 text-right text-gray-600 px-1 tabular-nums">{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Scoring Plays */}
        {scoringPlays.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Scoring Plays</h3>
            <div className="space-y-3">
              {scoringPlays.slice().reverse().map((play, i) => {
                const logo = play.team?.logos?.[0]?.href || play.team?.logo;
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    {logo
                      ? <img src={logo} alt="" className="w-6 h-6 object-contain flex-shrink-0 mt-0.5" />
                      : <div className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{play.text || play.type?.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {play.clock?.displayValue && `${play.clock.displayValue} · `}
                        {play.period?.displayValue || (play.period?.number && getPeriodLabel((play.period.number || 1) - 1, league))}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-gray-500 whitespace-nowrap flex-shrink-0">
                      {play.awayScore}–{play.homeScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!data && (
          <div className="text-center py-12 text-gray-400">
            <p>No game data available</p>
          </div>
        )}
      </div>
    </div>
  );
}