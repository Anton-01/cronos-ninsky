import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';
import { PageRequest } from '../../../core/models/pagination.model';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, CategoryFormComponent],
  templateUrl: './category-list.component.html'
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  items = signal<CategoryResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageRequest: PageRequest = { page: 0, size: 10, sort: 'name,asc' };

  showModal = signal(false);
  selectedItem = signal<CategoryResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.categoryService.getAll(this.pageRequest).subscribe({
      next: (res) => {
        this.items.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar las categorías');
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void {
    this.selectedItem.set(null);
    this.showModal.set(true);
  }

  openEdit(item: CategoryResponse): void {
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

  delete(item: CategoryResponse): void {
    if (!confirm(`¿Eliminar la categoría "${item.name}"?`)) return;
    this.categoryService.delete(item.id).subscribe({
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
