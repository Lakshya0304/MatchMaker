-- CreateTable
CREATE TABLE "matchmakers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchmakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "is_dummy" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "height_cm" INTEGER NOT NULL,
    "marital_status" TEXT NOT NULL DEFAULT 'Never Married',
    "email" TEXT,
    "phone_number" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "city" TEXT NOT NULL,
    "ug_college" TEXT,
    "degree" TEXT,
    "current_company" TEXT,
    "designation" TEXT,
    "annual_income_inr" BIGINT NOT NULL,
    "religion" TEXT NOT NULL,
    "caste" TEXT,
    "mother_tongue" TEXT NOT NULL DEFAULT 'Hindi',
    "diet_preference" TEXT NOT NULL,
    "manglik_status" TEXT NOT NULL DEFAULT 'No',
    "family_values" TEXT NOT NULL DEFAULT 'Moderate',
    "siblings" TEXT,
    "want_kids" TEXT NOT NULL,
    "open_to_relocate" TEXT NOT NULL,
    "open_to_pets" TEXT NOT NULL,
    "journey_status" TEXT NOT NULL DEFAULT 'Onboarding',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "matchmaker_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matchmakers_email_key" ON "matchmakers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_matchmaker_id_fkey" FOREIGN KEY ("matchmaker_id") REFERENCES "matchmakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
