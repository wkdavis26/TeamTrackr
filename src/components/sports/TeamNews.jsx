import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

async function fetchTeamNews(league, teamId) {
  const path = LEAGUE_PATHS[league];
  if (!path) return [];
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/news?team=${teamId}&limit=10`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles || []).slice(0, 8);
}

function getArticleImage(article) {
  const imgs = article.images || [];
  const media = imgs.find(i => i.type === 'Media' && i.url);
  const ratio = imgs.find(i => i.ratio === '16x9' && i.url);
  return (media || ratio || imgs[0])?.url || null;
}

export default function TeamNews({ teamId, league }) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['teamNews', teamId, league],
    queryFn: () => fetchTeamNews(league, teamId),
    staleTime: 1000 * 60 * 5,
  });

  if (!LEAGUE_PATHS[league]) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Latest News</h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading news...</span>
        </div>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No recent news found.</p>
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
                    className="w-20 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
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
                  <div className="flex items-center gap-1 mt-1.5">
                    {timeAgo && <span className="text-xs text-gray-400">{timeAgo}</span>}
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