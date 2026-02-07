import { Router } from 'express';
import { prisma } from '../db/client.js';
import { signToken, authMiddleware } from '../auth/jwt.js';

const router = Router();

// ─── DB guard 미들웨어 ───
function requireDb(_req: any, res: any, next: any) {
  if (!prisma) {
    res.status(503).json({ error: 'Database not available' });
    return;
  }
  next();
}

router.use(requireDb);

// ─── PIN 생성 유틸 ───
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── 인증 API ───

// POST /api/auth/register — 임시 유저 생성
router.post('/auth/register', async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      res.status(400).json({ error: 'displayName is required' });
      return;
    }

    const name = displayName.trim().slice(0, 20);

    // 유니크 PIN 생성 (충돌 시 재시도)
    let pin = generatePin();
    for (let i = 0; i < 10; i++) {
      const exists = await prisma.user.findUnique({ where: { pin } });
      if (!exists) break;
      pin = generatePin();
    }

    const user = await prisma.user.create({
      data: { displayName: name, pin },
    });

    const token = signToken({ userId: user.id, displayName: user.displayName });
    res.json({ token, user: { id: user.id, displayName: user.displayName, pin: user.pin } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/pin — PIN으로 로그인
router.post('/auth/pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string') {
      res.status(400).json({ error: 'pin is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { pin } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // lastSeenAt 갱신
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

    const token = signToken({ userId: user.id, displayName: user.displayName });
    res.json({ token, user: { id: user.id, displayName: user.displayName, pin: user.pin } });
  } catch (err) {
    console.error('PIN login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/me — 내 프로필 + 통계
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { userId } = (req as any).user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        pin: true,
        authProvider: true,
        discordUsername: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 통계 집계
    const stats = await prisma.runParticipant.aggregate({
      where: { userId },
      _count: true,
      _sum: { damageDealt: true, damageTaken: true },
    });

    const clears = await prisma.runResult.count({
      where: { participants: { some: { userId } }, result: 'clear' },
    });

    res.json({
      user,
      stats: {
        totalRuns: stats._count,
        clears,
        totalDamageDealt: stats._sum.damageDealt ?? 0,
        totalDamageTaken: stats._sum.damageTaken ?? 0,
      },
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// GET /api/runs — 내 런 히스토리
router.get('/runs', authMiddleware, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const participations = await prisma.runParticipant.findMany({
      where: { userId },
      orderBy: { run: { createdAt: 'desc' } },
      take: limit,
      include: {
        run: {
          select: {
            id: true,
            roomCode: true,
            result: true,
            wavesCleared: true,
            totalWaves: true,
            highlights: true,
            dailySeedId: true,
            createdAt: true,
          },
        },
      },
    });

    const runs = participations.map((p: any) => ({
      runId: p.run.id,
      result: p.run.result,
      wavesCleared: p.run.wavesCleared,
      totalWaves: p.run.totalWaves,
      highlights: p.run.highlights,
      isDaily: !!p.run.dailySeedId,
      characterName: p.characterName,
      background: p.background,
      survived: p.survived,
      damageDealt: p.damageDealt,
      damageTaken: p.damageTaken,
      createdAt: p.run.createdAt,
    }));

    res.json({ runs });
  } catch (err) {
    console.error('Run history error:', err);
    res.status(500).json({ error: 'Failed to load runs' });
  }
});

// GET /api/daily/today — 오늘의 데일리 시드
router.get('/daily/today', async (_req, res) => {
  try {
    // KST 기준 오늘 날짜 (UTC+9)
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().split('T')[0];
    const todayKST = new Date(dateStr + 'T00:00:00.000Z');

    let seed = await prisma.dailySeed.findUnique({ where: { date: todayKST } });

    if (!seed) {
      // 시드 생성: 날짜 기반 deterministic seed
      const seedValue = `daily-${dateStr}-${Math.random().toString(36).slice(2, 10)}`;
      seed = await prisma.dailySeed.create({
        data: { date: todayKST, seed: seedValue },
      });
    }

    // 오늘의 참가 수
    const runCount = await prisma.runResult.count({ where: { dailySeedId: seed.id } });

    res.json({ date: dateStr, seedId: seed.id, runCount });
  } catch (err) {
    console.error('Daily seed error:', err);
    res.status(500).json({ error: 'Failed to get daily seed' });
  }
});

// GET /api/daily/leaderboard — 오늘의 데일리 결과
router.get('/daily/leaderboard', async (_req, res) => {
  try {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().split('T')[0];
    const todayKST = new Date(dateStr + 'T00:00:00.000Z');

    const seed = await prisma.dailySeed.findUnique({ where: { date: todayKST } });
    if (!seed) {
      res.json({ date: dateStr, runs: [] });
      return;
    }

    const runs = await prisma.runResult.findMany({
      where: { dailySeedId: seed.id },
      orderBy: [{ wavesCleared: 'desc' }, { createdAt: 'asc' }],
      take: 20,
      include: {
        participants: {
          select: { characterName: true, background: true, survived: true },
        },
      },
    });

    res.json({
      date: dateStr,
      runs: runs.map((r: any) => ({
        id: r.id,
        result: r.result,
        wavesCleared: r.wavesCleared,
        participants: r.participants,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// GET /api/unlocks — 내 해금 현황
router.get('/unlocks', authMiddleware, async (req, res) => {
  try {
    const { userId } = (req as any).user;

    const unlocks = await prisma.userUnlock.findMany({
      where: { userId },
      select: { unlockableId: true, unlockedAt: true },
    });

    res.json({ unlocks });
  } catch (err) {
    console.error('Unlocks error:', err);
    res.status(500).json({ error: 'Failed to load unlocks' });
  }
});

export default router;
