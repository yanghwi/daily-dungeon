-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "discordId" TEXT,
    "discordUsername" TEXT,
    "discordAvatar" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'pin',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunResult" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "wavesCleared" INTEGER NOT NULL,
    "totalWaves" INTEGER NOT NULL DEFAULT 10,
    "highlights" JSONB NOT NULL,
    "dailySeedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "survived" BOOLEAN NOT NULL,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "damageTaken" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RunParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySeed" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unlockable" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" JSONB NOT NULL,

    CONSTRAINT "Unlockable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUnlock" (
    "userId" TEXT NOT NULL,
    "unlockableId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserUnlock_pkey" PRIMARY KEY ("userId","unlockableId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_pin_key" ON "User"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE INDEX "User_pin_idx" ON "User"("pin");

-- CreateIndex
CREATE INDEX "User_discordId_idx" ON "User"("discordId");

-- CreateIndex
CREATE INDEX "RunResult_dailySeedId_idx" ON "RunResult"("dailySeedId");

-- CreateIndex
CREATE INDEX "RunResult_createdAt_idx" ON "RunResult"("createdAt");

-- CreateIndex
CREATE INDEX "RunParticipant_userId_idx" ON "RunParticipant"("userId");

-- CreateIndex
CREATE INDEX "RunParticipant_runId_idx" ON "RunParticipant"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySeed_date_key" ON "DailySeed"("date");

-- CreateIndex
CREATE INDEX "DailySeed_date_idx" ON "DailySeed"("date");

-- CreateIndex
CREATE INDEX "UserUnlock_userId_idx" ON "UserUnlock"("userId");

-- AddForeignKey
ALTER TABLE "RunResult" ADD CONSTRAINT "RunResult_dailySeedId_fkey" FOREIGN KEY ("dailySeedId") REFERENCES "DailySeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunParticipant" ADD CONSTRAINT "RunParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunParticipant" ADD CONSTRAINT "RunParticipant_runId_fkey" FOREIGN KEY ("runId") REFERENCES "RunResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUnlock" ADD CONSTRAINT "UserUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
