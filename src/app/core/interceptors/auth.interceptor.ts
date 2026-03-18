import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/** URLs that must NOT receive a Bearer token (public endpoints). */
const PUBLIC_URLS = ['/auth/refresh', '/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);

  const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
  if (isPublic) return next(req);

  const token = tokenService.getAccessToken();
  if (!token) return next(req);

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
