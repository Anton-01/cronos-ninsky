import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl + '/auth';
  private http = inject(HttpClient);

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, request);
  }

  register(request: RegisterRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.API}/register`, request);
  }

  logout(refreshToken: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/logout`, { refreshToken });
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
