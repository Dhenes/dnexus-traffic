-- Migration: 0001_init.sql
-- Criado em: 2026-06-18
-- Suporte a Multi-cliente e Autenticação

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client', -- 'admin' ou 'client'
    client_id TEXT, -- nulo para administradores, preenchido para clientes
    created_at INTEGER NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- 3. Tabela de Credenciais por Cliente
CREATE TABLE IF NOT EXISTS ad_credentials (
    id TEXT PRIMARY KEY, -- formato: clientID_platform
    client_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'meta', 'google', 'tiktok'
    account_id TEXT NOT NULL,
    credentials_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- 4. Tabela de Métricas do Meta Ads por Cliente
CREATE TABLE IF NOT EXISTS meta_daily_metrics (
    id TEXT PRIMARY KEY, -- formato: clientID_meta_campaignid_date
    client_id TEXT NOT NULL,
    date TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    reach INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    spend REAL NOT NULL DEFAULT 0.0,
    conversions_actions INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- 5. Tabela de Métricas do Google Ads por Cliente
CREATE TABLE IF NOT EXISTS google_daily_metrics (
    id TEXT PRIMARY KEY, -- formato: clientID_google_campaignid_date
    client_id TEXT NOT NULL,
    date TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0.0,
    conversions REAL NOT NULL DEFAULT 0.0,
    conversions_value REAL NOT NULL DEFAULT 0.0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- 6. Tabela de Métricas do TikTok Ads por Cliente
CREATE TABLE IF NOT EXISTS tiktok_daily_metrics (
    id TEXT PRIMARY KEY, -- formato: clientID_tiktok_campaignid_date
    client_id TEXT NOT NULL,
    date TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    spend REAL NOT NULL DEFAULT 0.0,
    conversion INTEGER NOT NULL DEFAULT 0,
    real_time_conversion INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_meta_client_date ON meta_daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_google_client_date ON google_daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_tiktok_client_date ON tiktok_daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- SEMENTES DE DADOS (SEED)
-- Inserir Clientes Iniciais
INSERT OR IGNORE INTO clients (id, name, created_at) VALUES ('c_alfa', 'Cliente Alfa (Varejo)', 1781754000000);
INSERT OR IGNORE INTO clients (id, name, created_at) VALUES ('c_beta', 'Cliente Beta (SaaS)', 1781754000000);

-- Inserir Usuários Iniciais
-- Senha de teste para todos: admin123 (hash SHA-256: 240aa2472d2875ed53dbf19029e2d6237c412911c87199a0937a2f24524190f4)
INSERT OR IGNORE INTO users (id, email, password_hash, role, client_id, created_at) 
VALUES ('u_admin', 'admin@dnexus.com', '240aa2472d2875ed53dbf19029e2d6237c412911c87199a0937a2f24524190f4', 'admin', NULL, 1781754000000);

INSERT OR IGNORE INTO users (id, email, password_hash, role, client_id, created_at) 
VALUES ('u_alfa', 'alfa@dnexus.com', '240aa2472d2875ed53dbf19029e2d6237c412911c87199a0937a2f24524190f4', 'client', 'c_alfa', 1781754000000);

INSERT OR IGNORE INTO users (id, email, password_hash, role, client_id, created_at) 
VALUES ('u_beta', 'beta@dnexus.com', '240aa2472d2875ed53dbf19029e2d6237c412911c87199a0937a2f24524190f4', 'client', 'c_beta', 1781754000000);
