-- Migration: 0006_add_meta_media_fields.sql
-- Criado em: 2026-06-18
-- Adiciona colunas para miniatura e link de visualização dos anúncios da Meta

ALTER TABLE meta_daily_metrics ADD COLUMN ad_preview_url TEXT;
ALTER TABLE meta_daily_metrics ADD COLUMN ad_thumbnail_url TEXT;
