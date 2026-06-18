-- Migration: 0003_add_username.sql
-- Criado em: 2026-06-18
-- Adiciona coluna username na tabela de usuários para permitir login sem e-mail

ALTER TABLE users ADD COLUMN username TEXT;

-- Gerar usernames automáticos a partir da parte local do e-mail
UPDATE users SET username = SUBSTR(email, 1, INSTR(email, '@') - 1);

-- Garantir que usernames sejam únicos adicionando índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
