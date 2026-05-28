// X/Twitter specific user shape for Iamnotyourfan

export type XUser = {
  username: string;           // @handle without @
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;         // https://x.com/username
  isMutual: boolean;          // follows you back
  isVerified?: boolean;
  rawCellHtml?: string;       // for debugging when selectors break
};
