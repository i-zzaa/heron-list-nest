-- Item 6 dos "pontos menores" (heron-list-web): opção default marcada
-- no próprio cadastro (Periodo/Status/TipoSessao), em vez do front supor
-- qual id é o padrão. Backfill pelos ids que o front já hardcodava
-- (PERIODO.integral=1, STATUS.padrao=2, TIPO_SESSAO.terapeuta=3),
-- confirmados contra os nomes reais no banco.

-- AlterTable
ALTER TABLE `Periodo` ADD COLUMN `padrao` BOOLEAN NOT NULL DEFAULT false;
UPDATE `Periodo` SET `padrao` = true WHERE `id` = 1; -- Integral

-- AlterTable
ALTER TABLE `Status` ADD COLUMN `padrao` BOOLEAN NOT NULL DEFAULT false;
UPDATE `Status` SET `padrao` = true WHERE `id` = 2; -- Padrão

-- AlterTable
ALTER TABLE `TipoSessao` ADD COLUMN `padrao` BOOLEAN NOT NULL DEFAULT false;
UPDATE `TipoSessao` SET `padrao` = true WHERE `id` = 3; -- Terapia
