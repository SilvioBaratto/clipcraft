import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { LucideIconConfig } from 'lucide-angular';

import { routes } from './app.routes';
import { ICON_PROVIDER } from './icons';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    ICON_PROVIDER,
    {
      provide: LucideIconConfig,
      useFactory: () => {
        const cfg = new LucideIconConfig();
        cfg.size = 16;
        cfg.strokeWidth = 1.5;
        return cfg;
      },
    },
  ],
};
