-- CreateTable
CREATE TABLE `Convenio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paciente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `responsavel` VARCHAR(191) NOT NULL,
    `dataNascimento` VARCHAR(191) NOT NULL,
    `convenioId` INTEGER NOT NULL,
    `statusPacienteCod` VARCHAR(191) NOT NULL,
    `tipoSessaoId` INTEGER NOT NULL,
    `statusId` INTEGER NULL,
    `carteirinha` VARCHAR(191) NOT NULL DEFAULT '',
    `emAtendimento` BOOLEAN NOT NULL DEFAULT false,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusPaciente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cod` VARCHAR(191) NOT NULL DEFAULT 'therapy',

    UNIQUE INDEX `StatusPaciente_cod_key`(`cod`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vaga` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `dataContato` VARCHAR(191) NOT NULL,
    `periodoId` INTEGER NOT NULL,
    `observacao` VARCHAR(191) NULL,
    `naFila` BOOLEAN NOT NULL DEFAULT true,
    `dataSaiuFila` VARCHAR(191) NULL,
    `devolutiva` BOOLEAN NOT NULL DEFAULT false,
    `dataDevolutiva` VARCHAR(191) NULL,
    `dataVoltouAba` VARCHAR(191) NULL,
    `diff` VARCHAR(191) NULL,
    `dataRetorno` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Vaga_pacienteId_key`(`pacienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VagaOnEspecialidade` (
    `agendado` BOOLEAN NOT NULL DEFAULT false,
    `dataAgendado` VARCHAR(191) NULL,
    `vagaId` INTEGER NOT NULL,
    `especialidadeId` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
    `km` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (`vagaId`, `especialidadeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Periodo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Especialidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NOT NULL DEFAULT '#000000',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoSessao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `login` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `perfilId` INTEGER NOT NULL,
    `grupoPermissaoId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `casa` VARCHAR(191) NOT NULL,
    `sala` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusEventos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cobrar` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Frequencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Modalidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Intervalo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Funcao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `especialidadeId` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Terapeuta` (
    `usuarioId` INTEGER NOT NULL,
    `especialidadeId` INTEGER NOT NULL,
    `fazDevolutiva` BOOLEAN NULL DEFAULT true,
    `cargaHoraria` JSON NULL,

    UNIQUE INDEX `Terapeuta_usuarioId_key`(`usuarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TerapeutaOnFuncao` (
    `terapeutaId` INTEGER NOT NULL,
    `funcaoId` INTEGER NOT NULL,
    `comissao` DECIMAL(10, 2) NULL DEFAULT 80.00,
    `tipo` VARCHAR(191) NULL DEFAULT 'Fixo',

    PRIMARY KEY (`terapeutaId`, `funcaoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Calendario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` VARCHAR(191) NOT NULL,
    `dataInicio` VARCHAR(191) NOT NULL,
    `dataFim` VARCHAR(191) NOT NULL,
    `start` VARCHAR(191) NOT NULL,
    `end` VARCHAR(191) NULL,
    `diasFrequencia` VARCHAR(191) NOT NULL,
    `exdate` VARCHAR(191) NULL,
    `isExterno` BOOLEAN NOT NULL DEFAULT false,
    `isChildren` BOOLEAN NOT NULL DEFAULT false,
    `km` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `ciclo` VARCHAR(191) NOT NULL,
    `observacao` VARCHAR(191) NULL,
    `pacienteId` INTEGER NOT NULL,
    `modalidadeId` INTEGER NOT NULL,
    `especialidadeId` INTEGER NOT NULL,
    `terapeutaId` INTEGER NOT NULL,
    `funcaoId` INTEGER NOT NULL,
    `localidadeId` INTEGER NOT NULL,
    `statusEventosId` INTEGER NOT NULL,
    `frequenciaId` INTEGER NOT NULL,
    `intervaloId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `valorSessaoSnapshot` DECIMAL(10, 2) NULL,
    `comissaoSnapshot` DECIMAL(10, 2) NULL,
    `tipoComissaoSnapshot` VARCHAR(191) NULL,
    `valorPorKmSnapshot` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permissao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cod` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupoPermissao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupoPermissaoOnPermissao` (
    `grupoPermissaoId` INTEGER NOT NULL,
    `permissaoId` INTEGER NOT NULL,

    PRIMARY KEY (`grupoPermissaoId`, `permissaoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PacienteHistorico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `historico` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Baixa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `terapeutaId` INTEGER NOT NULL,
    `statusEventosId` INTEGER NOT NULL,
    `eventoId` INTEGER NULL,
    `usuarioId` INTEGER NULL,
    `localidadeId` INTEGER NOT NULL,
    `baixa` BOOLEAN NOT NULL DEFAULT false,
    `dataEvento` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Programa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tipoProtocolo` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Protocolo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `protocolo` JSON NOT NULL,
    `protocoloSet` JSON NOT NULL,
    `terapeutaId` INTEGER NULL,
    `pacienteId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sessao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resumo` VARCHAR(191) NOT NULL,
    `calendarioId` INTEGER NULL,
    `sessao` JSON NULL,
    `pacienteId` INTEGER NOT NULL,
    `maintenance` JSON NULL,
    `selectedMaintenanceKeys` JSON NULL,
    `portage` JSON NULL,
    `selectedPortageKeys` JSON NULL,
    `vbmapp` JSON NULL,
    `selectedVBMappKeys` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuiaAmil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroGuia` VARCHAR(191) NOT NULL,
    `tipoGuia` VARCHAR(191) NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `sessaoId` INTEGER NULL,
    `prestadorId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `dadosGuia` JSON NULL,
    `valorTotal` DECIMAL(10, 2) NULL,
    `prontoParaEnvioEm` DATETIME(3) NULL,
    `enviadoEm` DATETIME(3) NULL,
    `processadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `loteId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoteGuia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroLote` VARCHAR(191) NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'CRIADO',
    `protocolo` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `quantidadeGuias` INTEGER NOT NULL DEFAULT 0,
    `xmlEnvio` TEXT NULL,
    `xmlRetorno` TEXT NULL,
    `enviadoEm` DATETIME(3) NULL,
    `consultadoEm` DATETIME(3) NULL,
    `processadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoteGuia_idempotencyKey_key`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoteGuiaItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loteId` INTEGER NOT NULL,
    `guiaId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'AGUARDANDO_LOTE',
    `codigoRetorno` VARCHAR(191) NULL,
    `mensagemRetorno` VARCHAR(191) NULL,
    `valorApresentado` DECIMAL(10, 2) NULL,
    `valorProcessado` DECIMAL(10, 2) NULL,
    `valorGlosado` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuiaAmilHistorico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guiaId` INTEGER NOT NULL,
    `loteId` INTEGER NULL,
    `statusAnterior` VARCHAR(191) NULL,
    `statusNovo` VARCHAR(191) NULL,
    `acao` VARCHAR(191) NULL,
    `mensagem` VARCHAR(191) NULL,
    `detalhes` JSON NULL,
    `usuarioId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransacaoAmil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loteId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `statusHttp` INTEGER NULL,
    `sucesso` BOOLEAN NOT NULL DEFAULT false,
    `tentativa` INTEGER NOT NULL DEFAULT 1,
    `duracaoMs` INTEGER NULL,
    `codigoErro` VARCHAR(191) NULL,
    `mensagemErro` VARCHAR(191) NULL,
    `xmlEnvio` TEXT NULL,
    `xmlRetorno` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeSessao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendarioId` INTEGER NOT NULL,
    `peisIds` VARCHAR(191) NOT NULL,
    `atividades` JSON NULL,
    `selectedKeys` JSON NULL,
    `maintenance` JSON NULL,
    `selectedMaintenanceKeys` JSON NULL,
    `portage` JSON NULL,
    `selectedPortageKeys` JSON NULL,
    `vbmapp` JSON NULL,
    `selectedVbMappKeys` JSON NULL,
    `terapeutaId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AtividadeSessao_calendarioId_key`(`calendarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pei` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `procedimentoEnsinoId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `programaId` INTEGER NOT NULL,
    `terapeutaId` INTEGER NULL,
    `estimuloDiscriminativo` VARCHAR(191) NOT NULL,
    `resposta` VARCHAR(191) NOT NULL,
    `estimuloReforcadorPositivo` VARCHAR(191) NOT NULL,
    `metas` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Portage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `portage` JSON NULL,
    `pacienteId` INTEGER NOT NULL,
    `respostaPortage` JSON NULL,
    `respostaPortageDate` DATETIME(3) NULL,
    `estimuloDiscriminativo` VARCHAR(191) NULL,
    `resposta` VARCHAR(191) NULL,
    `estimuloReforcadorPositivo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VBMappResultado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `respostaSessao` VARCHAR(191) NOT NULL,
    `vbmappId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `estimuloDiscriminativo` VARCHAR(191) NULL,
    `resposta` VARCHAR(191) NULL,
    `estimuloReforcadorPositivo` VARCHAR(191) NULL,
    `procedimentoEnsinoId` INTEGER NULL,
    `subitems` JSON NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VBMappAtividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` TEXT NOT NULL,
    `nivel` INTEGER NOT NULL,
    `programaId` INTEGER NOT NULL,
    `permiteSubitens` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortageAtividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` TEXT NOT NULL,
    `programaId` INTEGER NOT NULL,
    `faixaEtaria` VARCHAR(191) NOT NULL,
    `permiteSubitens` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

