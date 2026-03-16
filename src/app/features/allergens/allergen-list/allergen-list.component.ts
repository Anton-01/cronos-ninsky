import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllergenService } from '../../../core/services/allergen.service';
import { AllergenResponse } from '../../../core/models/allergen.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { STATUS_LABEL, STATUS_BADGE } from '../../../shared/models/status.model';
import { ToastService } from '../../../shared/services/toast.service';
import { DeleteInfo } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { AllergenFormComponent } from '../allergen-form/allergen-form.component';
import { DeleteConfirmModalComponent } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-allergen-list',
  standalone: true,
  imports: [CommonModule, AllergenFormComponent, DeleteConfirmModalComponent],
  templateUrl: './allergen-list.component.html'
})
export class AllergenListComponent implements OnInit {
  private allergenService = inject(AllergenService);
  private toast = inject(ToastService);

  items = signal<AllergenResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showForm = signal(false);
  selectedItem = signal<AllergenResponse | null>(null);

  showDeleteModal = signal(false);
  deletingItem = signal<AllergenResponse | null>(null);
  isDeleting = signal(false);
  deleteDetails = signal<DeleteInfo[]>([]);

  readonly statusLabel = STATUS_LABEL;
  readonly statusBadge = STATUS_BADGE;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.allergenService.getAll(this.pageRequest).subscribe({
      next: (res) => {
        this.items.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar los alérgenos');
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void { this.selectedItem.set(null); this.showForm.set(true); }
  openEdit(item: AllergenResponse): void { this.selectedItem.set(item); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.selectedItem.set(null); }

  onSaved(isEdit: boolean): void {
    this.closeForm();
    this.load();
    this.toast.success(
      isEdit ? 'Registro actualizado' : 'Registro creado',
      isEdit ? 'El alérgeno fue actualizado correctamente.' : 'El alérgeno fue creado correctamente.'
    );
  }

  openDeleteModal(item: AllergenResponse): void {
    this.deletingItem.set(item);
    this.deleteDetails.set([
      { label: 'Nombre', value: item.name },
      { label: 'Nombre alternativo', value: item.alternativeName || '—' },
      { label: 'Tipo', value: item.isSystemDefault ? 'Sistema' : 'Personalizado' },
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
    this.allergenService.delete(item.id).subscribe({
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
