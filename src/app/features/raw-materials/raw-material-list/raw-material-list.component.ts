import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RawMaterialService } from '../../../core/services/raw-material.service';
import { RawMaterialResponse } from '../../../core/models/raw-material.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { STATUS_LABEL, STATUS_BADGE } from '../../../shared/models/status.model';
import { ToastService } from '../../../shared/services/toast.service';
import { DeleteConfirmModalComponent, DeleteInfo } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-raw-material-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DeleteConfirmModalComponent],
  templateUrl: './raw-material-list.component.html'
})
export class RawMaterialListComponent implements OnInit {
  private service = inject(RawMaterialService);
  private toast = inject(ToastService);

  items = signal<RawMaterialResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showDeleteModal = signal(false);
  deletingItem = signal<RawMaterialResponse | null>(null);
  isDeleting = signal(false);
  deleteDetails = signal<DeleteInfo[]>([]);

  readonly statusLabel = STATUS_LABEL;
  readonly statusBadge = STATUS_BADGE;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.getAll(this.pageRequest).subscribe({
      next: (res) => {
        this.items.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar los ingredientes');
        this.isLoading.set(false);
      }
    });
  }

  openDeleteModal(item: RawMaterialResponse): void {
    this.deletingItem.set(item);
    this.deleteDetails.set([
      { label: 'Nombre', value: item.name },
      { label: 'Categoría', value: item.categoryName },
      { label: 'Unidad de compra', value: item.purchaseUnitName },
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
    this.service.delete(item.id).subscribe({
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

  formatCost(item: RawMaterialResponse): string {
    const realCost = item.unitCost / (item.purchaseQuantity * (item.yieldPercentage / 100));
    return realCost.toFixed(4);
  }
}
