import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitTypeService } from '../../../core/services/unit-type.service';
import { UnitTypeResponse } from '../../../core/models/unit-type.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { UnitTypeFormComponent } from '../unit-type-form/unit-type-form.component';

@Component({
  selector: 'app-unit-type-list',
  standalone: true,
  imports: [CommonModule, UnitTypeFormComponent],
  templateUrl: './unit-type-list.component.html'
})
export class UnitTypeListComponent implements OnInit {
  private unitTypeService = inject(UnitTypeService);

  items = signal<UnitTypeResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showModal = signal(false);
  selectedItem = signal<UnitTypeResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

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

  openCreate(): void {
    this.selectedItem.set(null);
    this.showModal.set(true);
  }

  openEdit(item: UnitTypeResponse): void {
    this.selectedItem.set(item);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedItem.set(null);
  }

  onSaved(): void {
    this.closeModal();
    this.load();
  }

  delete(item: UnitTypeResponse): void {
    if (!confirm(`¿Eliminar el tipo de unidad "${item.name}"?`)) return;
    this.unitTypeService.delete(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.errorMessage.set(err?.message || 'Error al eliminar')
    });
  }

  goToPage(page: number): void {
    this.pageRequest = { ...this.pageRequest, page };
    this.load();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}
