import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginRequest } from '../../../core/models/auth.model';
import { ErrorResponse } from '../../../core/models/error-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isLoading = signal(false);
  requiresTwoFactor = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    twoFactorCode: [null as number | null]
  });

  get username(): AbstractControl { return this.form.get('username')!; }
  get password(): AbstractControl { return this.form.get('password')!; }
  get twoFactorCode(): AbstractControl { return this.form.get('twoFactorCode')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const payload: LoginRequest = {
      username: this.form.value.username!,
      password: this.form.value.password!,
      ...(this.requiresTwoFactor() && this.form.value.twoFactorCode
        ? { twoFactorCode: Number(this.form.value.twoFactorCode) }
        : {})
    };

    this.authService.login(payload).subscribe({
      next: res => {
        this.isLoading.set(false);

        if (res.data.requiresTwoFactor) {
          this.requiresTwoFactor.set(true);
          this.toast.show('success', 'Verificación requerida', 'Ingresa el código de tu aplicación autenticadora.');
          return;
        }

        this.tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
        this.tokenService.saveUserInfo(res.data.username, res.data.email);
        this.toast.success('Bienvenido', `Hola, ${res.data.username}!`);
        this.router.navigate(['/cronos/dashboard']);
      },
      error: (err: ErrorResponse) => {
        this.isLoading.set(false);
        this.toast.error('Error al iniciar sesión', err?.message ?? 'Credenciales incorrectas.');
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginWithFacebook(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/facebook';
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
