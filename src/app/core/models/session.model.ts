export interface ActiveSession {
  tokenId: string;
  refreshToken: string;
  browser: string;
  os: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  ipAddress: string;
  browser: string;
  os: string;
  successful: boolean;
  failureReason: string | null;
  loginAt: string;
}
