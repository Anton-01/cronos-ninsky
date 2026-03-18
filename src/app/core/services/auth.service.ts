import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
  VerifyTwoFactorRequest
} from '../models/auth.model';
import { UserResponse } from '../models/user.model';
import { ActiveSession, LoginHistoryEntry } from '../models/session.model';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl + '/auth';
  private http         = inject(HttpClient);
  private router       = inject(Router);
  private tokenService = inject(TokenService);

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, request);
  }

  register(request: RegisterRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.API}/register`, request);
  }

  logout(refreshToken: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/logout`, { refreshToken });
  }

  /**
   * Full logout flow:
   * 1. POSTs the refresh token to the backend so the server invalidates the session.
   * 2. Uses `finalize` so that, whether the request succeeds (200) or fails
   *    (401/400 – token already expired), the frontend always clears storage
   *    and redirects to /auth/login.
   */
  performLogout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.clearAndRedirect();
      return;
    }

    this.http
      .post<ApiResponse<void>>(`${this.API}/logout`, { refreshToken })
      .pipe(finalize(() => this.clearAndRedirect()))
      .subscribe();
  }

  private clearAndRedirect(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  setup2FA(): Observable<ApiResponse<TwoFactorSetupResponse>> {
    return this.http.post<ApiResponse<TwoFactorSetupResponse>>(`${this.API}/2fa/setup`, {});
  }

  verify2FA(request: VerifyTwoFactorRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/2fa/verify`, request);
  }

  disable2FA(request: VerifyTwoFactorRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/2fa/disable`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/change-password`, request);
  }

  getActiveSessions(): Observable<ApiResponse<ActiveSession[]>> {
    return this.http.get<ApiResponse<ActiveSession[]>>(`${this.API}/sessions`);
  }

  revokeSession(refreshToken: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/logout`, { refreshToken });
  }

  getLoginHistory(): Observable<ApiResponse<LoginHistoryEntry[]>> {
    return this.http.get<ApiResponse<LoginHistoryEntry[]>>(`${this.API}/login-history`);
  }
}
