-- Novo campo booleano em StatusEventos, mesmo padrão de cobrar/ativo:
-- indica se esse status representa um atendimento realizado.

-- AlterTable
ALTER TABLE `StatusEventos` ADD COLUMN `atender` BOOLEAN NOT NULL DEFAULT false;
