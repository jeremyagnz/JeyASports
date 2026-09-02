import {
  ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { provideDataSource } from './core/config/data-source.providers';
import { DatabaseService } from './data/storage/database.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideDataSource(),
    // Seeds the mock database and restores the persisted session before the
    // first navigation, so guards see a settled authentication state.
    provideAppInitializer(() => {
      inject(DatabaseService).ensureInitialized();
      return firstValueFrom(inject(AuthService).restore());
    }),
  ],
};
