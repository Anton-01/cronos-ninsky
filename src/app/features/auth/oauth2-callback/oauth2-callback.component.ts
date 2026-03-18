import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../../core/services/token.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Headless component mounted at /oauth2-callback.
 *
 * The Spring Security OAuth2 backend redirects here after a successful
 * social login with the following query parameters:
 *   ?accessToken=<JWT>&refreshToken=<opaque>
 *
 * NOTE: With HashLocation strategy the backend redirect URI must be
 *   http://localhost:4200/#/oauth2-callback
 * Register this URI in your OAuth2 provider settings.
 */
@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-gray-500">
        <svg class="animate-spin w-8 h-8 text-[#17C653]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="text-sm">Autenticando…</span>
      </div>
    </div>
  `
})
export class OAuth2CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    const accessToken  = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (accessToken && refreshToken) {
      this.tokenService.saveTokens(accessToken, refreshToken);
      this.toast.success('Bienvenido', 'Sesión iniciada correctamente.');
      this.router.navigate(['/cronos/dashboard']);
    } else {
      this.toast.error('Error OAuth2', 'No se recibieron tokens. Intenta de nuevo.');
      this.router.navigate(['/auth/login']);
    }
  }
}
