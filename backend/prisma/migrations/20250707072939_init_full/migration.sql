/*
  Warnings:

  - You are about to drop the column `gameId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Team` table. All the data in the column will be lost.
  - Added the required column `game_id` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "League" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "logo_url" TEXT,
    "game_id" INTEGER NOT NULL,
    CONSTRAINT "League_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "picture_url" TEXT,
    "team_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    CONSTRAINT "Player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "begin_at" DATETIME,
    "end_at" DATETIME,
    "location" TEXT,
    "logo_url" TEXT,
    "league_id" INTEGER,
    "serie_id" INTEGER,
    "serie_name" TEXT,
    "league_name" TEXT,
    "game_id" INTEGER NOT NULL,
    CONSTRAINT "Tournament_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tournament_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_id" INTEGER NOT NULL,
    "league_id" INTEGER NOT NULL,
    "tournament_id" INTEGER,
    "team1_id" INTEGER NOT NULL,
    "team2_id" INTEGER NOT NULL,
    "team1_api_id" INTEGER,
    "team2_api_id" INTEGER,
    "date" DATETIME,
    "status" TEXT,
    "match_type" TEXT,
    "number_of_games" INTEGER,
    "winner_api_id" INTEGER,
    "score_team1" INTEGER,
    "score_team2" INTEGER,
    "slug" TEXT,
    "stage" TEXT,
    CONSTRAINT "Match_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "league_id" INTEGER,
    "game_id" INTEGER NOT NULL,
    "data" JSONB,
    CONSTRAINT "Team_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Team_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "name") SELECT "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "League_api_id_key" ON "League"("api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_api_id_key" ON "Player"("api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_api_id_key" ON "Tournament"("api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_api_id_key" ON "Match"("api_id");
