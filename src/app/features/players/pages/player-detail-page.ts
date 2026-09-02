import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { battingRates, pitchingRates } from '../../../core/domain/stats-calculator';
import { SeasonContextService } from '../../../core/context/season-context.service';
import {
  BattingStatLine, FieldingStatLine, Game, PitchingStatLine, POSITION_LABELS, Player,
} from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PlayerAvatar } from '../../../shared/ui/player-avatar';
import { StatCard } from '../../../shared/ui/stat-card';
import { StatColumn, StatTable } from '../../../shared/ui/stat-table';
import { formatAvg, formatInnings, formatRate2 } from '../../../shared/utils/format';
import { GamesFacade } from '../../games/games.facade';
import { StatsFacade } from '../../stats/stats.facade';
import { PlayersFacade } from '../players.facade';

@Component({
  selector: 'app-player-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatTabsModule, RouterLink, EmptyState, PlayerAvatar, StatCard,
    StatTable,
  ],
  templateUrl: './player-detail-page.html',
  styleUrl: './player-detail-page.scss',
})
export class PlayerDetailPage {
  private readonly playersFacade = inject(PlayersFacade);
  private readonly statsFacade = inject(StatsFacade);
  private readonly gamesFacade = inject(GamesFacade);
  readonly seasonContext = inject(SeasonContextService);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  readonly positionLabels = POSITION_LABELS;

  private readonly id$ = toObservable(this.id);

  readonly player = toSignal<Player | null>(
    this.id$.pipe(
      switchMap((id) => this.playersFacade.getById(id).pipe(catchError(() => of(null)))),
    ),
    { initialValue: null },
  );

  private readonly seasonStats = toSignal(
    combineLatest([this.id$, toObservable(this.seasonContext.activeSeasonId)]).pipe(
      switchMap(([id, seasonId]) =>
        seasonId
          ? combineLatest({
              batting: this.statsFacade.playerBatting(id),
              pitching: this.statsFacade.playerPitching(id),
              fielding: this.statsFacade.playerFielding(id),
              battingLog: this.statsFacade.playerBattingGameLog(id),
              pitchingLog: this.statsFacade.playerPitchingGameLog(id),
            }).pipe(catchError(() => of(null)))
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly batting = computed<BattingStatLine | null>(() => this.seasonStats()?.batting ?? null);
  readonly pitching = computed<PitchingStatLine | null>(() => this.seasonStats()?.pitching ?? null);
  readonly fielding = computed<FieldingStatLine | null>(() => this.seasonStats()?.fielding ?? null);
  readonly battingLog = computed(() => this.seasonStats()?.battingLog ?? []);
  readonly pitchingLog = computed(() => this.seasonStats()?.pitchingLog ?? []);

  readonly battingSummary = computed(() => {
    const line = this.batting();
    if (!line) {
      return null;
    }
    const rates = battingRates(line);
    return {
      avg: formatAvg(rates.avg),
      obp: formatAvg(rates.obp),
      slg: formatAvg(rates.slg),
      ops: formatAvg(rates.ops),
      hr: line.hr,
      rbi: line.rbi,
      h: line.h,
      gp: line.gp,
    };
  });

  readonly pitchingSummary = computed(() => {
    const line = this.pitching();
    if (!line || line.outs === 0) {
      return null;
    }
    const rates = pitchingRates(line);
    return {
      era: formatRate2(rates.era),
      whip: formatRate2(rates.whip),
      ip: formatInnings(line.outs),
      so: line.so,
      record: `${line.w}-${line.l}`,
    };
  });

  /** Game log rows resolve their opponent through the games facade. */
  readonly gameLogColumns = computed<StatColumn<BattingStatLine>[]>(() => {
    const games = new Map(this.gamesFacade.games().map((game) => [game.id, game] as const));
    const describe = (line: BattingStatLine): string => {
      const game = line.gameId ? games.get(line.gameId) : undefined;
      return game ? `${game.date} ${this.opponentLabel(game)}` : (line.gameId ?? '');
    };
    return [
      { key: 'game', label: 'Juego', value: describe, sticky: true },
      { key: 'ab', label: 'VB', value: (row) => row.ab },
      { key: 'r', label: 'C', value: (row) => row.r },
      { key: 'h', label: 'H', value: (row) => row.h },
      { key: 'doubles', label: '2B', value: (row) => row.doubles },
      { key: 'hr', label: 'HR', value: (row) => row.hr },
      { key: 'rbi', label: 'CI', value: (row) => row.rbi },
      { key: 'bb', label: 'BB', value: (row) => row.bb },
      { key: 'so', label: 'K', value: (row) => row.so },
      {
        key: 'avg',
        label: 'AVG',
        value: (row) => battingRates(row).avg,
        display: (row) => formatAvg(battingRates(row).avg),
      },
    ];
  });

  private opponentLabel(game: Game): string {
    const opponent = this.gamesFacade.opponentById().get(game.opponentId);
    const prefix = game.homeAway === 'HOME' ? 'vs' : '@';
    return `${prefix} ${opponent?.abbreviation ?? '???'}`;
  }
}
