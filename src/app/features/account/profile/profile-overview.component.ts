import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserResponse, UpdateProfileRequest } from '../../../core/models/user.model';
import { ErrorResponse } from '../../../core/models/error-response.model';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-overview.component.html'
})
export class ProfileOverviewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  isLoading = signal(true);
  isSaving = signal(false);
  user = signal<UserResponse | null>(null);

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
        this.user.set(res.data);
        this.form.patchValue({
          username:    res.data.username,
          firstName:   res.data.firstName ?? '',
          lastName:    res.data.lastName  ?? '',
          phoneNumber: res.data.phoneNumber ?? ''
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
}
