-- Código estável (não editável por texto livre) pra Especialidade e
-- StatusEventos, pedido pelo front pra parar de inferir cor/categoria a
-- partir do campo `nome`. Coluna adicionada nullable, populada por linha
-- existente e só então travada NOT NULL + UNIQUE — não dá pra criar
-- direto como NOT NULL numa tabela com dados.

-- AlterTable
ALTER TABLE `Especialidade` ADD COLUMN `codigo` VARCHAR(191) NULL;

UPDATE `Especialidade` SET `codigo` = 'PSICO' WHERE `id` = 1;
UPDATE `Especialidade` SET `codigo` = 'FONO' WHERE `id` = 2;
UPDATE `Especialidade` SET `codigo` = 'TO' WHERE `id` = 3;
UPDATE `Especialidade` SET `codigo` = 'PSICOPEDAG' WHERE `id` = 4;
UPDATE `Especialidade` SET `codigo` = 'MOTRICIDADE' WHERE `id` = 5;
UPDATE `Especialidade` SET `codigo` = 'MUSICOTERAPIA' WHERE `id` = 6;
UPDATE `Especialidade` SET `codigo` = 'NUTRICAO' WHERE `id` = 7;
UPDATE `Especialidade` SET `codigo` = 'FISIO' WHERE `id` = 8;
UPDATE `Especialidade` SET `codigo` = 'TESTE' WHERE `id` = 9;
-- Fallback pra qualquer linha criada depois do levantamento acima e antes
-- desta migration rodar (evita NULL sobrando na hora do MODIFY NOT NULL).
UPDATE `Especialidade` SET `codigo` = CONCAT('ESPECIALIDADE_', `id`) WHERE `codigo` IS NULL;

ALTER TABLE `Especialidade` MODIFY `codigo` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Especialidade_codigo_key` ON `Especialidade`(`codigo`);

-- AlterTable
ALTER TABLE `StatusEventos` ADD COLUMN `codigo` VARCHAR(191) NULL;

UPDATE `StatusEventos` SET `codigo` = 'avisar' WHERE `id` = 1;
UPDATE `StatusEventos` SET `codigo` = 'cancelado_com_antecedencia' WHERE `id` = 2;
UPDATE `StatusEventos` SET `codigo` = 'atestado' WHERE `id` = 3;
UPDATE `StatusEventos` SET `codigo` = 'falta' WHERE `id` = 4;
UPDATE `StatusEventos` SET `codigo` = 'confirmado' WHERE `id` = 5;
UPDATE `StatusEventos` SET `codigo` = 'atendido' WHERE `id` = 6;
UPDATE `StatusEventos` SET `codigo` = 'teste' WHERE `id` = 7;
UPDATE `StatusEventos` SET `codigo` = 'cancelado_terapeuta' WHERE `id` = 8;
UPDATE `StatusEventos` SET `codigo` = 'terapeuta_ferias' WHERE `id` = 9;
UPDATE `StatusEventos` SET `codigo` = 'feriado' WHERE `id` = 10;
UPDATE `StatusEventos` SET `codigo` = 'cancelado_sem_antecedencia' WHERE `id` = 11;
UPDATE `StatusEventos` SET `codigo` = 'cancelado_clinica' WHERE `id` = 12;
UPDATE `StatusEventos` SET `codigo` = 'aguardando_recepcao' WHERE `id` = 13;
UPDATE `StatusEventos` SET `codigo` = CONCAT('status_evento_', `id`) WHERE `codigo` IS NULL;

ALTER TABLE `StatusEventos` MODIFY `codigo` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `StatusEventos_codigo_key` ON `StatusEventos`(`codigo`);
