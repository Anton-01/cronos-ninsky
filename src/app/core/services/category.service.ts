import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Page, PageRequest } from '../models/pagination.model';
import { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../models/category.model';
import { CsvImportResponse } from '../models/csv-import.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly API = environment.apiUrl + '/category';
  private http = inject(HttpClient);

  getAll(params: PageRequest): Observable<ApiResponse<Page<CategoryResponse>>> {
    return this.http.get<ApiResponse<Page<CategoryResponse>>>(this.API, {
      params: {
        page: params.page.toString(),
        size: params.size.toString(),
        ...(params.sort ? { sort: params.sort } : {})
      }
    });
  }

  getSystem(params: PageRequest): Observable<ApiResponse<Page<CategoryResponse>>> {
    return this.http.get<ApiResponse<Page<CategoryResponse>>>(`${this.API}/system`, {
      params: {
        page: params.page.toString(),
        size: params.size.toString(),
        ...(params.sort ? { sort: params.sort } : {})
      }
    });
  }

  create(request: CreateCategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.API, request);
  }

  update(request: UpdateCategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(this.API, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  importCsv(file: File): Observable<ApiResponse<CsvImportResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<CsvImportResponse>>(`${this.API}/import`, formData);
  }
}
