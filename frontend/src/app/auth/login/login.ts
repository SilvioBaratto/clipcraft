import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form state
  token = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showError = signal(false);

  // Return URL for redirect after successful login
  private returnUrl: string = this.route.snapshot.queryParams['returnUrl'] || '/';

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.isLoading() || !this.token().trim()) {
      return;
    }

    this.isLoading.set(true);
    this.showError.set(false);
    this.errorMessage.set('');

    this.authService.login(this.token().trim()).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading.set(false);

        if (response.authenticated) {
          // Successful authentication - redirect to return URL or home
          this.router.navigate([this.returnUrl], { replaceUrl: true });
        } else {
          // Authentication failed
          this.showError.set(true);
          this.errorMessage.set(response.message || 'Authentication failed');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.showError.set(true);
        this.errorMessage.set(error?.message || 'An unexpected error occurred');
        console.error('Login error:', error);
      },
    });
  }

  /**
   * Handle input changes and clear errors
   */
  onTokenChange(): void {
    if (this.showError()) {
      this.showError.set(false);
      this.errorMessage.set('');
    }
  }

  /**
   * Check if form can be submitted
   */
  canSubmit(): boolean {
    return !this.isLoading() && this.token().trim().length > 0;
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.canSubmit()) {
      this.onSubmit();
    }
  }
}
