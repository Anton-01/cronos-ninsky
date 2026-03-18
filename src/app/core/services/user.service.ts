import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Page, PageRequest } from '../models/pagination.model';
import { UserResponse, CreateUserRequest, UpdateUserRequest, UpdateProfileRequest, AssignRolesRequest } from '../models/user.model';

export interface UserFilterRequest extends PageRequest {
  role?: string;
  enabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = environment.apiUrl;
  private http = inject(HttpClient);

  // ── Current user profile ─────────────────────────────────────────────────

  getProfile(): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.API}/users/me`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.API}/users/me`, request);
  }

  // ── Admin: user management ────────────────────────────────────────────────

  getAllUsers(params: UserFilterRequest): Observable<ApiResponse<Page<UserResponse>>> {
    const queryParams: Record<string, string> = {
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.sort ? { sort: params.sort } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.enabled !== undefined ? { enabled: params.enabled.toString() } : {})
    };
    return this.http.get<ApiResponse<Page<UserResponse>>>(`${this.API}/admin/users`, { params: queryParams });
  }

  getUserById(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}`);
  }

  createUser(request: CreateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.API}/admin/users`, request);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}`, request);
  }

  blockUser(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}/block`, {});
  }

  unblockUser(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}/unblock`, {});
  }

  assignRoles(id: string, request: AssignRolesRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}/roles`, request);
  }
}
