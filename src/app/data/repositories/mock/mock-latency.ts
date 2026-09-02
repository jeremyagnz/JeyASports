import { Observable, defer, delay, of, throwError } from 'rxjs';
import { environment } from '../../../core/config/environment';
import { AppError, toAppError } from '../../../core/errors/app-error';

/**
 * Wraps a synchronous mock operation so it behaves like a remote call:
 * deferred execution, artificial latency and optional injected failures.
 * Without this the UI would silently rely on synchronous data and break the
 * day a real backend is plugged in.
 */
export function simulate<T>(factory: () => T): Observable<T> {
  const [min, max] = environment.mockLatencyMs;
  const latency = min + Math.random() * Math.max(0, max - min);

  return defer(() => {
    if (environment.mockFailureRate > 0 && Math.random() < environment.mockFailureRate) {
      return throwError(() => new AppError('NETWORK', 'Simulated data source failure.'));
    }
    try {
      return of(factory());
    } catch (error) {
      return throwError(() => toAppError(error));
    }
  }).pipe(delay(latency));
}
