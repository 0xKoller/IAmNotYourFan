// Robust selectors for X/Twitter "Following" page (2025-2026)
// Based on the two best working public implementations:
// - Shayanthn/Twitter-X-Mass-Unfollow (Dec 2025)
// - luqmanoop/twitter-mass-unfollow (May 2025)
//
// Strategy: multiple layered fallbacks because X changes data-testid frequently.

import type { XUser } from '../model/user';

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

export function getUserCells(): Element[] {
  // Primary (most reliable in late 2025)
  let cells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));

  if (cells.length === 0) {
    // Fallback used by many scripts
    cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]'));
  }

  // Filter out obvious non-profile elements (ads, etc.)
  return cells.filter(cell => {
    const hasProfileLink = cell.querySelector('a[href^="/"][role="link"]');
    return !!hasProfileLink;
  });
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
