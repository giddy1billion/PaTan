CREATE TABLE IF NOT EXISTS "aspiration_updates" (
  "id" TEXT NOT NULL,
  "aspiration_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "aspiration_updates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aspiration_updates_aspiration_id_created_at_idx"
  ON "aspiration_updates"("aspiration_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "aspiration_updates_author_id_idx"
  ON "aspiration_updates"("author_id");

DO $$
BEGIN
  ALTER TABLE "aspiration_updates"
    ADD CONSTRAINT "aspiration_updates_aspiration_id_fkey"
    FOREIGN KEY ("aspiration_id") REFERENCES "aspirations"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "aspiration_updates"
    ADD CONSTRAINT "aspiration_updates_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
