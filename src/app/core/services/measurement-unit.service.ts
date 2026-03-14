import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Page, PageRequest } from '../models/pagination.model';
import {
  MeasurementUnitResponse,
  CreateMeasurementUnitRequest,
  UpdateMeasurementUnitRequest
} from '../models/measurement-unit.model';

@Injectable({ providedIn: 'root' })
export class MeasurementUnitService {
  private readonly API = environment.apiUrl + '/measurementUnit';
  private http = inject(HttpClient);

  getAll(params: PageRequest): Observable<ApiResponse<Page<MeasurementUnitResponse>>> {
    return this.http.get<ApiResponse<Page<MeasurementUnitResponse>>>(this.API, {
      params: {
        page: params.page.toString(),
        size: params.size.toString(),
        ...(params.sort ? { sort: params.sort } : {})
      }
    });
  }

  create(request: CreateMeasurementUnitRequest): Observable<ApiResponse<MeasurementUnitResponse>> {
    return this.http.post<ApiResponse<MeasurementUnitResponse>>(this.API, request);
  }

  update(request: UpdateMeasurementUnitRequest): Observable<ApiResponse<MeasurementUnitResponse>> {
    return this.http.put<ApiResponse<MeasurementUnitResponse>>(this.API, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
