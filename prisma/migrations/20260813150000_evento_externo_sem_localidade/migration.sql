-- Atendimento externo (Calendario.isExterno = true) não tem localidade
-- cadastrada. localidadeId passa a ser opcional em Calendario e Baixa (a
-- baixa herda o mesmo estado do evento que a originou); localExternoDescricao
-- guarda a descrição do local informada pelo usuário nesse caso.

-- DropForeignKey
ALTER TABLE `Baixa` DROP FOREIGN KEY `Baixa_localidadeId_fkey`;

-- DropForeignKey
ALTER TABLE `Calendario` DROP FOREIGN KEY `Calendario_localidadeId_fkey`;

-- DropIndex
DROP INDEX `Baixa_localidadeId_fkey` ON `Baixa`;

-- DropIndex
DROP INDEX `Calendario_localidadeId_fkey` ON `Calendario`;

-- AlterTable
ALTER TABLE `Baixa` ADD COLUMN `localExternoDescricao` VARCHAR(191) NULL,
    MODIFY `localidadeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Calendario` ADD COLUMN `localExternoDescricao` VARCHAR(191) NULL,
    MODIFY `localidadeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_localidadeId_fkey` FOREIGN KEY (`localidadeId`) REFERENCES `Localidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_localidadeId_fkey` FOREIGN KEY (`localidadeId`) REFERENCES `Localidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
