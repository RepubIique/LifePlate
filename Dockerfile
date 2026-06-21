FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY patches patches
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN pnpm --filter @lifeplate/shared build && pnpm --filter @lifeplate/api build

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV RUN_MIGRATIONS=true

EXPOSE 3001

CMD ["node", "dist/index.js"]
