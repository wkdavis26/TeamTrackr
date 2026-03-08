import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch('https://lscluster.hockeytech.com/feed/index.php?feed=modulekit&view=schedule&key=446521baf8c38984&fmt=json&client_code=pwhl&lang_id=1&season_id=8&team_id=0&league_id=1');
    if (!res.ok) return Response.json({ games: [] });
    const data = await res.json();
    return Response.json({ games: data?.SiteKit?.Schedule || [] });
  } catch (e) {
    return Response.json({ error: e.message, games: [] }, { status: 500 });
  }
});