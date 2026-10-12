# Miracle Flashcards — monorepo (scaffold)

Monorepo pnpm con workspaces. Solo scaffold: sin lógica de negocio.

- `apps/web` — `@miracle/web`: Vite + React 19 + TypeScript + Tailwind v4
- `packages/shared` — `@miracle/shared`: tipos compartidos

`pnpm-workspace.yaml` y `.npmrc` fijan `minimumReleaseAge` en 1440 min (solo paquetes con más de 1 día).

## Comandos

```
pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm typecheck
```
