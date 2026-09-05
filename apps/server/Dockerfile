FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install

COPY apps/server/ ./apps/server/
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter @quiz-forge/shared build
RUN pnpm --filter @quiz-forge/server prisma:generate
RUN pnpm --filter @quiz-forge/server build

FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/package.json ./
COPY --from=base /app/apps/server/package.json ./apps/server/
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY .npmrc ./
RUN pnpm install --prod --ignore-scripts

COPY --from=base /app/apps/server/dist ./apps/server/dist
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/apps/server/prisma ./apps/server/prisma
RUN pnpm --filter @quiz-forge/server prisma:generate

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["node", "dist/main"]
