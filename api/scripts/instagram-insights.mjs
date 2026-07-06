#!/usr/bin/env node
/**
 * Instagram (Meta Graph API) analytics extractor for @neuroespresso.
 *
 * Pulls account-level insights, audience demographics, and per-media metrics
 * for an Instagram Business/Creator account and writes them to JSON.
 *
 * SECRETS: never hardcode the token. Provide it via env only.
 *
 *   IG_ACCESS_TOKEN   (required)  long-lived user or page access token
 *   IG_USER_ID        (optional)  Instagram Business account id — auto-resolved
 *                                 from your linked Facebook Page if omitted
 *   GRAPH_VERSION     (optional)  Graph API version, default v21.0
 *   IG_MEDIA_LIMIT    (optional)  how many recent media to pull, default 25
 *
 * Run:
 *   IG_ACCESS_TOKEN=xxxx node api/scripts/instagram-insights.mjs
 *   # → writes api/scripts/out/insights-<timestamp>.json
 *
 * Note: Meta rotates which metric names are valid per Graph version. If a
 * metric 400s ("does not support the ... metric"), drop it from the arrays
 * below — the docs for your version list the current set.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.IG_ACCESS_TOKEN;
const VERSION = process.env.GRAPH_VERSION || 'v21.0';
const MEDIA_LIMIT = Number(process.env.IG_MEDIA_LIMIT || 25);
const BASE = `https://graph.facebook.com/${VERSION}`;

if (!TOKEN) {
  console.error('ERROR: set IG_ACCESS_TOKEN (see header of this file).');
  process.exit(1);
}

/** GET a Graph API path with query params; throws on API error. */
async function graph(path, params = {}) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', TOKEN);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph ${path} → ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

/** Resolve the IG Business account id from the first linked Facebook Page. */
async function resolveIgUserId() {
  if (process.env.IG_USER_ID) return process.env.IG_USER_ID;
  const pages = await graph('me/accounts', { fields: 'name,instagram_business_account' });
  const page = (pages.data || []).find((p) => p.instagram_business_account);
  if (!page) {
    throw new Error(
      'No Facebook Page with a linked Instagram Business account found for this token. ' +
        'Link @neuroespresso to a Facebook Page, or pass IG_USER_ID explicitly.',
    );
  }
  return page.instagram_business_account.id;
}

async function main() {
  const igId = await resolveIgUserId();

  // Profile snapshot
  const profile = await graph(igId, {
    fields: 'username,name,followers_count,follows_count,media_count,biography',
  });

  // Account insights — "time series" style day metrics
  const daily = await safe(() =>
    graph(`${igId}/insights`, {
      metric: 'reach,profile_views',
      period: 'day',
      metric_type: 'total_value',
    }),
  );

  // Follower count trend (last 30 days)
  const followerTrend = await safe(() =>
    graph(`${igId}/insights`, { metric: 'follower_count', period: 'day' }),
  );

  // Audience demographics (needs >= 100 followers — @neuroespresso has ~14.5K)
  const demographics = {};
  for (const breakdown of ['age', 'gender', 'country', 'city']) {
    demographics[breakdown] = await safe(() =>
      graph(`${igId}/insights`, {
        metric: 'follower_demographics',
        period: 'lifetime',
        metric_type: 'total_value',
        breakdown,
      }),
    );
  }

  // Recent media + per-post insights
  const mediaList = await graph(`${igId}/media`, {
    fields: 'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count',
    limit: MEDIA_LIMIT,
  });
  const media = [];
  for (const m of mediaList.data || []) {
    // Reels vs feed expose slightly different metrics; ask for the common set.
    const metric =
      m.media_product_type === 'REELS'
        ? 'reach,likes,comments,saved,shares,views,total_interactions'
        : 'reach,likes,comments,saved,shares,total_interactions';
    const insights = await safe(() => graph(`${m.id}/insights`, { metric }));
    media.push({ ...m, insights: flattenInsights(insights) });
  }

  const report = {
    fetchedAt: new Date().toISOString(),
    graphVersion: VERSION,
    igUserId: igId,
    profile,
    accountInsights: flattenInsights(daily),
    followerTrend: flattenInsights(followerTrend),
    demographics: Object.fromEntries(
      Object.entries(demographics).map(([k, v]) => [k, flattenInsights(v)]),
    ),
    media,
  };

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir = join(__dirname, 'out');
  await mkdir(outDir, { recursive: true });
  const stamp = report.fetchedAt.replace(/[:.]/g, '-');
  const outFile = join(outDir, `insights-${stamp}.json`);
  await writeFile(outFile, JSON.stringify(report, null, 2));

  console.log(`@${profile.username}: ${profile.followers_count} followers, ${profile.media_count} posts`);
  console.log(`Wrote ${media.length} media + account insights → ${outFile}`);
}

/** Run an API call, returning {error} instead of throwing so one bad metric
 *  doesn't abort the whole extraction. */
async function safe(fn) {
  try {
    return await fn();
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

/** Collapse Graph insight payloads to a flat { metricName: value } map. */
function flattenInsights(payload) {
  if (!payload || payload.error) return payload || null;
  const out = {};
  for (const item of payload.data || []) {
    const tv = item.total_value?.value;
    const breakdowns = item.total_value?.breakdowns;
    if (breakdowns) {
      out[item.name] = breakdowns.flatMap((b) => b.results).reduce((acc, r) => {
        acc[r.dimension_values.join('/')] = r.value;
        return acc;
      }, {});
    } else if (tv !== undefined) {
      out[item.name] = tv;
    } else if (Array.isArray(item.values)) {
      out[item.name] = item.values.map((v) => ({ value: v.value, end_time: v.end_time }));
    }
  }
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
