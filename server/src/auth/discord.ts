import { Router } from 'express';
import { prisma } from '../db/client.js';
import { signToken, authMiddleware } from './jwt.js';

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? '';
const CLIENT_URL = process.env.CLIENT_URL?.split(',')[0]?.trim() ?? 'http://localhost:5173';

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_AUTHORIZE = 'https://discord.com/oauth2/authorize';
const DISCORD_TOKEN = 'https://discord.com/api/oauth2/token';

// GET /api/auth/discord — Discord 인증 페이지로 리다이렉트
router.get('/discord', (_req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
    res.status(503).json({ error: 'Discord OAuth not configured' });
    return;
  }

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`${DISCORD_AUTHORIZE}?${params.toString()}`);
});

// GET /api/auth/discord/callback — 인가 코드 → 토큰 교환 → 유저 생성/업데이트 → 클라이언트 리다이렉트
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code required' });
    return;
  }

  try {
    // 1. 인가 코드 → 액세스 토큰
    const tokenRes = await fetch(DISCORD_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Discord token exchange failed:', err);
      res.redirect(`${CLIENT_URL}?auth_error=token_exchange_failed`);
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // 2. 액세스 토큰 → 유저 정보
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.redirect(`${CLIENT_URL}?auth_error=user_fetch_failed`);
      return;
    }

    const discordUser = await userRes.json() as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
    };

    // 3. DB에서 유저 찾기 또는 생성
    if (!prisma) {
      res.redirect(`${CLIENT_URL}?auth_error=database_unavailable`);
      return;
    }
    let user = await prisma.user.findUnique({ where: { discordId: discordUser.id } });

    if (user) {
      // 기존 Discord 유저: 정보 업데이트
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discordUsername: discordUser.global_name ?? discordUser.username,
          discordAvatar: discordUser.avatar,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // 새 Discord 유저: 생성
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      user = await prisma.user.create({
        data: {
          displayName: discordUser.global_name ?? discordUser.username,
          pin,
          discordId: discordUser.id,
          discordUsername: discordUser.global_name ?? discordUser.username,
          discordAvatar: discordUser.avatar,
          authProvider: 'discord',
        },
      });
    }

    // 4. JWT 발급 → 클라이언트로 리다이렉트
    const token = signToken({ userId: user.id, displayName: user.displayName });
    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id,
      displayName: user.displayName,
      pin: user.pin,
      authProvider: user.authProvider,
      discordUsername: user.discordUsername,
    }));

    res.redirect(`${CLIENT_URL}?token=${token}&user=${userJson}`);
  } catch (err) {
    console.error('Discord OAuth error:', err);
    res.redirect(`${CLIENT_URL}?auth_error=server_error`);
  }
});

// POST /api/auth/link — 기존 PIN 유저에 Discord 계정 링크
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { discordId, discordUsername, discordAvatar } = req.body;

    if (!discordId) {
      res.status(400).json({ error: 'discordId is required' });
      return;
    }

    if (!prisma) {
      res.status(503).json({ error: 'Database not available' });
      return;
    }

    // 해당 Discord ID가 이미 다른 유저에 연결되었는지 확인
    const existing = await prisma.user.findUnique({ where: { discordId } });
    if (existing && existing.id !== userId) {
      res.status(409).json({ error: 'Discord account already linked to another user' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        discordId,
        discordUsername,
        discordAvatar,
        authProvider: 'discord',
      },
    });

    const token = signToken({ userId: user.id, displayName: user.displayName });
    res.json({ token, user: { id: user.id, displayName: user.displayName, pin: user.pin } });
  } catch (err) {
    console.error('Link error:', err);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

export default router;
