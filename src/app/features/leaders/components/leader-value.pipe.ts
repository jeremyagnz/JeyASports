import { Pipe, PipeTransform } from '@angular/core';
import { LeaderCategoryDefinition } from '../../../data/models';
import { formatAvg, formatRate2 } from '../../../shared/utils/format';

/** Formats a leader value according to its category definition. */
@Pipe({ name: 'leaderValue' })
export class LeaderValuePipe implements PipeTransform {
  transform(value: number, definition: LeaderCategoryDefinition): string {
    switch (definition.format) {
      case 'rate3':
        return formatAvg(value);
      case 'rate2':
        return formatRate2(value);
      default:
        return String(value);
    }
  }
}
