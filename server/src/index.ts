import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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

// REST API
app.use('/api', apiRoutes);
app.use('/api/auth', discordRoutes);

// Socket.io 핸들러 설정
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Round Midnight server running on port ${PORT}`);
});
