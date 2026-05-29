import type { ActivityResult } from './activity-scan';

type OperationIds = {
  userByScreenName?: string;
  userTweets?: string;
  bearerToken?: string;
};

type CapturedAuthHeaders = {
  authorization?: string;
  xCsrfToken?: string;
  xTwitterAuthType?: string;
  xTwitterActiveUser?: string;
  xTwitterClientLanguage?: string;
};

type TimelineItem = {
  createdAt?: string;
  isRepost?: boolean;
  isPinned?: boolean;
  tweetId?: string;
};

export type XUnfollowResult = {
  ok: boolean;
  status?: number;
  hardThrottle?: boolean;
  error?: string;
};

const FALLBACK_WEB_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCO9T0qGgS8xo7g7dTs%3D9hWQJPdG7wWJFzPj4nJYq0CdnIo0E4bJk4lZ8CqK6GZf8V8w';
const OPERATION_STORAGE_KEY = 'iamnotyourfan.xGraphqlOperations.v1';
const SCRIPT_URL_STORAGE_KEY = 'iamnotyourfan.xScriptUrls.v1';
const AUTH_HEADERS_STORAGE_KEY = 'iamnotyourfan.xAuthHeaders.v1';
let isRecorderInstalled = false;

const FEATURES: Record<string, boolean | string> = {
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  responsive_web_jetfuel_frame: false,
  responsive_web_grok_share_attachment_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analysis_button_from_backend: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

const FIELD_TOGGLES = {
  withArticlePlainText: false,
};

export function snapshotXScriptUrls() {
  const urls = getCurrentXScriptUrls();
  if (urls.length > 0) {
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, JSON.stringify(urls));
  }
  debug('scripts:snapshot', { count: urls.length, first: urls[0] });
}

export function installXApiRequestRecorder() {
  if (isRecorderInstalled) return;
  isRecorderInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    captureFetchAuth(input, init);
    return originalFetch(input, init);
  }) as typeof window.fetch;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
    (this as any).__iamnotyourfanUrl = String(url);
    (this as any).__iamnotyourfanHeaders = {};
    return originalOpen.call(this, method, url, async ?? true, username ?? undefined, password ?? undefined);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name: string, value: string) {
    const headers = ((this as any).__iamnotyourfanHeaders ||= {}) as Record<string, string>;
    headers[name.toLowerCase()] = value;
    return originalSetRequestHeader.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    captureHeadersFromUrl((this as any).__iamnotyourfanUrl, (this as any).__iamnotyourfanHeaders || {});
    return originalSend.call(this, body);
  };

  debug('auth-recorder:installed');
}

export async function checkActivityViaXApi(username: string, inactivityMonths: number): Promise<ActivityResult | null> {
  if (!isOnXOrigin()) {
    debug('skip:not-x-origin', { username, hostname: location.hostname });
    return null;
  }

  const operations = await discoverOperationIds();
  debug('operations', operations);
  if (!operations.userByScreenName || !operations.userTweets) {
    debug('skip:missing-operations', { username, operations });
    return null;
  }

  const bearerToken = operations.bearerToken || FALLBACK_WEB_BEARER_TOKEN;
  const userId = await fetchUserId(username, operations.userByScreenName, bearerToken);
  debug('user-lookup', { username, userId });
  if (!userId) return unknownResult(username, 'X API could not resolve this username');

  const timelineItems = await fetchLatestTimelineItems(userId, operations.userTweets, bearerToken);
  debug('timeline-items', { username, userId, count: timelineItems?.length, first: timelineItems?.[0] });
  if (!timelineItems) return null;

  const latest = timelineItems.find(item => !item.isPinned);
  if (!latest?.createdAt) return unknownResult(username, 'X API returned no recent post/repost activity');

  const date = new Date(latest.createdAt);
  if (Number.isNaN(date.getTime())) return unknownResult(username, 'X API returned an unreadable activity date');

  if (latest.isRepost && isOlderThanMonths(date, inactivityMonths)) {
    return unknownResult(username, 'Latest API item is an old repost with ambiguous repost date');
  }

  return {
    username,
    activityStatus: isOlderThanMonths(date, inactivityMonths) ? 'inactive' : 'active',
    inactivityMonths,
    lastActivityAt: date.toISOString(),
    activityCheckedAt: new Date().toISOString(),
    activityReason: `${latest.isRepost ? 'Latest API activity is a repost' : 'Latest API activity is a post'}; inactive after ${inactivityMonths} months`,
  };
}

export async function unfollowUserViaXApi(username: string): Promise<XUnfollowResult> {
  if (!isOnXOrigin()) {
    return { ok: false, error: 'Unfollow only works when running on x.com or twitter.com.' };
  }

  const operations = await discoverOperationIds();
  if (!operations.userByScreenName) {
    return { ok: false, error: 'Could not find X user lookup operation. Refresh X and try again.' };
  }

  const bearerToken = operations.bearerToken || FALLBACK_WEB_BEARER_TOKEN;
  const userId = await fetchUserId(username, operations.userByScreenName, bearerToken);
  if (!userId) {
    return { ok: false, error: 'X could not resolve this username.' };
  }

  const captured = readCapturedAuthHeaders();
  const authorization = captured.authorization || `Bearer ${bearerToken}`;
  const csrfToken = captured.xCsrfToken || getCookie('ct0');
  const body = new URLSearchParams({ user_id: userId });

  try {
    const response = await fetch(new URL('/i/api/1.1/friendships/destroy.json', location.origin).toString(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        authorization,
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrf-token': csrfToken,
        'x-twitter-active-user': captured.xTwitterActiveUser || 'yes',
        'x-twitter-auth-type': captured.xTwitterAuthType || 'OAuth2Session',
        'x-twitter-client-language': captured.xTwitterClientLanguage || 'en',
      },
      body,
    });

    if (response.ok) return { ok: true, status: response.status };

    const text = await response.text().catch(() => '');
    return {
      ok: false,
      status: response.status,
      hardThrottle: response.status === 403 || response.status === 429,
      error: text.slice(0, 220) || `X returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error while unfollowing.',
    };
  }
}

async function fetchUserId(username: string, queryId: string, bearerToken: string): Promise<string | null> {
  const data = await graphQL(queryId, 'UserByScreenName', {
    screen_name: username,
    withSafetyModeUserFields: true,
  }, false, bearerToken);
  return data?.data?.user?.result?.rest_id || null;
}

async function fetchLatestTimelineItems(userId: string, queryId: string, bearerToken: string): Promise<TimelineItem[] | null> {
  const data = await graphQL(queryId, 'UserTweets', {
    userId,
    count: 8,
    includePromotedContent: false,
    withQuickPromoteEligibilityTweetFields: false,
    withVoice: false,
    withV2Timeline: true,
  }, true, bearerToken);

  if (!data) return null;
  return extractTimelineItems(data);
}

async function graphQL(queryId: string, operationName: string, variables: Record<string, unknown>, includeFieldToggles: boolean, bearerToken: string) {
  const url = new URL(`/i/api/graphql/${queryId}/${operationName}`, location.origin);
  url.searchParams.set('variables', JSON.stringify(variables));
  url.searchParams.set('features', JSON.stringify(FEATURES));
  if (includeFieldToggles) {
    url.searchParams.set('fieldToggles', JSON.stringify(FIELD_TOGGLES));
  }

  const captured = readCapturedAuthHeaders();
  const authorization = captured.authorization || `Bearer ${bearerToken}`;
  const csrfToken = captured.xCsrfToken || getCookie('ct0');

  debug('request', {
    operationName,
    queryId,
    variables,
    includeFieldToggles,
    hasCt0: Boolean(csrfToken),
    hasCapturedAuth: Boolean(captured.authorization),
    bearerPrefix: authorization.slice(0, 25),
  });

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: {
      authorization,
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
      'x-twitter-active-user': captured.xTwitterActiveUser || 'yes',
      'x-twitter-auth-type': captured.xTwitterAuthType || 'OAuth2Session',
      'x-twitter-client-language': captured.xTwitterClientLanguage || 'en',
    },
  });

  debug('response', { operationName, status: response.status, ok: response.ok });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    debug('response-error-body', { operationName, body: body.slice(0, 500) });
    return null;
  }

  const data = await response.json();
  const errors = Array.isArray(data?.errors) ? data.errors : undefined;
  if (errors?.length) {
    debug('graphql-errors', { operationName, errors: errors.slice(0, 3) });
  }
  return data;
}

async function discoverOperationIds(): Promise<OperationIds> {
  const cached = readCachedOperations();
  if (cached.userByScreenName && cached.userTweets && cached.bearerToken) {
    debug('operations:cached', cached);
    return cached;
  }

  const operations: OperationIds = { ...cached };
  const documentScripts = Array.from(document.scripts).map(script => script.src).filter(Boolean);
  const performanceScripts = getPerformanceScriptUrls();
  const snapshotScripts = readScriptUrlSnapshot();
  const scripts = Array.from(new Set([...documentScripts, ...performanceScripts, ...snapshotScripts]))
    .filter(src => src && (src.includes('abs.twimg.com') || src.includes('x.com')))
    .slice(-120);

  debug('operations:discover-start', {
    documentScripts: documentScripts.length,
    performanceScripts: performanceScripts.length,
    snapshotScripts: snapshotScripts.length,
    scannedScripts: scripts.length,
    firstScript: scripts[0],
  });

  for (const src of scripts) {
    if (operations.userByScreenName && operations.userTweets) break;
    try {
      const text = await fetch(src).then(response => response.ok ? response.text() : '');
      const userByScreenName = findQueryId(text, 'UserByScreenName');
      const userTweets = findQueryId(text, 'UserTweets');
      const bearerToken = findBearerToken(text);
      if (userByScreenName || userTweets || bearerToken) {
        debug('operations:found-in-script', {
          script: src.slice(0, 140),
          userByScreenName,
          userTweets,
          bearerPrefix: bearerToken?.slice(0, 18),
        });
      }
      operations.userByScreenName ||= userByScreenName;
      operations.userTweets ||= userTweets;
      operations.bearerToken ||= bearerToken;
    } catch {
      // Ignore chunks that are not CORS-readable; enough of X's chunks usually are.
    }
  }

  debug('operations:discover-finish', operations);

  if (operations.userByScreenName || operations.userTweets) {
    localStorage.setItem(OPERATION_STORAGE_KEY, JSON.stringify(operations));
  }

  return operations;
}

function findQueryId(text: string, operationName: string) {
  const escaped = operationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`queryId:"([A-Za-z0-9_-]+)"[^{}]{0,220}operationName:"${escaped}"`),
    new RegExp(`operationName:"${escaped}"[^{}]{0,220}queryId:"([A-Za-z0-9_-]+)"`),
    new RegExp(`operationName:'${escaped}'[^{}]{0,220}queryId:'([A-Za-z0-9_-]+)'`),
    new RegExp(`queryId:'([A-Za-z0-9_-]+)'[^{}]{0,220}operationName:'${escaped}'`),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function findBearerToken(text: string) {
  const patterns = [
    /Bearer ([A-Za-z0-9%_-]{80,220})/,
    /bearer_token["']?\s*[:=]\s*["']([A-Za-z0-9%_-]{80,220})["']/i,
    /authorization["']?\s*[:=]\s*["']Bearer ([A-Za-z0-9%_-]{80,220})["']/i,
    /AAAAAAAAAAAAAAAAAAAAA[A-Za-z0-9%_-]{60,200}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const token = match?.[1] || match?.[0];
    if (token?.startsWith('AAAAAAAA')) return token;
  }
  return undefined;
}

function extractTimelineItems(data: any): TimelineItem[] {
  const entries = collectObjects(data)
    .filter(value => typeof value?.entryId === 'string' && value.entryId.includes('tweet-'));

  debug('timeline-extract', { entryCount: entries.length });

  return entries
    .map((entry): TimelineItem | null => {
      const tweet = findTweetResult(entry);
      const legacy = tweet?.legacy;
      const createdAt = legacy?.created_at;
      const isRepost = Boolean(legacy?.retweeted_status_result || tweet?.retweeted_status_result);
      const tweetId = typeof tweet?.rest_id === 'string' ? tweet.rest_id : undefined;
      const isPinned = isPinnedTimelineEntry(entry);
      if (isPinned) {
        debug('timeline-skip-pinned', { tweetId, createdAt });
      }
      return typeof createdAt === 'string' ? { createdAt, isRepost, isPinned, tweetId } : null;
    })
    .filter((item): item is TimelineItem => Boolean(item));
}

function findTweetResult(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if (value.__typename === 'Tweet' && value.legacy) return value;
  if (value.tweet_results?.result) return findTweetResult(value.tweet_results.result);
  if (value.itemContent?.tweet_results?.result) return findTweetResult(value.itemContent.tweet_results.result);
  if (value.content?.itemContent?.tweet_results?.result) return findTweetResult(value.content.itemContent.tweet_results.result);
  if (value.tweet?.legacy) return value.tweet;
  return null;
}

function collectObjects(value: any, objects: any[] = []): any[] {
  if (!value || typeof value !== 'object') return objects;
  objects.push(value);
  if (Array.isArray(value)) {
    value.forEach(item => collectObjects(item, objects));
    return objects;
  }
  Object.values(value).forEach(item => collectObjects(item, objects));
  return objects;
}

function isPinnedTimelineEntry(entry: any) {
  if (typeof entry?.entryId === 'string' && entry.entryId.toLowerCase().includes('pinned')) return true;
  return collectObjects(entry).some(value => {
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some(item =>
      typeof item === 'string' && item.toLowerCase().includes('pinned')
    );
  });
}

function readCachedOperations(): OperationIds {
  try {
    return JSON.parse(localStorage.getItem(OPERATION_STORAGE_KEY) || '{}') as OperationIds;
  } catch {
    return {};
  }
}

function getCurrentXScriptUrls() {
  return Array.from(new Set([
    ...Array.from(document.scripts).map(script => script.src).filter(Boolean),
    ...getPerformanceScriptUrls(),
  ]))
    .filter(src => src.includes('.js'))
    .filter(src => src.includes('abs.twimg.com') || src.includes('x.com'));
}

function captureFetchAuth(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  captureHeadersFromUrl(url, Object.fromEntries(headers.entries()));
}

function captureHeadersFromUrl(url: string | undefined, headers: Record<string, string>) {
  if (!url || !url.includes('/i/api/')) return;

  const authorization = getHeader(headers, 'authorization');
  const xCsrfToken = getHeader(headers, 'x-csrf-token');
  if (!authorization && !xCsrfToken) return;

  const captured: CapturedAuthHeaders = {
    ...readCapturedAuthHeaders(),
    authorization: authorization || readCapturedAuthHeaders().authorization,
    xCsrfToken: xCsrfToken || readCapturedAuthHeaders().xCsrfToken,
    xTwitterAuthType: getHeader(headers, 'x-twitter-auth-type') || readCapturedAuthHeaders().xTwitterAuthType,
    xTwitterActiveUser: getHeader(headers, 'x-twitter-active-user') || readCapturedAuthHeaders().xTwitterActiveUser,
    xTwitterClientLanguage: getHeader(headers, 'x-twitter-client-language') || readCapturedAuthHeaders().xTwitterClientLanguage,
  };

  localStorage.setItem(AUTH_HEADERS_STORAGE_KEY, JSON.stringify(captured));
  debug('auth-recorder:captured', {
    url: url.slice(0, 120),
    hasAuthorization: Boolean(captured.authorization),
    hasCsrf: Boolean(captured.xCsrfToken),
    authPrefix: captured.authorization?.slice(0, 25),
  });
}

function getHeader(headers: Record<string, string>, name: string) {
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
}

function readCapturedAuthHeaders(): CapturedAuthHeaders {
  try {
    return JSON.parse(localStorage.getItem(AUTH_HEADERS_STORAGE_KEY) || '{}') as CapturedAuthHeaders;
  } catch {
    return {};
  }
}

function getPerformanceScriptUrls() {
  try {
    return performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(src => src.includes('.js'));
  } catch {
    return [];
  }
}

function readScriptUrlSnapshot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SCRIPT_URL_STORAGE_KEY) || '[]') as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function isOnXOrigin() {
  return location.hostname.includes('x.com') || location.hostname.includes('twitter.com');
}

function isOlderThanMonths(date: Date, months: number) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return date.getTime() < cutoff.getTime();
}

function unknownResult(username: string, activityReason: string): ActivityResult {
  debug('unknown-result', { username, activityReason });
  return {
    username,
    activityStatus: 'unknown',
    activityCheckedAt: new Date().toISOString(),
    activityReason,
  };
}

function debug(_message: string, _details?: unknown) {
  // Intentionally silent in the pasteable console script.
}
