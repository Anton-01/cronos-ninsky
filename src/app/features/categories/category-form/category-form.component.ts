import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  item = input<CategoryResponse | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  get isEditing(): boolean {
    return !!this.item();
  }

  ngOnInit(): void {
    const current = this.item();
    if (current) {
      this.form.patchValue({ name: current.name, description: current.description });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const current = this.item();
    if (current) {
      this.categoryService.update({
        id: current.id,
        name: this.form.value.name!,
        description: this.form.value.description || undefined
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(); },
        error: (err) => { this.isSubmitting.set(false); this.errorMessage.set(err?.message || 'Error al actualizar'); }
      });
    } else {
      this.categoryService.create({
        name: this.form.value.name!,
        description: this.form.value.description || undefined
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(); },
        error: (err) => { this.isSubmitting.set(false); this.errorMessage.set(err?.message || 'Error al crear'); }
      });
    }
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
