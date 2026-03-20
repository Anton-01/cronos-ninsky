import { Routes } from '@angular/router';

// Layouts
import { Demo1Component } from './layouts/demo1/demo1.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

// Guards
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

// Pages (existing)
import { IndexComponent as Demo1IndexComponent } from './pages/demo1/index/index.component';
import { UnitTypeListComponent } from './features/unit-types/unit-type-list/unit-type-list.component';
import { CategoryListComponent } from './features/categories/category-list/category-list.component';
import { AllergenListComponent } from './features/allergens/allergen-list/allergen-list.component';
import { MeasurementUnitListComponent } from './features/measurement-units/measurement-unit-list/measurement-unit-list.component';
import { RawMaterialListComponent } from './features/raw-materials/raw-material-list/raw-material-list.component';
import { RawMaterialFormComponent } from './features/raw-materials/raw-material-form/raw-material-form.component';

// Auth (public)
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { OAuth2CallbackComponent } from './features/auth/oauth2-callback/oauth2-callback.component';

// Account (private – current user)
import { AccountHomeComponent } from './features/account/account-home/account-home.component';
import { ProfileOverviewComponent } from './features/account/profile/profile-overview.component';
import { SecuritySettingsComponent } from './features/account/security/security-settings.component';

// Admin (private – ADMIN role required)
import { UserManagementComponent } from './features/admin/user-management/user-management.component';

export const routes: Routes = [
  // ── Default redirect ──────────────────────────────────────────────────────
  { path: '', pathMatch: 'full', redirectTo: 'cronos/dashboard' },

  // ── OAuth2 callback (no layout, no guard) ─────────────────────────────────
  { path: 'oauth2-callback', component: OAuth2CallbackComponent },

  // ── Public auth routes ────────────────────────────────────────────────────
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login',    component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  // ── Private app routes ────────────────────────────────────────────────────
  {
    path: 'cronos',
    component: Demo1Component,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',          component: Demo1IndexComponent },
      { path: 'tipos-unidad',       component: UnitTypeListComponent },
      { path: 'categorias',         component: CategoryListComponent },
      { path: 'alergenos',          component: AllergenListComponent },
      { path: 'unidades-medida',    component: MeasurementUnitListComponent },
      { path: 'ingredientes',       component: RawMaterialListComponent },
      { path: 'ingredientes/nuevo', component: RawMaterialFormComponent },
      { path: 'ingredientes/editar/:id', component: RawMaterialFormComponent },

      // ── Account settings ─────────────────────────────────────────────────
      { path: 'cuenta/mi-cuenta',   component: AccountHomeComponent },
      { path: 'cuenta/perfil',      redirectTo: 'cuenta/mi-cuenta', pathMatch: 'full' },
      { path: 'cuenta/seguridad',   component: SecuritySettingsComponent },

      // ── Admin ─────────────────────────────────────────────────────────────
      {
        path: 'admin/usuarios',
        component: UserManagementComponent,
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'cronos/dashboard' }
];
