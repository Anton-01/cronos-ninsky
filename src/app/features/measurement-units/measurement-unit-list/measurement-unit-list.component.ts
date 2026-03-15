import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasurementUnitService } from '../../../core/services/measurement-unit.service';
import { MeasurementUnitResponse } from '../../../core/models/measurement-unit.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { STATUS_LABEL, STATUS_BADGE } from '../../../shared/models/status.model';
import { ToastService } from '../../../shared/services/toast.service';
import { DeleteInfo } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { MeasurementUnitFormComponent } from '../measurement-unit-form/measurement-unit-form.component';
import { DeleteConfirmModalComponent } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-measurement-unit-list',
  standalone: true,
  imports: [CommonModule, MeasurementUnitFormComponent, DeleteConfirmModalComponent],
  templateUrl: './measurement-unit-list.component.html'
})
export class MeasurementUnitListComponent implements OnInit {
  private measurementUnitService = inject(MeasurementUnitService);
  private toast = inject(ToastService);

  items = signal<MeasurementUnitResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showForm = signal(false);
  selectedItem = signal<MeasurementUnitResponse | null>(null);

  showDeleteModal = signal(false);
  deletingItem = signal<MeasurementUnitResponse | null>(null);
  isDeleting = signal(false);
  deleteDetails = signal<DeleteInfo[]>([]);

  readonly statusLabel = STATUS_LABEL;
  readonly statusBadge = STATUS_BADGE;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.measurementUnitService.getAll(this.pageRequest).subscribe({
      next: (res) => {
        this.items.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar las unidades de medida');
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void { this.selectedItem.set(null); this.showForm.set(true); }
  openEdit(item: MeasurementUnitResponse): void { this.selectedItem.set(item); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.selectedItem.set(null); }

  onSaved(isEdit: boolean): void {
    this.closeForm();
    this.load();
    this.toast.success(
      isEdit ? 'Registro actualizado' : 'Registro creado',
      isEdit ? 'La unidad de medida fue actualizada correctamente.' : 'La unidad de medida fue creada correctamente.'
    );
  }

  openDeleteModal(item: MeasurementUnitResponse): void {
    this.deletingItem.set(item);
    this.deleteDetails.set([
      { label: 'Código', value: item.codeIdentity },
      { label: 'Nombre', value: item.name },
      { label: 'Tipo', value: item.unitType },
      { label: 'Estado', value: STATUS_LABEL[item.status] ?? item.status }
    ]);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingItem.set(null);
  }

  confirmDelete(): void {
    const item = this.deletingItem();
    if (!item) return;
    this.isDeleting.set(true);
    this.measurementUnitService.delete(item.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.load();
        this.toast.success('Registro eliminado', `"${item.name}" fue eliminada correctamente.`);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.toast.error('Error al eliminar', err?.message || 'No se pudo eliminar el registro.');
      }
    });
  }

  goToPage(page: number): void { this.pageRequest = { ...this.pageRequest, page }; this.load(); }
  get pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }
}
