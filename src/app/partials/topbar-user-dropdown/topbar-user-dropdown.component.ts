import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleService } from '../theme-toggle/theme-toggle.service';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-topbar-user-dropdown',
  imports: [RouterLink],
  templateUrl: './topbar-user-dropdown.component.html',
  styleUrl: './topbar-user-dropdown.component.scss'
})
export class TopbarUserDropdownComponent {
  private authService  = inject(AuthService);
  private tokenService = inject(TokenService);
  themeService   = inject(ThemeToggleService);
  effectiveTheme = this.themeService.effectiveTheme;
  setThemeMode   = this.themeService.setThemeMode.bind(this.themeService);

  username = signal(this.tokenService.getUsername());
  email    = signal(this.tokenService.getEmail());

  onThemeToggle(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input && typeof input.checked === 'boolean') {
      this.setThemeMode(input.checked ? 'dark' : 'light');
    }
  }

  onLogout(): void {
    this.authService.performLogout();
  }
}
