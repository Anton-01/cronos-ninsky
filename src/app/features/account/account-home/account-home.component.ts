import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenService } from '../../../core/services/token.service';
import { UserResponse, UpdateProfileRequest } from '../../../core/models/user.model';
import { ErrorResponse } from '../../../core/models/error-response.model';

type ActiveTab = 'profile' | 'security-link';

@Component({
  selector: 'app-account-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './account-home.component.html'
})
export class AccountHomeComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private userService  = inject(UserService);
  private toast        = inject(ToastService);
  private tokenService = inject(TokenService);

  isLoading  = signal(true);
  isSaving   = signal(false);
  user       = signal<UserResponse | null>(null);
  activeTab  = signal<ActiveTab>('profile');

  /** Quick-start checklist state */
  checklistDone = signal({
    profile:   false,
    twoFactor: false,
    password:  false,
  });

  form = this.fb.group({
    username:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    firstName:   ['', [Validators.maxLength(100)]],
    lastName:    ['', [Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.pattern(/^[+]?[0-9]{10,15}$/)]]
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: res => {
        const u = res.data;
        this.user.set(u);
        this.form.patchValue({
          username:    u.username,
          firstName:   u.firstName  ?? '',
          lastName:    u.lastName   ?? '',
          phoneNumber: u.phoneNumber ?? ''
        });
        this.checklistDone.set({
          profile:   !!(u.firstName && u.lastName && u.phoneNumber),
          twoFactor: u.twoFactorEnabled,
          password:  !!u.passwordChangedAt,
        });
        this.isLoading.set(false);
      },
      error: (err: ErrorResponse) => {
        this.isLoading.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudo cargar el perfil.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const v = this.form.value;
    const payload: UpdateProfileRequest = {
      username:    v.username    || undefined,
      firstName:   v.firstName   || undefined,
      lastName:    v.lastName    || undefined,
      phoneNumber: v.phoneNumber || undefined
    };
    this.userService.updateProfile(payload).subscribe({
      next: res => {
        this.isSaving.set(false);
        this.user.set(res.data);
        this.toast.success('Perfil actualizado', 'Los cambios se guardaron correctamente.');
      },
      error: (err: ErrorResponse) => {
        this.isSaving.set(false);
        const detail = err?.details?.join(' ') ?? err?.message ?? 'Error al actualizar.';
        this.toast.error('Error', detail);
      }
    });
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.[0] ?? u.username[0];
    const last  = u.lastName?.[0]  ?? '';
    return (first + last).toUpperCase();
  }

  getDisplayName(): string {
    const u = this.user();
    if (!u) return '';
    if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    return u.username;
  }

  getMemberSince(): string {
    const u = this.user();
    if (!u?.createdAt) return '—';
    return new Date(u.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  }

  getLastLogin(): string {
    const u = this.user();
    if (!u?.lastLoginAt) return '—';
    return new Date(u.lastLoginAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'kt-badge-primary',
      ADMIN:       'kt-badge-danger',
      MANAGER:     'kt-badge-info',
      USER:        'kt-badge-success',
    };
    return map[role] ?? 'kt-badge-secondary';
  }

  get checklistItems() {
    const done = this.checklistDone();
    return [
      {
        key:   'profile',
        done:  done.profile,
        icon:  'ki-filled ki-profile-circle',
        title: 'Completa tu perfil',
        desc:  'Agrega tu nombre completo y número de teléfono.',
        action: () => this.activeTab.set('profile'),
        label:  'Editar perfil',
      },
      {
        key:   'twoFactor',
        done:  done.twoFactor,
        icon:  'ki-filled ki-shield-tick',
        title: 'Activa la verificación en dos pasos',
        desc:  'Protege tu cuenta con autenticación 2FA.',
        route:  '/cronos/cuenta/seguridad',
        label:  'Ir a seguridad',
      },
      {
        key:   'password',
        done:  done.password,
        icon:  'ki-filled ki-lock',
        title: 'Cambia tu contraseña',
        desc:  'Usa una contraseña segura y única.',
        route:  '/cronos/cuenta/seguridad',
        label:  'Cambiar contraseña',
      },
    ];
  }

  get completedCount(): number {
    return this.checklistItems.filter(i => i.done).length;
  }

  get completionPercent(): number {
    return Math.round((this.completedCount / this.checklistItems.length) * 100);
  }
}
