import {
  Component, inject, OnInit, OnDestroy, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RawMaterialService } from '../../../core/services/raw-material.service';
import { CategoryService } from '../../../core/services/category.service';
import { MeasurementUnitService } from '../../../core/services/measurement-unit.service';
import { ToastService } from '../../../shared/services/toast.service';

import { RawMaterialResponse, CURRENCY_OPTIONS } from '../../../core/models/raw-material.model';
import { CategoryResponse } from '../../../core/models/category.model';
import { MeasurementUnitResponse } from '../../../core/models/measurement-unit.model';
import { CatalogStatus, STATUS_OPTIONS } from '../../../shared/models/status.model';

const WEIGHT_UNIT_TYPES = ['MASS', 'WEIGHT', 'Peso', 'Masa', 'PESO', 'MASA'];

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

  // State
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  isSubmitting = signal(false);
  isLoadingData = signal(false);
  errorMessage = signal<string | null>(null);

  // Catalog data
  categories = signal<CategoryResponse[]>([]);
  measurementUnits = signal<MeasurementUnitResponse[]>([]);

  // Density modal state
  showDensitySwitch = signal(false);
  showDensityModal = signal(false);
  densityEnabled = signal(false);

  // Live cost summary
  costSummary = signal<{ realCost: number; currency: string; unitName: string } | null>(null);

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  form = this.fb.group({
    // Required
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    categoryId: [null as number | null, [Validators.required]],
    purchaseUnitId: [null as number | null, [Validators.required]],
    quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    cost: [null as number | null, [Validators.required, Validators.min(0)]],
    currency: ['MXN', [Validators.required]],
    yieldPercent: [100, [Validators.required, Validators.min(1), Validators.max(100)]],
    // Optional
    description: ['', [Validators.maxLength(500)]],
    brand: ['', [Validators.maxLength(100)]],
    supplier: ['', [Validators.maxLength(150)]],
    minimumStock: [null as number | null, [Validators.min(0)]],
    // Edit only
    status: ['ACTIVE' as CatalogStatus],
    // Density conversion
    gramsPerCup: [null as number | null, [Validators.min(1), Validators.max(5000)]],
    gramsPerTablespoon: [null as number | null, [Validators.min(1), Validators.max(1000)]],
    gramsPerTeaspoon: [null as number | null, [Validators.min(1), Validators.max(500)]]
  });

  get selectedUnit(): MeasurementUnitResponse | undefined {
    const id = this.form.get('purchaseUnitId')?.value;
    return this.measurementUnits().find(u => u.id === id);
  }

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

  private loadCatalogs(): void {
    this.isLoadingData.set(true);
    const catReq = this.categoryService.getAll({ page: 0, size: 200, sort: 'name,asc' });
    const unitReq = this.measurementUnitService.getAll({ page: 0, size: 200, sort: 'name,asc' });

    combineLatest([catReq, unitReq])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([cats, units]) => {
          this.categories.set(cats.data.content);
          this.measurementUnits.set(units.data.content);
          this.isLoadingData.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar los catálogos. Por favor recargue la página.');
          this.isLoadingData.set(false);
        }
      });
  }

  private loadItem(id: number): void {
    this.isLoadingData.set(true);
    this.rawMaterialService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const item: RawMaterialResponse = res.data;
        this.form.patchValue({
          name: item.name,
          categoryId: item.categoryId,
          purchaseUnitId: item.purchaseUnitId,
          quantity: item.quantity,
          cost: item.cost,
          currency: item.currency,
          yieldPercent: item.yieldPercent,
          description: item.description || '',
          brand: item.brand || '',
          supplier: item.supplier || '',
          minimumStock: item.minimumStock ?? null,
          status: item.status
        });
        this.isLoadingData.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Error al cargar el ingrediente');
        this.isLoadingData.set(false);
      }
    });
  }

  private setupLiveCalc(): void {
    const costCtrl = this.form.get('cost')!;
    const qtyCtrl = this.form.get('quantity')!;
    const yieldCtrl = this.form.get('yieldPercent')!;
    const currencyCtrl = this.form.get('currency')!;

    combineLatest([
      costCtrl.valueChanges,
      qtyCtrl.valueChanges,
      yieldCtrl.valueChanges,
      currencyCtrl.valueChanges
    ]).pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.updateCostSummary());
  }

  private setupUnitWatcher(): void {
    this.form.get('purchaseUnitId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const unit = this.selectedUnit;
        const isWeightUnit = unit ? WEIGHT_UNIT_TYPES.some(t =>
          unit.unitType?.toLowerCase().includes(t.toLowerCase())
        ) : false;
        this.showDensitySwitch.set(isWeightUnit);
        if (!isWeightUnit) {
          this.densityEnabled.set(false);
          this.showDensityModal.set(false);
        }
      });
  }

  private updateCostSummary(): void {
    const cost = this.form.get('cost')?.value;
    const qty = this.form.get('quantity')?.value;
    const yld = this.form.get('yieldPercent')?.value;
    const currency = this.form.get('currency')?.value ?? 'MXN';

    if (cost != null && qty != null && yld != null && qty > 0 && yld > 0) {
      const usableQty = qty * (yld / 100);
      const realCost = cost / usableQty;
      const unit = this.selectedUnit;
      this.costSummary.set({
        realCost,
        currency,
        unitName: unit?.name ?? 'unidad'
      });
    } else {
      this.costSummary.set(null);
    }
  }

  toggleDensity(): void {
    const next = !this.densityEnabled();
    this.densityEnabled.set(next);
    if (next) {
      this.showDensityModal.set(true);
    } else {
      this.showDensityModal.set(false);
      this.form.patchValue({ gramsPerCup: null, gramsPerTablespoon: null, gramsPerTeaspoon: null });
    }
  }

  closeDensityModal(): void {
    this.showDensityModal.set(false);
  }

  saveDensityModal(): void {
    const gpc = this.form.get('gramsPerCup')?.value;
    if (!gpc || gpc <= 0) {
      this.form.get('gramsPerCup')?.markAsTouched();
      return;
    }
    this.showDensityModal.set(false);
    this.toast.success('Conversión de densidad guardada', `Se usará ${gpc}g = 1 taza para este ingrediente.`);
  }

  onSubmit(): void {
    this.updateCostSummary();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const densityConversion = this.densityEnabled() && v.gramsPerCup
      ? {
          gramsPerCup: v.gramsPerCup!,
          gramsPerTablespoon: v.gramsPerTablespoon ?? undefined,
          gramsPerTeaspoon: v.gramsPerTeaspoon ?? undefined
        }
      : undefined;

    const base = {
      name: v.name!,
      description: v.description || undefined,
      brand: v.brand || undefined,
      supplier: v.supplier || undefined,
      categoryId: v.categoryId!,
      purchaseUnitId: v.purchaseUnitId!,
      quantity: v.quantity!,
      cost: v.cost!,
      currency: v.currency!,
      yieldPercent: v.yieldPercent!,
      minimumStock: v.minimumStock ?? undefined,
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

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio';
    if (ctrl.errors['min']) {
      const min = ctrl.errors['min'].min;
      if (field === 'yieldPercent') return 'El rendimiento mínimo es 1%';
      if (field === 'cost') return 'El costo no puede ser negativo';
      if (field === 'quantity') return 'La cantidad debe ser mayor a 0';
      return `El valor mínimo es ${min}`;
    }
    if (ctrl.errors['max']) {
      const max = ctrl.errors['max'].max;
      if (field === 'yieldPercent') return 'El rendimiento no puede ser mayor a 100%';
      return `El valor máximo es ${max}`;
    }
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  get yieldValue(): number {
    return this.form.get('yieldPercent')?.value ?? 100;
  }

  get costValue(): number {
    return this.form.get('cost')?.value ?? 0;
  }

  get quantityValue(): number {
    return this.form.get('quantity')?.value ?? 0;
  }
}
