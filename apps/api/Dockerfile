# Build de PRODUÇÃO do backend (NestJS) dentro do monorepo pnpm.
#
# Contexto de build é a RAIZ do repo, não esta pasta — o monorepo usa um
# único pnpm-lock.yaml na raiz (pnpm-workspace.yaml: apps/*). Construir:
#
#   docker build -f apps/api/Dockerfile -t ez-starter-kit-api .
#
# `pnpm deploy` (nativo do pnpm workspaces) monta em /out uma pasta
# autocontida só com o output de build + deps de produção do pacote
# @ez-starter-kit/api — sem arrastar apps/web nem devDependencies pra
# imagem final.

FROM node:22.15.0-alpine AS build
RUN apk add --no-cache libpq curl
RUN corepack enable
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN corepack prepare --activate $(node -p "require('./package.json').packageManager")
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
RUN pnpm --filter @ez-starter-kit/api run build
RUN pnpm --filter @ez-starter-kit/api deploy --prod /out

FROM node:22.15.0-alpine AS production
RUN apk add --no-cache libpq curl
WORKDIR /app
ENV NODE_ENV=production
# outDir do tsconfig é `build/`, não `dist/` — checar apps/api/tsconfig.json
# antes de "corrigir" isto de volta.
COPY --from=build /out/build ./build
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
# scripts/migrate-prod.js — roda migrations pendentes ANTES do primeiro
# `node build/src/main` de um deploy (`docker run --rm <imagem> node
# scripts/migrate-prod.js`). Não roda automaticamente no ENTRYPOINT: com mais
# de uma réplica subindo junto, cada uma tentando migrar ao mesmo tempo é
# exatamente o problema que um passo de deploy único evita.
COPY --from=build /out/scripts/migrate-prod.js ./scripts/migrate-prod.js

EXPOSE 3001
CMD ["node", "build/src/main"]
