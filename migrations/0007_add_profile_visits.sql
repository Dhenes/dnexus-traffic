-- Migration: 0007_add_profile_visits.sql
-- Criado em: 2026-06-18
-- Adiciona coluna de visitantes do perfil Instagram à tabela meta_daily_metrics

ALTER TABLE meta_daily_metrics ADD COLUMN instagram_profile_visits INTEGER DEFAULT 0;
