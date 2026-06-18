-- Migration: 0005_update_meta_metrics.sql
-- Criado em: 2026-06-18
-- Ajuste da tabela meta_daily_metrics: adiciona colunas de nível de anúncio (Ad) e métricas extras; remove conversions_actions e video_play_time

-- 1. Adicionar colunas novas
ALTER TABLE meta_daily_metrics ADD COLUMN ad_id TEXT;
ALTER TABLE meta_daily_metrics ADD COLUMN ad_name TEXT;
ALTER TABLE meta_daily_metrics ADD COLUMN adset_name TEXT;
ALTER TABLE meta_daily_metrics ADD COLUMN link_clicks INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN checkouts_initiated INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN leads INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN new_messaging_connections INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN purchases INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN purchases_conversion_value REAL DEFAULT 0.0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_plays INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_3_sec_views INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_2_sec_continuous_views INTEGER DEFAULT 0;
ALTER TABLE meta_daily_metrics ADD COLUMN video_15_sec_views INTEGER DEFAULT 0;

-- 2. Remover colunas antigas (Suportado no D1/SQLite moderno)
ALTER TABLE meta_daily_metrics DROP COLUMN conversions_actions;
ALTER TABLE meta_daily_metrics DROP COLUMN video_play_time;
