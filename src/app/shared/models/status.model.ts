export type CatalogStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export const STATUS_LABEL: Record<CatalogStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Archivado'
};

export const STATUS_BADGE: Record<CatalogStatus, string> = {
  ACTIVE: 'kt-badge-success',
  INACTIVE: 'kt-badge-warning',
  ARCHIVED: 'kt-badge-secondary'
};

export const STATUS_ICON: Record<CatalogStatus, string> = {
  ACTIVE: 'ki-filled ki-check-circle',
  INACTIVE: 'ki-filled ki-minus-circle',
  ARCHIVED: 'ki-filled ki-archive'
};

export const STATUS_OPTIONS: { value: CatalogStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ARCHIVED', label: 'Archivado' }
];
