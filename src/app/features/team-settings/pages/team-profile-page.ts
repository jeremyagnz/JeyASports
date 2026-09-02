import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageHeader } from '../../../shared/ui/page-header';
import { TeamSettingsNav } from '../components/team-settings-nav';
import { TeamSettingsFacade } from '../team-settings.facade';

@Component({
  selector: 'app-team-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    PageHeader, TeamSettingsNav,
  ],
  templateUrl: './team-profile-page.html',
  styleUrl: './team-profile-page.scss',
})
export class TeamProfilePage {
  readonly facade = inject(TeamSettingsFacade);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    abbreviation: ['', [Validators.required, Validators.maxLength(5)]],
    city: [''],
    league: [''],
    division: [''],
    primaryColor: ['#00c27a', Validators.required],
    secondaryColor: ['#0b1622', Validators.required],
    regulationInnings: [7, [Validators.required, Validators.min(1), Validators.max(15)]],
    fieldersPerLineup: [10, [Validators.required, Validators.min(9), Validators.max(12)]],
  });

  constructor() {
    // Repopulates the form whenever the active team changes.
    effect(() => {
      const team = this.facade.team();
      if (!team) {
        return;
      }
      this.form.reset({
        name: team.name,
        abbreviation: team.abbreviation,
        city: team.city,
        league: team.league,
        division: team.division,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        regulationInnings: team.regulationInnings,
        fieldersPerLineup: team.fieldersPerLineup,
      });
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.facade
      .updateTeam({
        ...value,
        regulationInnings: Number(value.regulationInnings),
        fieldersPerLineup: Number(value.fieldersPerLineup),
      })
      .subscribe({
        next: () => this.facade.notifySuccess('Perfil del equipo actualizado.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }
}
