import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasurementUnitService } from '../../../core/services/measurement-unit.service';
import { MeasurementUnitResponse } from '../../../core/models/measurement-unit.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { MeasurementUnitFormComponent } from '../measurement-unit-form/measurement-unit-form.component';

@Component({
  selector: 'app-measurement-unit-list',
  standalone: true,
  imports: [CommonModule, MeasurementUnitFormComponent],
  templateUrl: './measurement-unit-list.component.html'
})
export class MeasurementUnitListComponent implements OnInit {
  private measurementUnitService = inject(MeasurementUnitService);

  items = signal<MeasurementUnitResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showModal = signal(false);
  selectedItem = signal<MeasurementUnitResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

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

  openCreate(): void {
    this.selectedItem.set(null);
    this.showModal.set(true);
  }

  openEdit(item: MeasurementUnitResponse): void {
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

  delete(item: MeasurementUnitResponse): void {
    if (!confirm(`¿Eliminar la unidad "${item.name}"?`)) return;
    this.measurementUnitService.delete(item.id).subscribe({
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
