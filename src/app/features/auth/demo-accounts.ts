export interface DemoAccount {
  readonly email: string;
  readonly label: string;
  readonly description: string;
}

/** Quick-access accounts so every role can be tried without a real backend. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'owner@halcones.dev', label: 'Owner · Halcones', description: 'Acceso completo' },
  { email: 'admin@halcones.dev', label: 'Admin · Halcones', description: 'Gestiona jugadores, juegos y estadísticas' },
  { email: 'viewer@halcones.dev', label: 'Viewer · Halcones', description: 'Solo lectura' },
  { email: 'owner@centellas.dev', label: 'Owner · Centellas', description: 'Otro equipo, datos aislados' },
  { email: 'multi@jeyasports.dev', label: 'Multi-equipo', description: 'Admin en Halcones y viewer en Centellas' },
];
