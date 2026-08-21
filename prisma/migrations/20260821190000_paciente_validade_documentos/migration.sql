-- Validade de documentos do paciente (pedido do usuário): datas de emissão
-- do Plano Terapêutico e do Laudo Médico. Vencimento (Plano: +1 ano, Laudo:
-- +6 meses) é sempre calculado a partir daqui, não gravado.
ALTER TABLE `Paciente` ADD COLUMN `dataEmissaoLaudoMedico` VARCHAR(191) NULL,
    ADD COLUMN `dataEmissaoPlanoTerapeutico` VARCHAR(191) NULL;
