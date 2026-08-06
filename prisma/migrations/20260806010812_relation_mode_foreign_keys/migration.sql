-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_statusPacienteCod_fkey` FOREIGN KEY (`statusPacienteCod`) REFERENCES `StatusPaciente`(`cod`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_convenioId_fkey` FOREIGN KEY (`convenioId`) REFERENCES `Convenio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_tipoSessaoId_fkey` FOREIGN KEY (`tipoSessaoId`) REFERENCES `TipoSessao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `Status`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vaga` ADD CONSTRAINT `Vaga_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `Periodo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vaga` ADD CONSTRAINT `Vaga_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VagaOnEspecialidade` ADD CONSTRAINT `VagaOnEspecialidade_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `Especialidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VagaOnEspecialidade` ADD CONSTRAINT `VagaOnEspecialidade_vagaId_fkey` FOREIGN KEY (`vagaId`) REFERENCES `Vaga`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `Perfil`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_grupoPermissaoId_fkey` FOREIGN KEY (`grupoPermissaoId`) REFERENCES `GrupoPermissao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funcao` ADD CONSTRAINT `Funcao_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `Especialidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Terapeuta` ADD CONSTRAINT `Terapeuta_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Terapeuta` ADD CONSTRAINT `Terapeuta_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `Especialidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TerapeutaOnFuncao` ADD CONSTRAINT `TerapeutaOnFuncao_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TerapeutaOnFuncao` ADD CONSTRAINT `TerapeutaOnFuncao_funcaoId_fkey` FOREIGN KEY (`funcaoId`) REFERENCES `Funcao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_modalidadeId_fkey` FOREIGN KEY (`modalidadeId`) REFERENCES `Modalidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `Especialidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_funcaoId_fkey` FOREIGN KEY (`funcaoId`) REFERENCES `Funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_localidadeId_fkey` FOREIGN KEY (`localidadeId`) REFERENCES `Localidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_statusEventosId_fkey` FOREIGN KEY (`statusEventosId`) REFERENCES `StatusEventos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_frequenciaId_fkey` FOREIGN KEY (`frequenciaId`) REFERENCES `Frequencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_intervaloId_fkey` FOREIGN KEY (`intervaloId`) REFERENCES `Intervalo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendario` ADD CONSTRAINT `Calendario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoPermissaoOnPermissao` ADD CONSTRAINT `GrupoPermissaoOnPermissao_grupoPermissaoId_fkey` FOREIGN KEY (`grupoPermissaoId`) REFERENCES `GrupoPermissao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoPermissaoOnPermissao` ADD CONSTRAINT `GrupoPermissaoOnPermissao_permissaoId_fkey` FOREIGN KEY (`permissaoId`) REFERENCES `Permissao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PacienteHistorico` ADD CONSTRAINT `PacienteHistorico_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_statusEventosId_fkey` FOREIGN KEY (`statusEventosId`) REFERENCES `StatusEventos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_localidadeId_fkey` FOREIGN KEY (`localidadeId`) REFERENCES `Localidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baixa` ADD CONSTRAINT `Baixa_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Calendario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Protocolo` ADD CONSTRAINT `Protocolo_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Protocolo` ADD CONSTRAINT `Protocolo_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sessao` ADD CONSTRAINT `Sessao_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sessao` ADD CONSTRAINT `Sessao_calendarioId_fkey` FOREIGN KEY (`calendarioId`) REFERENCES `Calendario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuiaAmil` ADD CONSTRAINT `GuiaAmil_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuiaAmil` ADD CONSTRAINT `GuiaAmil_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `Sessao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoteGuiaItem` ADD CONSTRAINT `LoteGuiaItem_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `LoteGuia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoteGuiaItem` ADD CONSTRAINT `LoteGuiaItem_guiaId_fkey` FOREIGN KEY (`guiaId`) REFERENCES `GuiaAmil`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuiaAmilHistorico` ADD CONSTRAINT `GuiaAmilHistorico_guiaId_fkey` FOREIGN KEY (`guiaId`) REFERENCES `GuiaAmil`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransacaoAmil` ADD CONSTRAINT `TransacaoAmil_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `LoteGuia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeSessao` ADD CONSTRAINT `AtividadeSessao_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeSessao` ADD CONSTRAINT `AtividadeSessao_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeSessao` ADD CONSTRAINT `AtividadeSessao_calendarioId_fkey` FOREIGN KEY (`calendarioId`) REFERENCES `Calendario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pei` ADD CONSTRAINT `Pei_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pei` ADD CONSTRAINT `Pei_terapeutaId_fkey` FOREIGN KEY (`terapeutaId`) REFERENCES `Terapeuta`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pei` ADD CONSTRAINT `Pei_programaId_fkey` FOREIGN KEY (`programaId`) REFERENCES `Programa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Portage` ADD CONSTRAINT `Portage_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VBMappResultado` ADD CONSTRAINT `VBMappResultado_vbmappId_fkey` FOREIGN KEY (`vbmappId`) REFERENCES `VBMappAtividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VBMappResultado` ADD CONSTRAINT `VBMappResultado_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VBMappResultado` ADD CONSTRAINT `VBMappResultado_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VBMappAtividades` ADD CONSTRAINT `VBMappAtividades_programaId_fkey` FOREIGN KEY (`programaId`) REFERENCES `Programa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortageAtividades` ADD CONSTRAINT `PortageAtividades_programaId_fkey` FOREIGN KEY (`programaId`) REFERENCES `Programa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

