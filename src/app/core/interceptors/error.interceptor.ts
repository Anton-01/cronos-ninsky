import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { ErrorResponse } from '../models/error-response.model';
import { ApiResponse } from '../models/api-response.model';
import { TokenResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// Module-level singletons to coordinate concurrent 401 responses
let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only intercept 401s that are NOT from refresh or login itself
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        return handle401(req, next, tokenService, router, http);
      }

      const errorBody = error.error as ErrorResponse;
      return throwError(() => errorBody);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  router: Router,
  http: HttpClient
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      clearAndRedirect(tokenService, router);
      return throwError(() => ({ message: 'No refresh token available' }));
    }

    return http
      .post<ApiResponse<TokenResponse>>(
        `${environment.apiUrl}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        switchMap(res => {
          isRefreshing = false;
          tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
          refreshSubject.next(res.data.accessToken);
          return next(cloneWithToken(req, res.data.accessToken));
        }),
        catchError(err => {
          isRefreshing = false;
          clearAndRedirect(tokenService, router);
          return throwError(() => err?.error as ErrorResponse);
        })
      );
  }

  // Another request already triggered a refresh — wait for the new token
  return refreshSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(cloneWithToken(req, token!)))
  );
}

function cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function clearAndRedirect(tokenService: TokenService, router: Router): void {
  tokenService.clearTokens();
  router.navigate(['/auth/login']);
}
