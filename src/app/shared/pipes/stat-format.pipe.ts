import { Pipe, PipeTransform } from '@angular/core';
import { formatAvg, formatInnings, formatRate2 } from '../utils/format';

/** Formats rate stats the way box scores do: `.325`, never `0.325`. */
@Pipe({ name: 'avg' })
export class AvgPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatAvg(value);
  }
}

/** Two-decimal rate stats such as ERA and WHIP. */
@Pipe({ name: 'rate2' })
export class Rate2Pipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatRate2(value);
  }
}

/** Renders innings pitched from a raw out count, e.g. 17 outs -> `5.2`. */
@Pipe({ name: 'innings' })
export class InningsPipe implements PipeTransform {
  transform(outs: number | null | undefined): string {
    return formatInnings(outs);
  }
}
