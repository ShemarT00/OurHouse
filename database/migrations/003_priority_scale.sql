-- 003_priority_scale.sql
-- One priority scale for the whole app: 0 = none, 1 = low, 2 = medium, 3 = high.
-- Matches Server/schema/item.py (Priority) and the generated Client/types/generated.ts.
-- Run against the Supabase project via the SQL editor or supabase CLI

-- The text enum from 001 was never used by any column
DROP TYPE IF EXISTS priority_level;

ALTER TABLE ITEM
    ALTER COLUMN ITEM_PRIORITY TYPE SMALLINT,
    ALTER COLUMN ITEM_PRIORITY SET DEFAULT 0,
    ALTER COLUMN ITEM_PRIORITY SET NOT NULL;

ALTER TABLE ITEM
    DROP CONSTRAINT IF EXISTS ITEM_PRIORITY_RANGE,
    ADD CONSTRAINT ITEM_PRIORITY_RANGE CHECK (ITEM_PRIORITY BETWEEN 0 AND 3);
