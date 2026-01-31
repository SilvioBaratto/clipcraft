import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Authentication guard for protecting routes
 * Redirects unauthenticated users to login page
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      } else {
        // Store the attempted URL for redirecting after login
        const returnUrl = state.url;
        router.navigate(['/login'], {
          queryParams: { returnUrl },
          replaceUrl: true,
        });
        return false;
      }
    }),
  );
};

/**
 * Guest guard for login page - redirects authenticated users away from login
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      } else {
        // User is already authenticated, redirect to home
        router.navigate(['/'], { replaceUrl: true });
        return false;
      }
    }),
  );
};
