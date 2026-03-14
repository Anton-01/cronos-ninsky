import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllergenService } from '../../../core/services/allergen.service';
import { AllergenResponse } from '../../../core/models/allergen.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { AllergenFormComponent } from '../allergen-form/allergen-form.component';

@Component({
  selector: 'app-allergen-list',
  standalone: true,
  imports: [CommonModule, AllergenFormComponent],
  templateUrl: './allergen-list.component.html'
})
export class AllergenListComponent implements OnInit {
  private allergenService = inject(AllergenService);

  items = signal<AllergenResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showModal = signal(false);
  selectedItem = signal<AllergenResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

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

  openCreate(): void {
    this.selectedItem.set(null);
    this.showModal.set(true);
  }

  openEdit(item: AllergenResponse): void {
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

  delete(item: AllergenResponse): void {
    if (!confirm(`¿Eliminar el alérgeno "${item.name}"?`)) return;
    this.allergenService.delete(item.id).subscribe({
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
