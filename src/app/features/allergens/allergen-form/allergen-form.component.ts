import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AllergenService } from '../../../core/services/allergen.service';
import { AllergenResponse } from '../../../core/models/allergen.model';
import { CatalogStatus, STATUS_OPTIONS } from '../../../shared/models/status.model';

@Component({
  selector: 'app-allergen-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './allergen-form.component.html'
})
export class AllergenFormComponent implements OnInit {
  private allergenService = inject(AllergenService);
  private fb = inject(FormBuilder);

  item = input<AllergenResponse | null>(null);
  saved = output<boolean>();
  cancelled = output<void>();

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly statusOptions = STATUS_OPTIONS;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    alternativeName: ['', [Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['ACTIVE' as CatalogStatus]
  });

  get isEditing(): boolean {
    return !!this.item();
  }

  ngOnInit(): void {
    const current = this.item();
    if (current) {
      this.form.patchValue({
        name: current.name,
        alternativeName: current.alternativeName,
        description: current.description,
        status: current.status
      });
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
      this.allergenService.update({
        id: current.id,
        name: this.form.value.name!,
        description: this.form.value.description || undefined,
        status: this.form.value.status as CatalogStatus
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(true); },
        error: (err) => { this.isSubmitting.set(false); this.errorMessage.set(err?.message || 'Error al actualizar'); }
      });
    } else {
      this.allergenService.create({
        name: this.form.value.name!,
        alternativeName: this.form.value.alternativeName || '',
        description: this.form.value.description || undefined
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(false); },
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
