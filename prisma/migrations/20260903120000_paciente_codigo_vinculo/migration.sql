-- Código de vínculo do paciente com a conta do responsável no app PEIgo.
-- Opcional (pacientes existentes não têm) e único, para o resgate no app
-- poder achar um único paciente a partir do código digitado.
ALTER TABLE `Paciente` ADD COLUMN `codigoVinculo` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Paciente_codigoVinculo_key` ON `Paciente`(`codigoVinculo`);
