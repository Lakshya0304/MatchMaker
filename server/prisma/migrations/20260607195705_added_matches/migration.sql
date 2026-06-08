-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "compatibility_score" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "email_intro_snippet" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Suggested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_client_id_candidate_id_key" ON "matches"("client_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
