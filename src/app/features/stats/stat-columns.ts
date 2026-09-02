import { battingRates, fieldingRates, pitchingRates } from '../../core/domain/stats-calculator';
import { BattingStatLine, FieldingStatLine, PitchingStatLine } from '../../data/models';
import { StatColumn } from '../../shared/ui/stat-table';
import { formatAvg, formatInnings, formatRate2 } from '../../shared/utils/format';

export type PlayerNameResolver = (playerId: string) => string;

export function battingColumns(nameOf: PlayerNameResolver): StatColumn<BattingStatLine>[] {
  return [
    { key: 'player', label: 'Jugador', value: (row) => nameOf(row.playerId), sticky: true },
    { key: 'gp', label: 'JJ', tooltip: 'Juegos jugados', value: (row) => row.gp },
    { key: 'pa', label: 'AP', tooltip: 'Apariciones al plato', value: (row) => battingRates(row).pa },
    { key: 'ab', label: 'VB', tooltip: 'Veces al bate', value: (row) => row.ab },
    { key: 'r', label: 'C', tooltip: 'Carreras', value: (row) => row.r },
    { key: 'h', label: 'H', tooltip: 'Hits', value: (row) => row.h },
    { key: 'doubles', label: '2B', value: (row) => row.doubles },
    { key: 'triples', label: '3B', value: (row) => row.triples },
    { key: 'hr', label: 'HR', value: (row) => row.hr },
    { key: 'rbi', label: 'CI', tooltip: 'Carreras impulsadas', value: (row) => row.rbi },
    { key: 'bb', label: 'BB', value: (row) => row.bb },
    { key: 'so', label: 'K', value: (row) => row.so },
    { key: 'sb', label: 'BR', tooltip: 'Bases robadas', value: (row) => row.sb },
    {
      key: 'avg',
      label: 'AVG',
      value: (row) => battingRates(row).avg,
      display: (row) => formatAvg(battingRates(row).avg),
    },
    {
      key: 'obp',
      label: 'OBP',
      value: (row) => battingRates(row).obp,
      display: (row) => formatAvg(battingRates(row).obp),
    },
    {
      key: 'slg',
      label: 'SLG',
      value: (row) => battingRates(row).slg,
      display: (row) => formatAvg(battingRates(row).slg),
    },
    {
      key: 'ops',
      label: 'OPS',
      value: (row) => battingRates(row).ops,
      display: (row) => formatAvg(battingRates(row).ops),
    },
  ];
}

export function pitchingColumns(nameOf: PlayerNameResolver): StatColumn<PitchingStatLine>[] {
  return [
    { key: 'player', label: 'Lanzador', value: (row) => nameOf(row.playerId), sticky: true },
    { key: 'g', label: 'J', value: (row) => row.g },
    { key: 'gs', label: 'JI', tooltip: 'Juegos iniciados', value: (row) => row.gs },
    { key: 'w', label: 'G', tooltip: 'Ganados', value: (row) => row.w },
    { key: 'l', label: 'P', tooltip: 'Perdidos', value: (row) => row.l },
    { key: 'sv', label: 'SV', tooltip: 'Salvamentos', value: (row) => row.sv },
    {
      key: 'ip',
      label: 'IP',
      tooltip: 'Entradas lanzadas',
      value: (row) => row.outs,
      display: (row) => formatInnings(row.outs),
    },
    { key: 'h', label: 'H', value: (row) => row.h },
    { key: 'r', label: 'C', value: (row) => row.r },
    { key: 'er', label: 'CL', tooltip: 'Carreras limpias', value: (row) => row.er },
    { key: 'bb', label: 'BB', value: (row) => row.bb },
    { key: 'so', label: 'K', value: (row) => row.so },
    {
      key: 'era',
      label: 'ERA',
      value: (row) => pitchingRates(row).era,
      display: (row) => formatRate2(pitchingRates(row).era),
    },
    {
      key: 'whip',
      label: 'WHIP',
      value: (row) => pitchingRates(row).whip,
      display: (row) => formatRate2(pitchingRates(row).whip),
    },
  ];
}

export function fieldingColumns(nameOf: PlayerNameResolver): StatColumn<FieldingStatLine>[] {
  return [
    { key: 'player', label: 'Jugador', value: (row) => nameOf(row.playerId), sticky: true },
    { key: 'position', label: 'POS', value: (row) => row.position },
    { key: 'g', label: 'J', value: (row) => row.g },
    {
      key: 'innings',
      label: 'ENT',
      tooltip: 'Entradas defendidas',
      value: (row) => row.outsPlayed,
      display: (row) => formatInnings(row.outsPlayed),
    },
    { key: 'po', label: 'PO', tooltip: 'Outs forzados', value: (row) => row.po },
    { key: 'a', label: 'A', tooltip: 'Asistencias', value: (row) => row.a },
    { key: 'e', label: 'E', tooltip: 'Errores', value: (row) => row.e },
    { key: 'dp', label: 'DP', tooltip: 'Doble plays', value: (row) => row.dp },
    {
      key: 'fpct',
      label: 'FLD%',
      value: (row) => fieldingRates(row).fieldingPct,
      display: (row) => formatAvg(fieldingRates(row).fieldingPct),
    },
  ];
}
