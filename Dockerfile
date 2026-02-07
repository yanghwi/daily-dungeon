FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니페스트만 먼저 복사 (레이어 캐시 활용)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN npm ci

# Prisma 스키마 복사 + 클라이언트 생성
COPY server/prisma/ ./server/prisma/
RUN cd server && npx prisma generate

# 소스 복사 & 빌드
COPY shared/ ./shared/
COPY server/ ./server/

RUN npm run build --workspace=@round-midnight/server

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN npm ci --omit=dev

# Prisma 스키마 복사 & 클라이언트 생성
COPY server/prisma/ ./server/prisma/
RUN cd server && npx prisma generate

# 빌드 결과물과 shared 소스 복사
COPY shared/ ./shared/
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "run", "start", "--workspace=@round-midnight/server"]
