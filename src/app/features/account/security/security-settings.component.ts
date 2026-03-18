import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenService } from '../../../core/services/token.service';
import { ChangePasswordRequest, TwoFactorSetupResponse } from '../../../core/models/auth.model';
import { UserResponse } from '../../../core/models/user.model';
import { ActiveSession, LoginHistoryEntry } from '../../../core/models/session.model';
import { ErrorResponse } from '../../../core/models/error-response.model';
import { passwordStrengthValidator, passwordMatchValidator } from '../../../shared/validators/password.validator';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security-settings.component.html'
})
export class SecuritySettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private toast = inject(ToastService);

  // ── State ──────────────────────────────────────────────────────────────────
  currentUser       = signal<UserResponse | null>(null);
  sessions          = signal<ActiveSession[]>([]);
  loginHistory      = signal<LoginHistoryEntry[]>([]);
  twoFactorSetup    = signal<TwoFactorSetupResponse | null>(null);

  isPasswordSaving  = signal(false);
  is2FALoading      = signal(false);
  is2FAVerifying    = signal(false);
  isSessionsLoading = signal(true);
  isHistoryLoading  = signal(true);
  revokingTokenId   = signal<string | null>(null);
  show2FAModal      = signal(false);
  show2FADisable    = signal(false);
  showCurrentPw     = signal(false);
  showNewPw         = signal(false);

  // ── Password change form ──────────────────────────────────────────────────
  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword:     ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  // ── 2FA PIN form (for enable confirmation / disable) ─────────────────────
  pinForm = this.fb.group({
    code: [null as number | null, [Validators.required, Validators.min(100000), Validators.max(999999)]]
  });

  get pf() { return this.passwordForm.controls; }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();
    this.loadHistory();
  }

  private loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: res => this.currentUser.set(res.data),
      error: () => {}
    });
  }

  loadSessions(): void {
    this.isSessionsLoading.set(true);
    this.authService.getActiveSessions().subscribe({
      next: res => {
        this.sessions.set(res.data);
        this.isSessionsLoading.set(false);
      },
      error: () => this.isSessionsLoading.set(false)
    });
  }

  loadHistory(): void {
    this.isHistoryLoading.set(true);
    this.authService.getLoginHistory().subscribe({
      next: res => {
        this.loginHistory.set(res.data);
        this.isHistoryLoading.set(false);
      },
      error: () => this.isHistoryLoading.set(false)
    });
  }

  // ── Change password ───────────────────────────────────────────────────────
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isPasswordSaving.set(true);

    const v = this.passwordForm.value;
    const payload: ChangePasswordRequest = {
      currentPassword: v.currentPassword!,
      newPassword:     v.newPassword!,
      confirmPassword: v.confirmPassword!
    };

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.isPasswordSaving.set(false);
        this.passwordForm.reset();
        this.toast.success('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente.');
      },
      error: (err: ErrorResponse) => {
        this.isPasswordSaving.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudo cambiar la contraseña.');
      }
    });
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────
  enable2FA(): void {
    this.is2FALoading.set(true);
    this.authService.setup2FA().subscribe({
      next: res => {
        this.is2FALoading.set(false);
        this.twoFactorSetup.set(res.data);
        this.show2FAModal.set(true);
        this.pinForm.reset();
      },
      error: (err: ErrorResponse) => {
        this.is2FALoading.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudo iniciar la configuración 2FA.');
      }
    });
  }

  confirm2FASetup(): void {
    if (this.pinForm.invalid) {
      this.pinForm.markAllAsTouched();
      return;
    }

    this.is2FAVerifying.set(true);
    this.authService.verify2FA({ code: Number(this.pinForm.value.code) }).subscribe({
      next: () => {
        this.is2FAVerifying.set(false);
        this.show2FAModal.set(false);
        this.twoFactorSetup.set(null);
        this.toast.success('2FA activado', 'La autenticación de dos factores está habilitada.');
        this.loadProfile();
      },
      error: (err: ErrorResponse) => {
        this.is2FAVerifying.set(false);
        this.toast.error('Código incorrecto', err?.message ?? 'El código no es válido.');
      }
    });
  }

  disable2FA(): void {
    if (this.pinForm.invalid) {
      this.pinForm.markAllAsTouched();
      return;
    }

    this.is2FAVerifying.set(true);
    this.authService.disable2FA({ code: Number(this.pinForm.value.code) }).subscribe({
      next: () => {
        this.is2FAVerifying.set(false);
        this.show2FADisable.set(false);
        this.pinForm.reset();
        this.toast.success('2FA desactivado', 'La autenticación de dos factores fue deshabilitada.');
        this.loadProfile();
      },
      error: (err: ErrorResponse) => {
        this.is2FAVerifying.set(false);
        this.toast.error('Código incorrecto', err?.message ?? 'El código no es válido.');
      }
    });
  }

  openDisable2FA(): void {
    this.pinForm.reset();
    this.show2FADisable.set(true);
  }

  // ── Session management ────────────────────────────────────────────────────
  revokeSession(session: ActiveSession): void {
    this.revokingTokenId.set(session.tokenId);
    this.authService.revokeSession(session.refreshToken).subscribe({
      next: () => {
        this.revokingTokenId.set(null);
        this.sessions.update(list => list.filter(s => s.tokenId !== session.tokenId));
        this.toast.success('Sesión revocada', 'La sesión fue cerrada correctamente.');
      },
      error: (err: ErrorResponse) => {
        this.revokingTokenId.set(null);
        this.toast.error('Error', err?.message ?? 'No se pudo revocar la sesión.');
      }
    });
  }
}
