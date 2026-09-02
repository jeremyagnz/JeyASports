import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toAppError } from '../errors/app-error';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500, panelClass: 'app-snackbar-success' });
  }

  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500 });
  }

  error(error: unknown): void {
    this.snackBar.open(toAppError(error).message, 'Cerrar', {
      duration: 6000,
      panelClass: 'app-snackbar-error',
    });
  }
}
