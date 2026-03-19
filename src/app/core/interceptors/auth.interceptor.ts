import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/** URLs that must NOT receive a Bearer token (public endpoints). */
const PUBLIC_URLS = ['/auth/refresh', '/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);

  // X-Requested-With tells Spring Security to respond with 401/403 JSON
  // instead of redirecting to the OAuth2 login page (302 → CORS error).
  const reqWithXhr = req.clone({
    setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  const isPublic = PUBLIC_URLS.some(url => reqWithXhr.url.includes(url));
  if (isPublic) return next(reqWithXhr);

  const token = tokenService.getAccessToken();
  if (!token) return next(reqWithXhr);

  return next(
    reqWithXhr.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
