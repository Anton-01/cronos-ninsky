export interface UnitTypeResponse {
  id: number;
  codeIdentity: string;
  name: string;
  dimension: string;
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
}
