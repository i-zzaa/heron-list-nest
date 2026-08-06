-- CreateTable
CREATE TABLE `HistoricoAlteracao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entidade` VARCHAR(191) NOT NULL,
    `entidadeId` INTEGER NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `antes` JSON NULL,
    `depois` JSON NULL,
    `usuarioLogin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HistoricoAlteracao_entidade_entidadeId_createdAt_idx`(`entidade`, `entidadeId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

