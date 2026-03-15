import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UnitTypeService } from '../../../core/services/unit-type.service';
import { UnitTypeResponse } from '../../../core/models/unit-type.model';
import { CatalogStatus, STATUS_OPTIONS } from '../../../shared/models/status.model';

@Component({
  selector: 'app-unit-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './unit-type-form.component.html'
})
export class UnitTypeFormComponent implements OnInit {
  private unitTypeService = inject(UnitTypeService);
  private fb = inject(FormBuilder);

  item = input<UnitTypeResponse | null>(null);
  saved = output<boolean>();
  cancelled = output<void>();

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly statusOptions = STATUS_OPTIONS;

  form = this.fb.group({
    codeIdentity: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    dimension: ['', [Validators.required, Validators.maxLength(50)]],
    status: ['ACTIVE' as CatalogStatus]
  });

  get isEditing(): boolean {
    return !!this.item();
  }

  ngOnInit(): void {
    const current = this.item();
    if (current) {
      this.form.patchValue({
        codeIdentity: current.codeIdentity,
        name: current.name,
        dimension: current.dimension,
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
      this.unitTypeService.update({
        id: current.id,
        codeIdentity: this.form.value.codeIdentity!,
        name: this.form.value.name!,
        dimension: this.form.value.dimension!,
        status: this.form.value.status as CatalogStatus
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(true); },
        error: (err) => { this.isSubmitting.set(false); this.errorMessage.set(err?.message || 'Error al actualizar'); }
      });
    } else {
      this.unitTypeService.create({
        codeIdentity: this.form.value.codeIdentity!,
        name: this.form.value.name!,
        dimension: this.form.value.dimension!
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
