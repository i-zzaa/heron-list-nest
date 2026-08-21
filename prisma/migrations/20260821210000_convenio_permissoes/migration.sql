-- Convenio nao tinha nenhuma tag de permissao (achado na rodada de
-- seguranca) — POST/PUT/DELETE /convenio ficavam abertos pra qualquer
-- usuario autenticado. Tags novas (aditivas, sem grant a nenhum
-- grupo/perfil ainda — decisao pendente de confirmacao do usuario, mesmo
-- cuidado das rodadas anteriores).
INSERT INTO `Permissao` (`id`, `cod`, `descricao`) VALUES
  (564, 'CADASTRO_CONVENIO', 'Tab de informação de convênio'),
  (565, 'CADASTRO_CONVENIO_BOTAO_CADASTRAR', 'Botão de cadastro de convênio'),
  (566, 'CADASTRO_CONVENIO_LISTA_BOTAO_EDITAR', 'Botão de edição do item da lista de convênios'),
  (567, 'CADASTRO_CONVENIO_LISTA_BOTAO_EXCLUIR', 'Botão de exclusão do item da lista de convênios');
