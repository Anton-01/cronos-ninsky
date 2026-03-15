import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitTypeService } from '../../../core/services/unit-type.service';
import { UnitTypeResponse } from '../../../core/models/unit-type.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { STATUS_LABEL, STATUS_BADGE } from '../../../shared/models/status.model';
import { ToastService } from '../../../shared/services/toast.service';
import { DeleteInfo } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { UnitTypeFormComponent } from '../unit-type-form/unit-type-form.component';
import { DeleteConfirmModalComponent } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-unit-type-list',
  standalone: true,
  imports: [CommonModule, UnitTypeFormComponent, DeleteConfirmModalComponent],
  templateUrl: './unit-type-list.component.html'
})
export class UnitTypeListComponent implements OnInit {
  private unitTypeService = inject(UnitTypeService);
  private toast = inject(ToastService);

  items = signal<UnitTypeResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showForm = signal(false);
  selectedItem = signal<UnitTypeResponse | null>(null);

  showDeleteModal = signal(false);
  deletingItem = signal<UnitTypeResponse | null>(null);
  isDeleting = signal(false);
  deleteDetails = signal<DeleteInfo[]>([]);

  readonly statusLabel = STATUS_LABEL;
  readonly statusBadge = STATUS_BADGE;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.unitTypeService.getAll(this.pageRequest).subscribe({
      next: (res) => {
        this.items.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar los tipos de unidad');
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void { this.selectedItem.set(null); this.showForm.set(true); }
  openEdit(item: UnitTypeResponse): void { this.selectedItem.set(item); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.selectedItem.set(null); }

  onSaved(isEdit: boolean): void {
    this.closeForm();
    this.load();
    this.toast.success(
      isEdit ? 'Registro actualizado' : 'Registro creado',
      isEdit ? 'El tipo de unidad fue actualizado correctamente.' : 'El tipo de unidad fue creado correctamente.'
    );
  }

  openDeleteModal(item: UnitTypeResponse): void {
    this.deletingItem.set(item);
    this.deleteDetails.set([
      { label: 'Código', value: item.codeIdentity },
      { label: 'Nombre', value: item.name },
      { label: 'Dimensión', value: item.dimension },
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
    this.unitTypeService.delete(item.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.load();
        this.toast.success('Registro eliminado', `"${item.name}" fue eliminado correctamente.`);
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
