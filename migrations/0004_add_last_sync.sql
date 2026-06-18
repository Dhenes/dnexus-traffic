-- Migration: 0004_add_last_sync.sql
-- Criado em: 2026-06-18
-- Rastreamento de sincronização por plataforma e cliente para limite de cliques

CREATE TABLE IF NOT EXISTS last_syncs (
    client_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (client_id, platform)
);
