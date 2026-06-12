-- Profile safety defaults and aspiration anonymity integration
-- Uses conditional DDL to support mixed rollout states safely.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_preferences'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_preferences'
        AND column_name = 'anonymous_publishing_default'
    ) THEN
      ALTER TABLE "user_preferences"
        ADD COLUMN "anonymous_publishing_default" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_preferences'
        AND column_name = 'default_story_visibility'
    ) THEN
      ALTER TABLE "user_preferences"
        ADD COLUMN "default_story_visibility" "story_privacy" NOT NULL DEFAULT 'PUBLIC';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_preferences'
        AND column_name = 'default_aspiration_visibility'
    ) THEN
      ALTER TABLE "user_preferences"
        ADD COLUMN "default_aspiration_visibility" "aspiration_privacy" NOT NULL DEFAULT 'PUBLIC';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'aspirations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'aspirations'
        AND column_name = 'is_anonymous'
    ) THEN
      ALTER TABLE "aspirations"
        ADD COLUMN "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'aspirations'
        AND indexname = 'aspirations_is_anonymous_idx'
    ) THEN
      CREATE INDEX "aspirations_is_anonymous_idx" ON "aspirations"("is_anonymous");
    END IF;
  END IF;
END $$;
