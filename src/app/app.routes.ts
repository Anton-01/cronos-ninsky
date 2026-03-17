import { Routes } from '@angular/router';
import { Demo1Component } from './layouts/demo1/demo1.component';
import { IndexComponent as Demo1IndexComponent } from './pages/demo1/index/index.component';

import { UnitTypeListComponent } from './features/unit-types/unit-type-list/unit-type-list.component';
import { CategoryListComponent } from './features/categories/category-list/category-list.component';
import { AllergenListComponent } from './features/allergens/allergen-list/allergen-list.component';
import { MeasurementUnitListComponent } from './features/measurement-units/measurement-unit-list/measurement-unit-list.component';
import { RawMaterialListComponent } from './features/raw-materials/raw-material-list/raw-material-list.component';
import { RawMaterialFormComponent } from './features/raw-materials/raw-material-form/raw-material-form.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cronos/dashboard' },
  {
    path: 'cronos',
    component: Demo1Component,
    children: [
      { path: 'dashboard', component: Demo1IndexComponent },
      { path: 'tipos-unidad', component: UnitTypeListComponent },
      { path: 'categorias', component: CategoryListComponent },
      { path: 'alergenos', component: AllergenListComponent },
      { path: 'unidades-medida', component: MeasurementUnitListComponent },
      { path: 'ingredientes', component: RawMaterialListComponent },
      { path: 'ingredientes/nuevo', component: RawMaterialFormComponent },
      { path: 'ingredientes/editar/:id', component: RawMaterialFormComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ],
  },
];
