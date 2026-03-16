import { CatalogStatus } from '../../shared/models/status.model';

export interface UnitTypeResponse {
  id: number;
  codeIdentity: string;
  name: string;
  dimension: string;
  status: CatalogStatus;
}

export interface CreateUnitTypeRequest {
  codeIdentity: string;
  name: string;
  dimension: string;
}

export interface UpdateUnitTypeRequest {
  id: number;
  codeIdentity: string;
  name: string;
  dimension: string;
  status?: CatalogStatus;
}
