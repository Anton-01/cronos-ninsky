import { CatalogStatus } from '../../shared/models/status.model';

export interface AllergenResponse {
  id: number;
  name: string;
  alternativeName: string;
  description: string;
  isSystemDefault: boolean;
  status: CatalogStatus;
}

export interface CreateAllergenRequest {
  name: string;
  alternativeName: string;
  description?: string;
}

export interface UpdateAllergenRequest {
  id: number;
  name: string;
  description?: string;
  status?: CatalogStatus;
}
