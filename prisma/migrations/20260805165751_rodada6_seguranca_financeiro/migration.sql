-- AlterTable
ALTER TABLE `Calendario` ADD COLUMN `valorSessaoDevolutivaSnapshot` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Baixa_usuarioId_idx` ON `Baixa`(`usuarioId`);

-- CreateIndex
CREATE INDEX `Baixa_dataEvento_idx` ON `Baixa`(`dataEvento`);

-- CreateIndex
CREATE UNIQUE INDEX `Baixa_eventoId_key` ON `Baixa`(`eventoId`);

-- CreateIndex
CREATE INDEX `Calendario_terapeutaId_start_idx` ON `Calendario`(`terapeutaId`, `start`);

-- CreateIndex
CREATE INDEX `Calendario_pacienteId_idx` ON `Calendario`(`pacienteId`);

-- CreateIndex
CREATE INDEX `Calendario_groupId_idx` ON `Calendario`(`groupId`);

-- CreateIndex
CREATE UNIQUE INDEX `Especialidade_nome_key` ON `Especialidade`(`nome`);

-- CreateIndex
CREATE UNIQUE INDEX `Funcao_nome_especialidadeId_key` ON `Funcao`(`nome`, `especialidadeId`);

-- CreateIndex
CREATE UNIQUE INDEX `StatusEventos_nome_key` ON `StatusEventos`(`nome`);

