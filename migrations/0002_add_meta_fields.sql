-- Migration: 0002_add_meta_fields.sql
-- Criado em: 2026-06-18
-- Adiciona colunas extras do Meta Ads e cria a tabela de relacionamento user_clients para acesso multi-empresa

-- 1. Adicionar colunas extras à tabela meta_daily_metrics
ALTER TABLE meta_daily_metrics ADD COLUMN landing_page_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_play_time REAL NOT NULL DEFAULT 0.0;
ALTER TABLE meta_daily_metrics ADD COLUMN thruplays INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_p25_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_p50_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_p75_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_p95_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_p100_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN comments INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN saves INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN shares INTEGER NOT NULL DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN instagram_followers INTEGER NOT NULL DEFAULT 0;

-- 2. Criar a tabela de relacionamento muitos-para-muitos user_clients
CREATE TABLE IF NOT EXISTS user_clients (
    user_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    PRIMARY KEY (user_id, client_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 3. Migrar os relacionamentos de cliente existentes
INSERT OR IGNORE INTO user_clients (user_id, client_id)
SELECT id, client_id FROM users WHERE client_id IS NOT NULL;
