import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Initials badge; avoids shipping placeholder images with the mock data. */
@Component({
  selector: 'app-player-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.--avatar-size.px]="size()">
      @if (photoUrl()) {
        <img [src]="photoUrl()" [alt]="firstName() + ' ' + lastName()" />
      } @else {
        {{ initials() }}
      }
    </span>
  `,
  styles: `
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--avatar-size, 36px);
      height: var(--avatar-size, 36px);
      border-radius: 50%;
      background: color-mix(in srgb, var(--app-color-accent) 22%, transparent);
      color: var(--app-color-accent);
      font-weight: 800;
      font-size: calc(var(--avatar-size, 36px) * 0.38);
      letter-spacing: 0.02em;
      overflow: hidden;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class PlayerAvatar {
  readonly firstName = input('');
  readonly lastName = input('');
  readonly photoUrl = input('');
  readonly size = input(36);

  readonly initials = computed(
    () => `${this.firstName().charAt(0)}${this.lastName().charAt(0)}`.toUpperCase() || '?',
  );
}
