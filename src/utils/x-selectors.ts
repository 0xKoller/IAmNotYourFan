// Robust selectors for X/Twitter "Following" page (2025-2026)
// Based on the two best working public implementations:
// - Shayanthn/Twitter-X-Mass-Unfollow (Dec 2025)
// - luqmanoop/twitter-mass-unfollow (May 2025)
//
// Strategy: multiple layered fallbacks because X changes data-testid frequently.

import type { CurrentAccount, XUser } from '../model/user';

const MUTUAL_TEXT_EN = 'follows you';
const MUTUAL_TEXT_FA = 'شما را دنبال می‌کند';

export function isOnFollowingPage(): boolean {
  try {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith('/following') || path.includes('/following');
  } catch {
    return false;
  }
}

export function getCurrentAccount(): CurrentAccount | undefined {
  const username = extractCurrentUsernameFromPath();
  if (!username) return undefined;

  const accountSwitcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
  const profileHeader = document.querySelector('[data-testid="UserName"]');
  const source = accountSwitcher || profileHeader || document;

  return {
    username,
    displayName: extractCurrentDisplayName(source, username),
    avatarUrl: extractCurrentAvatar(source, username),
    profileUrl: `https://x.com/${username}`,
  };
}

function extractCurrentUsernameFromPath(): string | undefined {
  try {
    const [username, section] = window.location.pathname.split('/').filter(Boolean);
    if (!username || section?.toLowerCase() !== 'following') return undefined;
    return username.toLowerCase();
  } catch {
    return undefined;
  }
}

function extractCurrentDisplayName(source: Element | Document, username: string): string | undefined {
  if (source === document) return undefined;

  const textNodes = Array.from(source.querySelectorAll('div[dir="auto"] span, span'));
  const displayName = textNodes
    .map(el => el.textContent?.trim() || '')
    .find(text => text && text !== `@${username}` && !text.startsWith('@'));

  return displayName || undefined;
}

function extractCurrentAvatar(source: Element | Document, username: string): string | undefined {
  if (source === document) return undefined;

  const images = Array.from(source.querySelectorAll('img[src*="profile_images"]')) as HTMLImageElement[];
  const accountImage = images.find(img => {
    const alt = (img.alt || '').toLowerCase();
    return alt.includes(username) || alt.includes('profile') || source !== document;
  });

  return accountImage?.src || images[0]?.src;
}

export function getUserCells(): Element[] {
  // Scope to the main timeline so we never pick up the right-hand
  // "Who to follow" sidebar suggestions, which use the same UserCell markup.
  const root =
    document.querySelector('[data-testid="primaryColumn"]') || document;

  // Primary (most reliable in late 2025)
  let cells = Array.from(root.querySelectorAll('[data-testid="UserCell"]'));

  if (cells.length === 0) {
    // Fallback used by many scripts
    cells = Array.from(root.querySelectorAll('[data-testid="cellInnerDiv"]'));
  }

  return cells.filter(cell => {
    // Must look like a real profile row (ads etc. have no profile link).
    const hasProfileLink = cell.querySelector('a[href^="/"][role="link"]');
    if (!hasProfileLink) return false;

    // Exclude anything inside a recommendation module ("Who to follow",
    // "You might like", "Relevant people") even if it leaks into the
    // primary column on some layouts.
    if (isInSuggestionModule(cell)) return false;

    return true;
  });
}

const SUGGESTION_LABELS = ['who to follow', 'you might like', 'relevant people'];

function isInSuggestionModule(cell: Element): boolean {
  // Right-hand column is always suggestions/trends, never the following list.
  if (cell.closest('[data-testid="sidebarColumn"]')) return true;

  // On the Following page the "Who to follow" carousel is injected inline in
  // the primary column. It lives in a labelled <section>/[role="region"].
  const section = cell.closest('section, aside, [role="region"]');
  if (!section) return false;

  let label = (section.getAttribute('aria-label') || '').toLowerCase();

  // X labels the section via aria-labelledby -> heading element.
  if (!label) {
    const labelledBy = section.getAttribute('aria-labelledby');
    if (labelledBy) {
      label = labelledBy
        .split(/\s+/)
        .map(id => document.getElementById(id)?.textContent || '')
        .join(' ')
        .toLowerCase();
    }
  }

  // Fallback: read the section's own heading text.
  if (!label) {
    label = (section.querySelector('h1, h2, [role="heading"]')?.textContent || '').toLowerCase();
  }

  return SUGGESTION_LABELS.some(l => label.includes(l));
}

/**
 * Extract a clean XUser from a UserCell element.
 * Very defensive — returns null if we can't get at least username.
 */
export function parseUserFromCell(cell: Element): XUser | null {
  try {
    const username = extractUsername(cell);
    if (!username || username === 'unknown') return null;

    const displayName = extractDisplayName(cell);
    const avatarUrl = extractAvatar(cell);
    const isMutual = detectMutual(cell);
    const isVerified = detectVerified(cell);
    const profileUrl = `https://x.com/${username}`;

    return {
      username,
      displayName,
      avatarUrl,
      profileUrl,
      isMutual,
      isVerified,
      rawCellHtml: cell.outerHTML.substring(0, 800), // debug only
    };
  } catch (e) {
    console.warn('[IAmNotYourFan] Failed to parse cell', e);
    return null;
  }
}

function extractUsername(cell: Element): string {
  // Best signal: the main profile link
  const link = cell.querySelector(
    'a[href^="/"][role="link"]:not([href*="status"]):not([href*="intent"])'
  ) as HTMLAnchorElement | null;

  if (link?.getAttribute('href')) {
    const href = link.getAttribute('href')!;
    const parts = href.split('/').filter(Boolean);
    if (parts.length > 0) return parts[0].toLowerCase();
  }

  // Fallback: aria-label on buttons sometimes contains @username
  const buttons = cell.querySelectorAll('button[aria-label], div[role="button"][aria-label]');
  for (const btn of buttons) {
    const label = btn.getAttribute('aria-label') || '';
    const match = label.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1].toLowerCase();
  }

  return 'unknown';
}

function extractDisplayName(cell: Element): string {
  // Usually the first prominent text before the @handle
  const nameEl = cell.querySelector('div[dir="auto"] span, a[role="link"] span');
  if (nameEl?.textContent) {
    return nameEl.textContent.trim();
  }
  return '';
}

function extractAvatar(cell: Element): string | undefined {
  const img = cell.querySelector('img[src*="profile_images"]') as HTMLImageElement | null;
  return img?.src;
}

function detectMutual(cell: Element): boolean {
  const text = (cell.textContent || '').toLowerCase();

  // Gold standard structural signal (luqmanoop 2025)
  if (cell.querySelector('[data-testid="userFollowIndicator"]')) {
    return true;
  }

  // Text fallbacks (Shayanthn)
  if (text.includes(MUTUAL_TEXT_EN) || text.includes(MUTUAL_TEXT_FA)) {
    return true;
  }

  return false;
}

function detectVerified(cell: Element): boolean {
  // Common patterns for verified badge
  return !!cell.querySelector(
    '[data-testid*="verified"], svg[aria-label*="Verified"], [aria-label*="verified"]'
  );
}

/**
 * Collect all currently visible users on the page.
 */
export function collectVisibleUsers(): XUser[] {
  const cells = getUserCells();
  const users: XUser[] = [];

  for (const cell of cells) {
    const user = parseUserFromCell(cell);
    if (user) users.push(user);
  }

  return users;
}

// Expose for easy console testing on real profile
if (typeof window !== 'undefined') {
  (window as any).Iamnotyourfan = {
    ...(window as any).Iamnotyourfan,
    collectVisibleUsers,
    getUserCells,
    isOnFollowingPage,
  };
}
