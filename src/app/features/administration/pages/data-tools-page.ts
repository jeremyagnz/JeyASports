import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { PageHeader } from '../../../shared/ui/page-header';
import { downloadFile } from '../../../shared/utils/csv';
import { AdministrationFacade } from '../administration.facade';
import { AdministrationNav } from '../components/administration-nav';

@Component({
  selector: 'app-data-tools-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, PageHeader,
    AdministrationNav,
  ],
  templateUrl: './data-tools-page.html',
  styleUrl: './data-tools-page.scss',
})
export class DataToolsPage {
  readonly facade = inject(AdministrationFacade);
  private readonly confirm = inject(ConfirmDialogService);

  readonly importPayload = signal('');

  export(): void {
    downloadFile('jeyasports-backup.json', this.facade.exportJson(), 'application/json');
    this.facade.notifySuccess('Respaldo descargado.');
  }

  import(): void {
    const payload = this.importPayload().trim();
    if (!payload) {
      return;
    }
    try {
      this.facade.importJson(payload);
      this.importPayload.set('');
      this.facade.notifySuccess('Datos importados.');
    } catch (error) {
      this.facade.notifyError(error);
    }
  }

  reseed(): void {
    this.confirm
      .confirm({
        title: 'Restablecer datos de demostración',
        message:
          'Se borrarán todos los cambios locales y se volverán a generar los datos de ejemplo.',
        confirmLabel: 'Restablecer',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        try {
          this.facade.reseed();
          this.facade.notifySuccess('Datos de demostración restablecidos.');
        } catch (error) {
          this.facade.notifyError(error);
        }
      });
  }

  onPayloadInput(event: Event): void {
    this.importPayload.set((event.target as HTMLTextAreaElement).value);
  }
}
