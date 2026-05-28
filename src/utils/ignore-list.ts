// Ignore list persistence (like InstagramUnfollowers whitelist)

import type { XUser } from '../model/user';

const STORAGE_KEY = 'iamnotyourfan_ignore_list_v1';

export function loadIgnoreList(): XUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (u): u is XUser =>
          typeof u?.username === 'string' && typeof u?.profileUrl === 'string'
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function saveIgnoreList(list: XUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function toggleUserInIgnoreList(currentList: XUser[], user: XUser): XUser[] {
  const exists = currentList.some(u => u.username === user.username);
  if (exists) {
    return currentList.filter(u => u.username !== user.username);
  } else {
    return [...currentList, user];
  }
}
