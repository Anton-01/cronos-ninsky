import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Page, PageRequest } from '../models/pagination.model';
import {
  RawMaterialResponse,
  CreateRawMaterialRequest,
  UpdateRawMaterialRequest
} from '../models/raw-material.model';

@Injectable({ providedIn: 'root' })
export class RawMaterialService {
  private readonly API = environment.apiUrl + '/rawMaterial';
  private http = inject(HttpClient);

  getAll(params: PageRequest): Observable<ApiResponse<Page<RawMaterialResponse>>> {
    return this.http.get<ApiResponse<Page<RawMaterialResponse>>>(this.API, {
      params: {
        page: params.page.toString(),
        size: params.size.toString(),
        ...(params.sort ? { sort: params.sort } : {})
      }
    });
  }

  getById(id: string): Observable<ApiResponse<RawMaterialResponse>> {
    return this.http.get<ApiResponse<RawMaterialResponse>>(`${this.API}/${id}`);
  }

  create(request: CreateRawMaterialRequest): Observable<ApiResponse<RawMaterialResponse>> {
    return this.http.post<ApiResponse<RawMaterialResponse>>(this.API, request);
  }

  update(request: UpdateRawMaterialRequest): Observable<ApiResponse<RawMaterialResponse>> {
    return this.http.put<ApiResponse<RawMaterialResponse>>(this.API, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
