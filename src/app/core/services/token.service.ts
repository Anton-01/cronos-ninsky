import { Injectable } from '@angular/core';
import { JwtPayload } from '../models/auth.model';

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_NAME_KEY     = 'user_name';
const USER_EMAIL_KEY    = 'user_email';

@Injectable({ providedIn: 'root' })
export class TokenService {

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  saveUserInfo(username: string, email: string): void {
    localStorage.setItem(USER_NAME_KEY, username);
    localStorage.setItem(USER_EMAIL_KEY, email);
  }

  getUsername(): string {
    return localStorage.getItem(USER_NAME_KEY) ?? '';
  }

  getEmail(): string {
    return localStorage.getItem(USER_EMAIL_KEY) ?? '';
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  }

  parseJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return this.parseJwt(token)?.sub ?? null;
  }

  getRoles(): string[] {
    const token = this.getAccessToken();
    if (!token) return [];
    return this.parseJwt(token)?.roles ?? [];
  }

  getExpirationDate(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.parseJwt(token);
    if (!payload) return null;
    return new Date(payload.exp * 1000);
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    const payload = this.parseJwt(token);
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  hasRole(role: string): boolean {
    const roles = this.getRoles();
    // Support both Spring's "ROLE_ADMIN" convention and plain "ADMIN"
    return roles.includes(role) || roles.includes(`ROLE_${role}`);
  }

  /**
   * Returns the primary role as a display-friendly label.
   * Priority: ADMIN > USER > first available > 'USER'
   */
  getPrimaryRole(): string {
    const roles = this.getRoles().map(r => r.replace(/^ROLE_/, ''));
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('USER'))  return 'USER';
    return roles[0] ?? 'USER';
  }
}
