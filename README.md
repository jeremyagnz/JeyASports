# JeyA Sports

Plataforma web de estadísticas para equipos de softball, construida con Angular.

> **Fase 1 (actual):** aplicación completamente funcional con datos simulados
> (mock data + `localStorage`). **Fase 2:** se sustituirá la capa de datos por
> Supabase/PostgreSQL sin reconstruir la interfaz.

## Comandos

| Comando         | Descripción                                   |
| --------------- | --------------------------------------------- |
| `npm start`     | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Compilación de producción en `dist/jeyasports` |
| `npm test`      | Pruebas unitarias (Vitest a través de Angular CLI) |

## Cuentas de demostración

El acceso es simulado: basta con el correo, sin contraseña.

| Correo                    | Rol                                     |
| ------------------------- | --------------------------------------- |
| `owner@halcones.dev`      | OWNER (Halcones)                        |
| `admin@halcones.dev`      | ADMIN (Halcones)                        |
| `viewer@halcones.dev`     | VIEWER (Halcones)                       |
| `owner@centellas.dev`     | OWNER (Centellas)                       |
| `multi@jeyasports.dev`    | ADMIN en Halcones y VIEWER en Centellas |

## Arquitectura

```
Component  →  Facade  →  Service  →  Repository (interfaz)  →  Mock data + localStorage
```

- Los componentes solo consumen *facades*; nunca acceden a repositorios,
  a JSON ni a `localStorage`.
- Cada repositorio se inyecta mediante un `InjectionToken`
  (`src/app/data/repositories/abstract/tokens.ts`) y se conecta en
  `src/app/core/config/data-source.providers.ts`. En Fase 2 solo cambia ese
  archivo para apuntar a implementaciones de Supabase.
- Todos los repositorios devuelven `Observable` y simulan latencia, para que la
  llegada de la red no obligue a cambiar firmas ni componentes.
- Multi-equipo desde el inicio: cada consulta exige `teamId`, imitando lo que
  después hará *row level security* en PostgreSQL.
- Las estadísticas derivadas (AVG, OBP, OPS, ERA, WHIP…) nunca se almacenan: se
  calculan con funciones puras en `src/app/core/domain/stats-calculator.ts`.
- Los roles (`OWNER`, `ADMIN`, `VIEWER`) son de experiencia de usuario en Fase 1;
  la seguridad real llegará con las políticas RLS de Fase 2.

## Estructura

```
src/app/
  core/       autenticación, contextos, guards, permisos, cálculo de estadísticas
  shared/     componentes de UI, pipes y utilidades reutilizables
  data/       modelos, repositorios (abstractos y mock), datos semilla y almacenamiento
  features/   auth, dashboard, players, stats, leaders, games, game-day,
              schedule, seasons, team-settings, administration
  layout/     shell de la aplicación, selector de equipo y de temporada
  styles/     tokens de diseño e identidad visual propia
```

## Datos

Los datos de demostración se generan de forma determinista (semilla fija) para
dos equipos completos, y se guardan en `localStorage` bajo el espacio de nombres
`jeyasports:v1:*`. Desde **Administración → Datos** se pueden exportar, importar
o restablecer.
