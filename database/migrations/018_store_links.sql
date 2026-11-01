-- 018_store_links.sql
-- Store links (#41): a store can be linked to a retailer (an online shop
-- OurHouse knows how to open and search) or have its own website, or neither.
--   * RETAILER is the same for every household and is filled only by
--     migrations: members can read it but never write it (ADR 0003).
--     Retailers are never deleted, only retired; a store linked to a retired
--     retailer behaves as if it has no link.
--   * STORE gains STOR_RETAILER_KEY and STOR_WEBSITE; at most one is set.
--   * Any member of a store's household may edit its name and link. Only those
--     columns can be updated, so a store cannot move to another household.
--     Deleting stores is still refused (no DELETE policy).
-- Search addresses were checked by hand on 2026-11-01. A retailer whose site
-- cannot search by item name has a NULL RETA_SEARCH_URL and opens its homepage.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Retailers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS RETAILER (
    RETA_KEY VARCHAR(32) PRIMARY KEY,
    RETA_NAME VARCHAR(255) NOT NULL,
    RETA_HOMEPAGE VARCHAR(2048) NOT NULL,
    RETA_SEARCH_URL VARCHAR(2048),
    RETA_RETIRED BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT RETAILER_KEY_FORMAT CHECK (RETA_KEY ~ '^[a-z0-9-]+$'),
    CONSTRAINT RETAILER_HOMEPAGE_HTTPS CHECK (RETA_HOMEPAGE ~ '^https://'),
    CONSTRAINT RETAILER_SEARCH_URL_HAS_QUERY CHECK (RETA_SEARCH_URL ~ '^https://.*\{query\}')
);

INSERT INTO RETAILER (RETA_KEY, RETA_NAME, RETA_HOMEPAGE, RETA_SEARCH_URL) VALUES
    ('aldi',       'Aldi',        'https://www.aldi.co.uk',          'https://www.aldi.co.uk/results?q={query}'),
    ('asda',       'Asda',        'https://www.asda.com',            'https://groceries.asda.com/search/{query}'),
    ('tesco',      'Tesco',       'https://www.tesco.com',           'https://www.tesco.com/groceries/en-GB/search?query={query}'),
    ('sainsburys', 'Sainsbury''s', 'https://www.sainsburys.co.uk',   'https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}'),
    ('lidl',       'Lidl',        'https://www.lidl.co.uk',          'https://www.lidl.co.uk/q/search?q={query}'),
    ('morrisons',  'Morrisons',   'https://www.morrisons.com',       'https://groceries.morrisons.com/search?q={query}'),
    ('waitrose',   'Waitrose',    'https://www.waitrose.com',        'https://www.waitrose.com/ecom/shop/search?searchTerm={query}'),
    ('iceland',    'Iceland',     'https://www.iceland.co.uk',       'https://www.iceland.co.uk/search?q={query}'),
    ('coop',       'Co-op',       'https://www.coop.co.uk',          NULL),
    ('mands',      'M&S',         'https://www.marksandspencer.com', 'https://www.marksandspencer.com/l/search?searchTerm={query}'),
    ('ocado',      'Ocado',       'https://www.ocado.com',           'https://www.ocado.com/search?entry={query}')
ON CONFLICT (RETA_KEY) DO UPDATE SET
    RETA_NAME = EXCLUDED.RETA_NAME,
    RETA_HOMEPAGE = EXCLUDED.RETA_HOMEPAGE,
    RETA_SEARCH_URL = EXCLUDED.RETA_SEARCH_URL;

-- Members read retailers; there are no INSERT, UPDATE or DELETE policies, so
-- every write through Supabase is refused.
ALTER TABLE RETAILER ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS retailer_select_authenticated ON RETAILER;
CREATE POLICY retailer_select_authenticated ON RETAILER
    FOR SELECT TO authenticated
    USING (TRUE);

-- ---------------------------------------------------------------------------
-- Store links
-- ---------------------------------------------------------------------------
ALTER TABLE STORE ADD COLUMN IF NOT EXISTS STOR_RETAILER_KEY VARCHAR(32) REFERENCES RETAILER(RETA_KEY) ON DELETE RESTRICT;
ALTER TABLE STORE ADD COLUMN IF NOT EXISTS STOR_WEBSITE VARCHAR(2048);

ALTER TABLE STORE DROP CONSTRAINT IF EXISTS STORE_ONE_LINK;
ALTER TABLE STORE ADD CONSTRAINT STORE_ONE_LINK CHECK (STOR_RETAILER_KEY IS NULL OR STOR_WEBSITE IS NULL);

ALTER TABLE STORE DROP CONSTRAINT IF EXISTS STORE_WEBSITE_HTTP;
ALTER TABLE STORE ADD CONSTRAINT STORE_WEBSITE_HTTP CHECK (STOR_WEBSITE ~* '^https?://');

-- ---------------------------------------------------------------------------
-- Any member of a store's household may edit its name and link, and nothing else
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON STORE FROM anon, authenticated;
GRANT UPDATE (STOR_NAME, STOR_RETAILER_KEY, STOR_WEBSITE) ON STORE TO authenticated;

DROP POLICY IF EXISTS store_update_member ON STORE;
CREATE POLICY store_update_member ON STORE
    FOR UPDATE TO authenticated
    USING (public.is_member(STOR_HOUSEHOLD_ID))
    WITH CHECK (public.is_member(STOR_HOUSEHOLD_ID));

COMMIT;
