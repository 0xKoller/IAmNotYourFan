// X/Twitter specific user shape for Iamnotyourfan

export type XUser = {
  username: string;           // @handle without @
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;         // https://x.com/username
  isMutual: boolean;          // follows you back
  isVerified?: boolean;
  activityStatus?: 'active' | 'inactive' | 'unknown';
  lastActivityAt?: string;    // ISO date from the latest non-pinned post/repost we can trust
  activityCheckedAt?: string; // ISO timestamp for local resume/freshness checks
  activityReason?: string;
  rawCellHtml?: string;       // for debugging when selectors break
};

export type CurrentAccount = {
  username: string;           // @handle without @
  displayName?: string;
  avatarUrl?: string;
  profileUrl: string;         // https://x.com/username
};
