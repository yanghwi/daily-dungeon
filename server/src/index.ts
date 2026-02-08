import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { setupSocketHandlers } from './socket/handlers.js';
import apiRoutes from './api/routes.js';
import discordRoutes from './auth/discord.js';

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

// REST API — Discord OAuth를 먼저 마운트 (requireDb 미들웨어 우회)
app.use('/api/auth', discordRoutes);
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

httpServer.listen(PORT, () => {
  console.log(`Round Midnight server running on port ${PORT}`);
});
