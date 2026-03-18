// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  enabled: boolean;
  accountNonLocked: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[];
  enabled?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  username?: string;
}

export interface AssignRolesRequest {
  roles: string[];
}
