-- Ticket ganha soft-delete via `ativo`, mesmo padrão de Especialidade:
-- listagem paginada/dropdown/busca só mostram ativo=true; PUT com
-- ativo:false "exclui" sem apagar (baixas antigas continuam com o vínculo).
ALTER TABLE `Ticket` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
