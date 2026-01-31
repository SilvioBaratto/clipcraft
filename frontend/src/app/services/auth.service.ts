import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthRequest {
  token: string;
}

export interface AuthResponse {
  authenticated: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_ENDPOINT = `${environment.apiUrl}auth/validate`;
  private readonly TOKEN_KEY = 'app_auth_token';
  private readonly AUTH_STATUS_KEY = 'app_auth_status';

  // Reactive authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getStoredAuthStatus());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Signal for components that prefer signals
  public isAuthenticated = signal(this.getStoredAuthStatus());

  constructor(private http: HttpClient) {
    // Sync signal with BehaviorSubject
    this.isAuthenticated$.subscribe((status) => {
      this.isAuthenticated.set(status);
    });
  }

  /**
   * Authenticate user with token
   */
  login(token: string): Observable<AuthResponse> {
    const authRequest: AuthRequest = { token };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<AuthResponse>(this.AUTH_ENDPOINT, authRequest, { headers }).pipe(
      tap((response) => {
        if (response.authenticated) {
          this.setAuthenticationStatus(true);
          this.storeToken(token);
        }
      }),
      catchError((error) => {
        console.error('Authentication error:', error);
        this.setAuthenticationStatus(false);
        this.clearStorage();

        // Return a standardized error response
        return of({
          authenticated: false,
          message: error?.error?.message || error?.message || 'Authentication failed',
        });
      }),
    );
  }

  /**
   * Log out the user
   */
  logout(): void {
    this.setAuthenticationStatus(false);
    this.clearStorage();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticatedSync(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Validate current session (optional method for checking token validity)
   */
  validateSession(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.login(token).pipe(
      map((response) => response.authenticated),
      catchError(() => {
        this.logout();
        return of(false);
      }),
    );
  }

  /**
   * Private helper methods
   */
  private setAuthenticationStatus(status: boolean): void {
    this.isAuthenticatedSubject.next(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.AUTH_STATUS_KEY, status.toString());
    }
  }

  private getStoredAuthStatus(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.AUTH_STATUS_KEY);
      return stored === 'true';
    }
    return false;
  }

  private storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.AUTH_STATUS_KEY);
    }
  }
}
