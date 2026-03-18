import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RegisterRequest } from '../../../core/models/auth.model';
import { ErrorResponse } from '../../../core/models/error-response.model';
import { passwordStrengthValidator, passwordMatchValidator } from '../../../shared/validators/password.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirm = signal(false);

  form = this.fb.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/)
        ]
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      firstName: ['', [Validators.maxLength(100)]],
      lastName:  ['', [Validators.maxLength(100)]],
      phoneNumber: [
        '',
        [Validators.pattern(/^[+]?[0-9]{10,15}$/)]
      ],
      password: ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') }
  );

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const v = this.form.value;
    const payload: RegisterRequest = {
      username:    v.username!,
      email:       v.email!,
      password:    v.password!,
      firstName:   v.firstName  || undefined,
      lastName:    v.lastName   || undefined,
      phoneNumber: v.phoneNumber || undefined
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('¡Cuenta creada!', 'Ya puedes iniciar sesión con tus credenciales.');
        this.router.navigate(['/auth/login']);
      },
      error: (err: ErrorResponse) => {
        this.isLoading.set(false);
        const detail = err?.details?.join(' ') ?? err?.message ?? 'Error al registrar.';
        this.toast.error('Error en el registro', detail);
      }
    });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
  toggleConfirm(): void  { this.showConfirm.update(v => !v); }
}
