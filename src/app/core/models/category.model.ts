export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  isSystemDefault: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  id: number;
  name: string;
  description?: string;
}
