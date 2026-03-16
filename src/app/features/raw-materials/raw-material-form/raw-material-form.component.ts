import {
  Component, inject, OnInit, OnDestroy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, combineLatestWith } from 'rxjs/operators';

import { RawMaterialService } from '../../../core/services/raw-material.service';
import { CategoryService } from '../../../core/services/category.service';
import { MeasurementUnitService } from '../../../core/services/measurement-unit.service';
import { ToastService } from '../../../shared/services/toast.service';

import { RawMaterialResponse, CURRENCY_OPTIONS } from '../../../core/models/raw-material.model';
import { CategoryResponse } from '../../../core/models/category.model';
import { MeasurementUnitResponse } from '../../../core/models/measurement-unit.model';
import { CatalogStatus, STATUS_OPTIONS } from '../../../shared/models/status.model';

const WEIGHT_UNIT_TYPES = ['mass', 'weight', 'peso', 'masa'];

@Component({
  selector: 'app-raw-material-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './raw-material-form.component.html',
  styleUrls: ['./raw-material-form.component.scss']
})
export class RawMaterialFormComponent implements OnInit, OnDestroy {
  private rawMaterialService = inject(RawMaterialService);
  private categoryService = inject(CategoryService);
  private measurementUnitService = inject(MeasurementUnitService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // ─── State ───────────────────────────────────────────
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  isSubmitting = signal(false);
  isLoadingData = signal(false);
  errorMessage = signal<string | null>(null);

  // ─── Catalog data ────────────────────────────────────
  categories = signal<CategoryResponse[]>([]);
  measurementUnits = signal<MeasurementUnitResponse[]>([]);

  // ─── Density modal state ─────────────────────────────
  showDensitySwitch = signal(false);
  showDensityModal = signal(false);
  densityEnabled = signal(false);
  /** Saved density data (after clicking "Guardar Conversión") */
  densitySaved = signal<{ gramsPerCup: number; gramsPerTablespoon?: number; gramsPerTeaspoon?: number } | null>(null);

  // ─── Live cost summary ───────────────────────────────
  costSummary = signal<{ realCost: number; currency: string; unitName: string } | null>(null);

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  // ─── Form ────────────────────────────────────────────
  form = this.fb.group({
    // Required
    name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    categoryId:     [null as number | null, [Validators.required]],
    purchaseUnitId: [null as number | null, [Validators.required]],
    quantity:       [null as number | null, [Validators.required, Validators.min(0.0001)]],
    cost:           [null as number | null, [Validators.required, Validators.min(0)]],
    currency:       ['MXN', [Validators.required]],
    yieldPercent:   [100, [Validators.required, Validators.min(1), Validators.max(100)]],
    // Optional
    description:    ['', [Validators.maxLength(500)]],
    brand:          ['', [Validators.maxLength(100)]],
    supplier:       ['', [Validators.maxLength(150)]],
    minimumStock:   [null as number | null, [Validators.min(0)]],
    // Edit only
    status:         ['ACTIVE' as CatalogStatus],
    // Density conversion (transient, sent to backend only)
    gramsPerCup:          [null as number | null, [Validators.min(1), Validators.max(5000)]],
    gramsPerTablespoon:   [null as number | null, [Validators.min(1), Validators.max(1000)]],
    gramsPerTeaspoon:     [null as number | null, [Validators.min(1), Validators.max(500)]]
  });

  // ─── Derived getters ─────────────────────────────────
  get selectedUnit(): MeasurementUnitResponse | undefined {
    const id = this.form.get('purchaseUnitId')?.value;
    return this.measurementUnits().find(u => u.id === id);
  }

  get yieldValue(): number  { return this.form.get('yieldPercent')?.value ?? 100; }
  get costValue(): number   { return this.form.get('cost')?.value ?? 0; }
  get quantityValue(): number { return this.form.get('quantity')?.value ?? 0; }

  // ─── Lifecycle ───────────────────────────────────────
  ngOnInit(): void {
    this.loadCatalogs();
    this.setupLiveCalc();
    this.setupUnitWatcher();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.editingId.set(Number(id));
      this.loadItem(Number(id));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data loading ────────────────────────────────────
  private loadCatalogs(): void {
    this.isLoadingData.set(true);

    this.categoryService.getAll({ page: 0, size: 200, sort: 'name,asc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.categories.set(res.data.content),
        error: () => this.errorMessage.set('No se pudieron cargar las categorías.')
      });

    this.measurementUnitService.getAll({ page: 0, size: 200, sort: 'name,asc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.measurementUnits.set(res.data.content); this.isLoadingData.set(false); },
        error: () => { this.errorMessage.set('No se pudieron cargar las unidades de medida.'); this.isLoadingData.set(false); }
      });
  }

  private loadItem(id: number): void {
    this.rawMaterialService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const item: RawMaterialResponse = res.data;
        this.form.patchValue({
          name:           item.name,
          categoryId:     item.categoryId,
          purchaseUnitId: item.purchaseUnitId,
          quantity:       item.quantity,
          cost:           item.cost,
          currency:       item.currency,
          yieldPercent:   item.yieldPercent,
          description:    item.description || '',
          brand:          item.brand || '',
          supplier:       item.supplier || '',
          minimumStock:   item.minimumStock ?? null,
          status:         item.status
        });
        this.updateCostSummary();
      },
      error: (err) => this.errorMessage.set(err?.message || 'Error al cargar el ingrediente')
    });
  }

  // ─── Reactive setup ──────────────────────────────────
  /**
   * Uses form.valueChanges (instead of combineLatest) so recalculation fires
   * whenever ANY field changes — including on blur via (change)/(blur) events.
   */
  private setupLiveCalc(): void {
    this.form.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => this.updateCostSummary());
  }

  private setupUnitWatcher(): void {
    this.form.get('purchaseUnitId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const unit = this.selectedUnit;
        const isWeightUnit = unit
          ? WEIGHT_UNIT_TYPES.some(t => unit.unitType?.toLowerCase().includes(t))
          : false;
        this.showDensitySwitch.set(isWeightUnit);
        if (!isWeightUnit) {
          this.densityEnabled.set(false);
          this.showDensityModal.set(false);
          this.densitySaved.set(null);
          this.form.patchValue({ gramsPerCup: null, gramsPerTablespoon: null, gramsPerTeaspoon: null });
        }
      });
  }

  /** Public so the template can call it on (blur) */
  updateCostSummary(): void {
    const cost = this.form.get('cost')?.value;
    const qty  = this.form.get('quantity')?.value;
    const yld  = this.form.get('yieldPercent')?.value;
    const currency = this.form.get('currency')?.value ?? 'MXN';

    if (cost != null && qty != null && yld != null && qty > 0 && yld > 0) {
      const usableQty = qty * (yld / 100);
      this.costSummary.set({
        realCost: cost / usableQty,
        currency,
        unitName: this.selectedUnit?.name ?? 'unidad'
      });
    } else {
      this.costSummary.set(null);
    }
  }

  // ─── Density modal actions ───────────────────────────
  toggleDensity(): void {
    if (this.densityEnabled()) {
      this.cancelDensityModal();   // turning OFF clears everything
    } else {
      this.densityEnabled.set(true);
      this.showDensityModal.set(true);
    }
  }

  /** Closes modal WITHOUT saving and resets the switch + fields */
  cancelDensityModal(): void {
    this.densityEnabled.set(false);
    this.showDensityModal.set(false);
    this.densitySaved.set(null);
    this.form.patchValue({ gramsPerCup: null, gramsPerTablespoon: null, gramsPerTeaspoon: null });
    // Reset touched/dirty on density controls
    ['gramsPerCup', 'gramsPerTablespoon', 'gramsPerTeaspoon'].forEach(f => {
      this.form.get(f)?.markAsUntouched();
      this.form.get(f)?.markAsPristine();
    });
  }

  saveDensityModal(): void {
    const gpc = this.form.get('gramsPerCup')?.value;
    if (!gpc || gpc <= 0) {
      this.form.get('gramsPerCup')?.markAsTouched();
      return;
    }
    const saved = {
      gramsPerCup:        gpc,
      gramsPerTablespoon: this.form.get('gramsPerTablespoon')?.value ?? undefined,
      gramsPerTeaspoon:   this.form.get('gramsPerTeaspoon')?.value ?? undefined
    };
    this.densitySaved.set(saved);
    this.showDensityModal.set(false);
    this.toast.success(
      'Conversión configurada',
      `1 taza = ${gpc}g de ${this.form.get('name')?.value || 'este ingrediente'}.`
    );
  }

  // ─── Form submission ─────────────────────────────────
  onSubmit(): void {
    this.updateCostSummary();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const saved = this.densitySaved();
    const densityConversion = this.densityEnabled() && saved
      ? { gramsPerCup: saved.gramsPerCup, gramsPerTablespoon: saved.gramsPerTablespoon, gramsPerTeaspoon: saved.gramsPerTeaspoon }
      : undefined;

    const base = {
      name:           v.name!,
      description:    v.description || undefined,
      brand:          v.brand || undefined,
      supplier:       v.supplier || undefined,
      categoryId:     v.categoryId!,
      purchaseUnitId: v.purchaseUnitId!,
      quantity:       v.quantity!,
      cost:           v.cost!,
      currency:       v.currency!,
      yieldPercent:   v.yieldPercent!,
      minimumStock:   v.minimumStock ?? undefined,
      densityConversion
    };

    const id = this.editingId();
    const obs$ = id
      ? this.rawMaterialService.update({ ...base, id, status: v.status as CatalogStatus })
      : this.rawMaterialService.create(base);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(
          id ? 'Ingrediente actualizado' : 'Ingrediente creado',
          id ? 'Los cambios fueron guardados correctamente.' : 'El ingrediente fue creado correctamente.'
        );
        this.router.navigate(['/cronos/ingredientes']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Error al guardar el ingrediente');
      }
    });
  }

  // ─── Form helpers ────────────────────────────────────
  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])   return 'Este campo es obligatorio';
    if (ctrl.errors['min']) {
      if (field === 'yieldPercent') return 'El rendimiento mínimo es 1%';
      if (field === 'cost')         return 'El costo no puede ser negativo';
      if (field === 'quantity')     return 'La cantidad debe ser mayor a 0';
      return `El valor mínimo es ${ctrl.errors['min'].min}`;
    }
    if (ctrl.errors['max']) {
      if (field === 'yieldPercent') return 'El rendimiento no puede ser mayor a 100%';
      return `El valor máximo es ${ctrl.errors['max'].max}`;
    }
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
