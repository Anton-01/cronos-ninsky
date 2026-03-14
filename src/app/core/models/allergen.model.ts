export interface AllergenResponse {
  id: number;
  name: string;
  alternativeName: string;
  description: string;
  isSystemDefault: boolean;
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
}
