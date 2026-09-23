# AGENTS.md — Guía para agentes de código

Instrucciones para asistentes de IA (Cursor, Copilot, etc.) que trabajen en este repositorio.

## Proyecto

**geminis-labs-web-page** — aplicación web SvelteKit de Geminis Labs: landing, autenticación, control panel, billing y productos (Nexus, Orion).

## Stack

| Capa        | Tecnología                           |
| ----------- | ------------------------------------ |
| Framework   | SvelteKit 2, Svelte 5                |
| Build       | Vite 7                               |
| Estilos     | Tailwind CSS 4                       |
| Tests       | Vitest (unit), Playwright (e2e, WIP) |
| Lint/format | ESLint 9 flat, Prettier (tabs)       |
| Runtime     | Node.js 22                           |
| Deploy      | Docker + adapter-node → EC2          |

## Estructura

```text
src/lib/services/     # API clients y lógica de negocio — testear aquí primero
src/lib/stores/       # authStore, userStore, toastStore, etc.
src/lib/components/   # UI reutilizable
src/lib/utils/        # Helpers puros
src/lib/observability/ # Telemetría operacional (OpenTelemetry: traces, métricas, logs) — no PII
src/routes/           # File-based routing de SvelteKit
docs/architecture/    # Mapa de módulos y APIs consumidas
observability/        # Stack LGTM local y dashboards Grafana
```

Antes de modificar integraciones con backend, lee `docs/architecture/modules/README.md` y el módulo correspondiente.

## Convenciones

- **Lenguaje:** JavaScript (`.js`, `.svelte`). No migrar a TypeScript sin RFC explícito.
- **Formato:** Tabs, comillas simples, `printWidth: 100`, sin trailing comma (ver `.prettierrc`).
- **Imports:** Usar alias `$lib/` de SvelteKit.
- **Variables no usadas:** Prefijo `_` si son intencionales (`argsIgnorePattern` en ESLint).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- **Alcance:** Cambios mínimos y enfocados. No reformatear ni refactorizar código no relacionado con la tarea.

## Comandos obligatorios antes de terminar

```bash
npm run validate
```

Equivalente: `npm run lint`, `npm run check`, `npm run test:coverage`, `npm run build`.

Si tocaste `src/lib/**`, verifica cobertura:

```bash
npm run test:coverage
```

Umbrales en CI (`src/lib/` servicios, stores, utils, config): **90%** líneas/funciones/statements, **70%** ramas. Ver `vite.config.js` y `docs/GOVERNANCE.md`.

## Módulos sensibles

Trata con cuidado extra (tests + revisión humana):

- `src/lib/services/authService.js` — autenticación, tokens, refresh
- `src/lib/services/billingService.js` — facturación, Stripe
- `src/lib/services/apiClient.js` — capa HTTP central
- `src/routes/control-panel/billing/**` — UI de pagos y facturas
- `src/routes/auth/**` — login, registro, recuperación de contraseña

## Variables de entorno

Prefijo `VITE_` — expuestas al cliente. **Nunca** pongas secretos en variables `VITE_*`.

Referencias en `README.md` y `.env.example` si existe.

## Lo que NO debes hacer

- Commitear secretos, `.env`, o credenciales
- Agregar dependencias sin justificación clara
- Desactivar reglas de ESLint o tests para "hacer pasar" el CI
- Cambiar `svelte/no-navigation-without-resolve` sin entender el impacto en SvelteKit 2
- Modificar workflows de deploy sin coordinación explícita

## Documentación humana

- Contribución: [CONTRIBUTING.md](CONTRIBUTING.md)
- Seguridad: [SECURITY.md](SECURITY.md)
- Threat model: [docs/security/threat-model.md](docs/security/threat-model.md)
- ADRs: [docs/adr/](docs/adr/)
- Arquitectura por módulo: [docs/architecture/modules/](docs/architecture/modules/)

## Release y changelog

- **Changelog:** `CHANGELOG.md` — actualizar `[Unreleased]` en PRs con cambios de release note
- **Pre-push:** valida rama (`feature/`, `fix/`, `chore/`, etc.) y presencia de changelog vs `origin/develop`
- **CI:** `.github/workflows/ci.yml` — lint, check, coverage (umbrales), build, audit, e2e, Gitleaks, Semgrep, OSV-Scanner
- **Deploy:** `.github/workflows/deploy.yml` — solo tags `v*.*.*`; ver [docs/RELEASE.md](docs/RELEASE.md)

## PRs

Base branch: `develop`. Usar plantilla en `.github/pull_request_template.md`.
