-- Item 4 do pedido do front (heron-list-web): cor pronta pra badge de
-- status, mesmo padrão de Especialidade.cor. Default neutro pra todo
-- status (#94a3b8, mesmo cinza já usado como fallback em
-- agenda.service.ts) — só "Cancelado *" ganha backfill de cor real
-- aqui, porque já existe precedente inequívoco no código
-- (agenda.service.ts usa '#f87171' pra evento cancelado). Os demais
-- ficam com o default e são customizáveis manualmente pelo cadastro.

-- AlterTable
ALTER TABLE `StatusEventos` ADD COLUMN `cor` VARCHAR(191) NOT NULL DEFAULT '#94a3b8';

UPDATE `StatusEventos` SET `cor` = '#f87171' WHERE `nome` LIKE '%ancelad%';
