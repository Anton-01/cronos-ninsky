import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MeasurementUnitService } from '../../../core/services/measurement-unit.service';
import { UnitTypeService } from '../../../core/services/unit-type.service';
import { MeasurementUnitResponse } from '../../../core/models/measurement-unit.model';
import { UnitTypeResponse } from '../../../core/models/unit-type.model';
import { CatalogStatus, STATUS_OPTIONS } from '../../../shared/models/status.model';

@Component({
  selector: 'app-measurement-unit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './measurement-unit-form.component.html'
})
export class MeasurementUnitFormComponent implements OnInit {
  private measurementUnitService = inject(MeasurementUnitService);
  private unitTypeService = inject(UnitTypeService);
  private fb = inject(FormBuilder);

  item = input<MeasurementUnitResponse | null>(null);
  saved = output<boolean>();
  cancelled = output<void>();

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  unitTypes = signal<UnitTypeResponse[]>([]);

  readonly statusOptions = STATUS_OPTIONS;

  form = this.fb.group({
    codeIdentity: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    namePlural: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    unitTypeId: [null as number | null, [Validators.required]],
    multiplierToBase: [1, [Validators.required, Validators.min(0)]],
    isBaseUnit: [false],
    status: ['ACTIVE' as CatalogStatus]
  });

  get isEditing(): boolean {
    return !!this.item();
  }

  ngOnInit(): void {
    this.loadUnitTypes();
    const current = this.item();
    if (current) {
      this.form.patchValue({
        codeIdentity: current.codeIdentity,
        name: current.name,
        namePlural: current.namePlural,
        multiplierToBase: current.multiplierToBase,
        isBaseUnit: current.isBaseUnit,
        status: current.status
      });
    }
  }

  loadUnitTypes(): void {
    this.unitTypeService.getAll({ page: 0, size: 100, sort: 'name,asc' }).subscribe({
      next: (res) => this.unitTypes.set(res.data.content),
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const current = this.item();
    if (current) {
      this.measurementUnitService.update({
        id: current.id,
        codeIdentity: v.codeIdentity!,
        name: v.name!,
        namePlural: v.namePlural!,
        unitTypeId: v.unitTypeId!,
        multiplierToBase: v.multiplierToBase!,
        isBaseUnit: v.isBaseUnit!,
        status: v.status as CatalogStatus
      }).subscribe({
        next: () => { this.isSubmitting.set(false); this.saved.emit(true); },
        error: (err) => { this.isSubmitting.set(false); this.errorMessage.set(err?.message || 'Error al actualizar'); }
      });
    } else {
      this.measurementUnitService.create({
        codeIdentity: v.codeIdentity!,
        name: v.name!,
        namePlural: v.namePlural!,
        unitTypeId: v.unitTypeId!,
        multiplierToBase: v.multiplierToBase!,
        isBaseUnit: v.isBaseUnit!
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
    if (control.errors['min']) return 'El valor debe ser mayor o igual a 0';
    return 'Campo inválido';
  }
}
