-- ============================================================================
-- Site Rápido — WhatsApp History Tables (imported from wacli.db)
-- Tables: whatsapp_messages, whatsapp_chats, whatsapp_contacts
-- Synced from wacli's local SQLite store into Supabase for structured access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- WHATSAPP_MESSAGES — full message history (sent + received)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  msg_id            TEXT UNIQUE,
  chat_jid          TEXT,
  chat_name         TEXT,
  sender_jid        TEXT,
  sender_name       TEXT,
  ts                BIGINT,
  ts_datetime       TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(ts)) STORED,
  from_me           BOOLEAN DEFAULT FALSE,
  text              TEXT,
  display_text      TEXT,
  quoted_msg_id     TEXT,
  quoted_sender_jid TEXT,
  is_forwarded      BOOLEAN DEFAULT FALSE,
  forwarding_score  INTEGER DEFAULT 0,
  reaction_to_id    TEXT,
  reaction_emoji    TEXT,
  media_type        TEXT,
  media_caption     TEXT,
  filename          TEXT,
  mime_type         TEXT,
  local_path        TEXT,
  downloaded_at     TIMESTAMPTZ,
  revoked           BOOLEAN DEFAULT FALSE,
  deleted_for_me    BOOLEAN DEFAULT FALSE,
  edited            BOOLEAN DEFAULT FALSE,
  edited_ts         BIGINT,
  imported_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_msgs_chat_jid   ON public.whatsapp_messages(chat_jid);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_sender_jid ON public.whatsapp_messages(sender_jid);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_ts         ON public.whatsapp_messages(ts);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_from_me    ON public.whatsapp_messages(from_me);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_ts_dt      ON public.whatsapp_messages(ts_datetime);

-- ---------------------------------------------------------------------------
-- WHATSAPP_CHATS — conversation metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
  jid              TEXT PRIMARY KEY,
  kind             TEXT,
  name             TEXT,
  last_message_ts  BIGINT,
  last_message_dt  TIMESTAMPTZ GENERATED ALWAYS AS (
                     CASE WHEN last_message_ts IS NOT NULL
                          THEN to_timestamp(last_message_ts)
                          ELSE NULL END
                   ) STORED,
  archived         BOOLEAN DEFAULT FALSE,
  pinned           BOOLEAN DEFAULT FALSE,
  muted_until      BIGINT,
  unread           BOOLEAN DEFAULT FALSE,
  unread_count     INTEGER DEFAULT 0,
  imported_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_chats_kind    ON public.whatsapp_chats(kind);
CREATE INDEX IF NOT EXISTS idx_wa_chats_name    ON public.whatsapp_chats(name);
CREATE INDEX IF NOT EXISTS idx_wa_chats_last_ts ON public.whatsapp_chats(last_message_ts);

-- ---------------------------------------------------------------------------
-- WHATSAPP_CONTACTS — contact directory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  jid            TEXT PRIMARY KEY,
  phone          TEXT,
  push_name      TEXT,
  full_name      TEXT,
  first_name     TEXT,
  business_name  TEXT,
  updated_at     TIMESTAMPTZ,
  imported_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone         ON public.whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_push_name     ON public.whatsapp_contacts(push_name);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_business_name ON public.whatsapp_contacts(business_name);

-- ---------------------------------------------------------------------------
-- RLS — same anon-access policy as the CRM tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_chats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_wa_messages" ON public.whatsapp_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_wa_chats"    ON public.whatsapp_chats     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_wa_contacts" ON public.whatsapp_contacts  FOR ALL TO anon USING (true) WITH CHECK (true);
