/**
 * Guards against out-of-order responses when a facade re-queries while a
 * previous request is still in flight.
 */
export class LatestRequest {
  private current = 0;

  start(): number {
    this.current += 1;
    return this.current;
  }

  isCurrent(token: number): boolean {
    return token === this.current;
  }
}
