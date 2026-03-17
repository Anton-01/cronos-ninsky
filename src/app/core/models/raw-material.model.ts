import { CatalogStatus } from '../../shared/models/status.model';

export interface RawMaterialResponse {
  id: number;
  name: string;
  description?: string;
  brand?: string;
  supplier?: string;
  categoryId: number;
  categoryName: string;
  purchaseUnitId: number;
  purchaseUnitName: string;
  purchaseUnitCode: string;
  purchaseUnitType: string;
  purchaseQuantity: number;
  unitCost: number;
  currency: string;
  yieldPercentage: number;
  minimumStock?: number;
  hasDensityConversion: boolean;
  densityConversion?: DensityConversionRequest;
  status: CatalogStatus;
}

export interface CreateRawMaterialRequest {
  name: string;
  description?: string;
  brand?: string;
  supplier?: string;
  categoryId: number;
  purchaseUnitId: number;
  purchaseQuantity: number;
  unitCost: number;
  currency: string;
  yieldPercentage: number;
  minimumStock?: number;
  densityConversion?: DensityConversionRequest;
}

export interface UpdateRawMaterialRequest extends CreateRawMaterialRequest {
  id: string;
  status?: CatalogStatus;
}

export interface DensityConversionRequest {
  gramsPerCup: number;
  gramsPerTablespoon?: number;
  gramsPerTeaspoon?: number;
}

export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'MXN', label: 'MXN – Peso Mexicano' },
  { value: 'USD', label: 'USD – Dólar Americano' },
  { value: 'EUR', label: 'EUR – Euro' },
];
