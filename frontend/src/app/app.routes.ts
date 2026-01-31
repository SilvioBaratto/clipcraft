import { Routes } from '@angular/router';
// import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public login route
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
    // canActivate: [guestGuard],
    title: 'Login',
  },

  // Application routes
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout').then((m) => m.LayoutComponent),
    // canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
        title: 'Home - ClipCraft',
      },
      {
        path: 'project/:id',
        loadComponent: () =>
          import('./pages/project-detail/project-detail').then((m) => m.ProjectDetailComponent),
        title: 'Project - ClipCraft',
      },
    ],
  },

  // Wildcard redirect
  {
    path: '**',
    redirectTo: '',
  },
];
