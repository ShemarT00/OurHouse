-- 001_initial_tables.sql
-- Initial table definitions for OurHouse
-- Run against the Supabase project via the SQL editor or supabase CLI

-- ---------------------------------------------------------------------------
-- Priority enum
-- ---------------------------------------------------------------------------
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ---------------------------------------------------------------------------
-- USER
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "USER" (
    USER_ID          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USER_NAME        VARCHAR(255)    NOT NULL,
    USER_EMAIL       VARCHAR(255)    NOT NULL UNIQUE,
    USER_INVITE_CODE VARCHAR(12)     NOT NULL UNIQUE,
    USER_CREATED_AT  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- HOUSEHOLD
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS HOUSEHOLD (
    HOUS_ID         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    HOUS_NAME       VARCHAR(255)    NOT NULL,
    HOUS_CREATED_AT TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- MEMBER  (join: USER <-> HOUSEHOLD)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MEMBER (
    MEMB_ID           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MEMB_USER_ID      BIGINT          NOT NULL REFERENCES "USER"(USER_ID)     ON DELETE CASCADE,
    MEMB_HOUSEHOLD_ID BIGINT          NOT NULL REFERENCES HOUSEHOLD(HOUS_ID)  ON DELETE CASCADE,
    MEMB_IS_ADMIN     BOOLEAN         NOT NULL DEFAULT FALSE,
    MEMB_CREATED_AT   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    MEMB_FIRST_NAME   VARCHAR(255)    NOT NULL,
    MEMB_LAST_NAME    VARCHAR(255)    NOT NULL,
    UNIQUE (MEMB_USER_ID, MEMB_HOUSEHOLD_ID)
);

-- ---------------------------------------------------------------------------
-- STORE  (optional purchase location referenced by ITEM)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS STORE (
    STOR_ID         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    STOR_NAME       VARCHAR(255)    NOT NULL,
    STOR_CREATED_AT TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- SHOPPINGLIST
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SHOPPINGLIST (
    SHOP_ID           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    SHOP_NAME         VARCHAR(255)    NOT NULL,
    SHOP_HOUSEHOLD_ID BIGINT          NOT NULL REFERENCES HOUSEHOLD(HOUS_ID) ON DELETE CASCADE,
    SHOP_CREATED_AT   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    SHOP_TYPE_CODE    VARCHAR(3)      NOT NULL DEFAULT 'GEN' -- 'GEN' for general, 'PER' for personal, etc.
);

-- ---------------------------------------------------------------------------
-- ITEM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ITEM (
    ITEM_ID         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ITEM_NAME       VARCHAR(255)    NOT NULL,
    ITEM_PRIORITY   priority_level  NOT NULL DEFAULT 'MEDIUM',
    ITEM_LIST_ID    BIGINT          NOT NULL REFERENCES SHOPPINGLIST(SHOP_ID) ON DELETE CASCADE,
    ITEM_STORE_ID   BIGINT                   REFERENCES STORE(STOR_ID)        ON DELETE SET NULL,
    ITEM_QUANTITY   INT,
    ITEM_NOTES      TEXT,
    ITEM_BOUGHT     BOOLEAN         NOT NULL DEFAULT FALSE,
    ITEM_CREATED_AT TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS NOTIFICATION (
    NOTI_ID         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    NOTI_USER_ID    BIGINT          NOT NULL REFERENCES "USER"(USER_ID)     ON DELETE CASCADE,
    NOTIF_TYPE       VARCHAR(3)     NOT NULL,
    NOTIF_TYPE_DESC  VARCHAR(255)    NULLABLE, 
    NOTI_MESSAGE    TEXT            NOT NULL,
    NOTI_READ       BOOLEAN         NOT NULL DEFAULT FALSE,
    NOTI_CREATED_AT TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

