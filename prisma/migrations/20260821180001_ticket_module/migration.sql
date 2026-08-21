-- Módulo Ticket (cadastro simples id+nome) + vínculo opcional em Baixa.

-- AlterTable
ALTER TABLE `Baixa` ADD COLUMN `ticketId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Tags de permissão novas (aditivas, sem grant a nenhum grupo/perfil ainda
-- — grant é decisão explícita do usuário, seguindo o mesmo cuidado já
-- combinado nas rodadas anteriores de segurança).
INSERT INTO `Permissao` (`id`, `cod`, `descricao`) VALUES
  (559, 'CADASTRO_TICKET', 'Tab de informação de ticket'),
  (560, 'CADASTRO_TICKET_BOTAO_CADASTRAR', 'Botão de cadastro de ticket'),
  (561, 'CADASTRO_TICKET_LISTA_BOTAO_EDITAR', 'Botão de edição do item da lista de tickets'),
  (562, 'CADASTRO_TICKET_LISTA_BOTAO_EXCLUIR', 'Botão de exclusão do item da lista de tickets'),
  (563, 'AGENDA_BAIXA_FILTRO_SELECT_TICKET', 'Campo select de ticket no filtro de baixa');
