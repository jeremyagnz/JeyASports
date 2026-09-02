import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { provideDataSource } from '../../../core/config/data-source.providers';
import { DatabaseService } from '../../../data/storage/database.service';
import { DashboardPage } from './dashboard-page';

/** Smoke test: the dashboard renders real seeded data through the facades. */
describe('DashboardPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideDataSource(), provideRouter([])] });
    TestBed.inject(DatabaseService).ensureInitialized();
    await firstValueFrom(TestBed.inject(AuthService).login('owner@halcones.dev'));
  });

  it('renders the season summary for the signed-in team', async () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    // Mock repositories emit after a simulated network delay.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (fixture.componentInstance.recentGames().length > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      fixture.detectChanges();
    }

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Récord');
    expect(fixture.componentInstance.recentGames().length).toBeGreaterThan(0);
    expect(text).toContain('Halcones');
  });
});
