export interface MeasurementUnitResponse {
  id: number;
  codeIdentity: string;
  name: string;
  namePlural: string;
  unitType: string;
  multiplierToBase: number;
  isBaseUnit: boolean;
  isSystemDefault: boolean;
}

export interface CreateMeasurementUnitRequest {
  codeIdentity: string;
  name: string;
  namePlural: string;
  unitTypeId: number;
  multiplierToBase: number;
  isBaseUnit: boolean;
  userId?: number;
}

export interface UpdateMeasurementUnitRequest {
  id: number;
  codeIdentity: string;
  name: string;
  namePlural: string;
  unitTypeId: number;
  multiplierToBase: number;
  isBaseUnit: boolean;
  userId?: number;
}
