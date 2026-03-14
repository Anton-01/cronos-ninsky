import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Page, PageRequest } from '../models/pagination.model';
import { UnitTypeResponse, CreateUnitTypeRequest, UpdateUnitTypeRequest } from '../models/unit-type.model';

@Injectable({ providedIn: 'root' })
export class UnitTypeService {
  private readonly API = environment.apiUrl + '/unitType';
  private http = inject(HttpClient);

  getAll(params: PageRequest): Observable<ApiResponse<Page<UnitTypeResponse>>> {
    return this.http.get<ApiResponse<Page<UnitTypeResponse>>>(this.API, {
      params: {
        page: params.page.toString(),
        size: params.size.toString(),
        ...(params.sort ? { sort: params.sort } : {})
      }
    });
  }

  create(request: CreateUnitTypeRequest): Observable<ApiResponse<UnitTypeResponse>> {
    return this.http.post<ApiResponse<UnitTypeResponse>>(this.API, request);
  }

  update(request: UpdateUnitTypeRequest): Observable<ApiResponse<UnitTypeResponse>> {
    return this.http.put<ApiResponse<UnitTypeResponse>>(this.API, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
