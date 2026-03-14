import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorResponse } from '../models/error-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorBody = error.error as ErrorResponse;
      return throwError(() => errorBody);
    })
  );
};
