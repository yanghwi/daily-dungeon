import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { setupSocketHandlers } from './socket/handlers.js';
import apiRoutes from './api/routes.js';
import { prisma } from './db/client.js';

const FIXED_USERS = [
  { displayName: '최양휘', pin: '910531' },
  { displayName: '송동우', pin: '910530' },
  { displayName: '홍솔',   pin: '911125' },
  { displayName: '정경훈', pin: '910403' },
];

async function seedFixedUsers() {
  if (!prisma) return;
  for (const u of FIXED_USERS) {
    await prisma.user.upsert({
      where: { pin: u.pin },
      update: { displayName: u.displayName },
      create: { displayName: u.displayName, pin: u.pin },
    });
  }
  console.log('[Seed] Fixed users ensured');
}

const app = express();
const httpServer = createServer(app);

function getAllowedOrigins(): string[] {
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    return clientUrl.split(',').map((url) => url.trim());
  }
  return ['http://localhost:5173', 'http://localhost:3000'];
}

const allowedOrigins = getAllowedOrigins();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Round Midnight' });
});

// REST API
app.use('/api', apiRoutes);

// Socket.io 핸들러 설정
setupSocketHandlers(io);

// 프로덕션: 클라이언트 정적 파일 서빙
const clientDist = path.resolve('../client/dist');
app.use(express.static(clientDist));
// SPA 폴백: API/소켓이 아닌 모든 GET → index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`Round Midnight server running on port ${PORT}`);
  await seedFixedUsers();
});
