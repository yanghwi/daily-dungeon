FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니페스트만 먼저 복사 (레이어 캐시 활용)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY shared/package.json ./shared/

RUN npm ci

# Prisma 스키마 복사 + 클라이언트 생성
COPY server/prisma/ ./server/prisma/
RUN cd server && npx prisma generate

# 소스 복사 & 빌드
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

RUN npm run build --workspace=@round-midnight/server
RUN npm run build --workspace=@round-midnight/client

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

# 빌드 결과물 복사
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
# shared: 컴파일된 JS를 사용 (Node.js는 .ts를 직접 실행 불가)
COPY --from=builder /app/server/dist/shared/ ./shared/
# shared/package.json의 main을 .js로 변경
RUN sed -i 's/"main": "types.ts"/"main": "types.js"/' shared/package.json && \
    sed -i 's|"./types.ts"|"./types.js"|' shared/package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && cd .. && npm run start --workspace=@round-midnight/server"]
