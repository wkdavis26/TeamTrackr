import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ExternalLink, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

const LEAGUE_PATHS = {
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NBA: 'basketball/nba',
  WNBA: 'basketball/wnba',
  NCAAF: 'football/college-football',
  NCAAB: 'basketball/mens-college-basketball',
  'NCAAB-Baseball': 'baseball/college-baseball',
  'Premier League': 'soccer/eng.1',
  'La Liga': 'soccer/esp.1',
  'Serie A': 'soccer/ita.1',
  'Bundesliga': 'soccer/ger.1',
  MLS: 'soccer/usa.1',
  NWSL: 'soccer/usa.nwsl',
};

// Extract abbreviation from our custom team_id slug
// e.g. "nfl-ne" -> "NE", "premier-league-ars" -> "ARS"
function getAbbrFromTeamId(teamId) {
  const parts = teamId.split('-');
  // Last part is always the abbreviation
  return parts[parts.length - 1].toUpperCase();
}

async function fetchAllTeamsNews(favoriteTeams) {
  const supported = favoriteTeams.filter(t => LEAGUE_PATHS[t.league]);
  if (!supported.length) return [];

  // Group by league
  const byLeague = {};
  supported.forEach(t => {
    if (!byLeague[t.league]) byLeague[t.league] = [];
    byLeague[t.league].push(t);
  });

  // For each league, fetch ESPN teams to get numeric IDs, then fetch news per team
  const allArticles = await Promise.all(
    Object.entries(byLeague).map(async ([league, teams]) => {
      const path = LEAGUE_PATHS[league];
      try {
        // Get ESPN team list with numeric IDs
        const teamsRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/teams?limit=500`);
        if (!teamsRes.ok) return [];
        const teamsData = await teamsRes.json();
        const espnTeams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];

        // Build abbreviation -> ESPN numeric id map
        const abbrToId = {};
        espnTeams.forEach(({ team }) => {
          if (team?.abbreviation && team?.id) {
            abbrToId[team.abbreviation.toUpperCase()] = team.id;
          }
        });

        // Fetch news for each followed team using numeric ESPN ID
        const teamNewsResults = await Promise.all(
          teams.map(async (team) => {
            const abbr = getAbbrFromTeamId(team.team_id);
            const espnId = abbrToId[abbr];
            if (!espnId) return [];
            try {
              const newsRes = await fetch(
                `https://site.api.espn.com/apis/site/v2/sports/${path}/news?team=${espnId}&limit=8`
              );
              if (!newsRes.ok) return [];
              const newsData = await newsRes.json();
              return (newsData.articles || []).map(a => ({
                ...a,
                _teamName: team.team_name,
                _teamLogo: team.logo_url,
              }));
            } catch {
              return [];
            }
          })
        );
        return teamNewsResults.flat();
      } catch {
        return [];
      }
    })
  );

  // Flatten, deduplicate by article id, sort newest first
  const seen = new Set();
  const all = allArticles.flat().filter(a => {
    if (!a.id || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  return all.sort((a, b) => new Date(b.published) - new Date(a.published));
}

function getArticleImage(article) {
  const imgs = article.images || [];
  const media = imgs.find(i => i.type === 'Media' && i.url);
  const ratio = imgs.find(i => i.ratio === '16x9' && i.url);
  return (media || ratio || imgs[0])?.url || null;
}

export default function AllTeamsNews({ favoriteTeams, onAddTeams }) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['allTeamsNews', favoriteTeams.map(t => t.team_id).join(',')],
    queryFn: () => fetchAllTeamsNews(favoriteTeams),
    enabled: favoriteTeams.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  if (favoriteTeams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📰</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams selected</h3>
        <p className="text-gray-500 mb-6">Follow teams to see their latest news here</p>
        <Button onClick={onAddTeams} className="bg-emerald-500 hover:bg-emerald-600">
          <Heart className="w-4 h-4 mr-2" />
          Choose Teams
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">News Feed</h2>
        <p className="text-gray-500 text-sm">Latest headlines from your teams</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading news...</span>
        </div>
      ) : articles.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">No recent news found for your teams.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map(article => {
            const img = getArticleImage(article);
            const url = article.links?.web?.href;
            const timeAgo = article.published
              ? formatDistanceToNow(new Date(article.published), { addSuffix: true })
              : null;

            return (
              <a
                key={article.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3 group"
              >
                {img && (
                  <img
                    src={img}
                    alt=""
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {article.headline}
                  </p>
                  {article.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {article._teamLogo && (
                      <img src={article._teamLogo} alt="" className="w-4 h-4 object-contain" />
                    )}
                    <span className="text-xs text-gray-400">{article._teamName}</span>
                    {timeAgo && <span className="text-xs text-gray-300">· {timeAgo}</span>}
                    <ExternalLink className="w-3 h-3 text-gray-300 ml-auto flex-shrink-0" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}