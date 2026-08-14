-- Igual ao padrão de Localidade/Funcao: desativar em vez de excluir.
-- Sem essa coluna, PUT /especialidade com "ativo": false descartava o
-- campo silenciosamente (fora do whitelist de buildCreatePayload) e o
-- registro continuava aparecendo em GET /especialidade.

-- AlterTable
ALTER TABLE `Especialidade` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
