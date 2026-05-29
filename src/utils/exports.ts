// Export utilities for Iamnotyourfan

import type { XUser } from '../model/user';

export function copyHandlesToClipboard(users: XUser[]) {
  const text = users.map(u => `@${u.username}`).join('\n');
  return navigator.clipboard.writeText(text);
}

export function exportToJSON(users: XUser[], filename = 'iamnotyourfan-nonfollowers.json') {
  const data = JSON.stringify(users, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(users: XUser[], filename = 'iamnotyourfan-nonfollowers.csv') {
  const headers = [
    'username',
    'displayName',
    'profileUrl',
    'isMutual',
    'isVerified',
    'activityStatus',
    'lastActivityAt',
    'activityCheckedAt',
  ];
  const rows = users.map(u => [
    u.username,
    u.displayName || '',
    u.profileUrl,
    u.isMutual ? 'yes' : 'no',
    u.isVerified ? 'yes' : 'no',
    u.activityStatus || '',
    u.lastActivityAt || '',
    u.activityCheckedAt || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
