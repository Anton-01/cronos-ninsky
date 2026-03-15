import { CatalogStatus } from '../../shared/models/status.model';

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  isSystemDefault: boolean;
  status: CatalogStatus;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  id: number;
  name: string;
  description?: string;
  status?: CatalogStatus;
}
