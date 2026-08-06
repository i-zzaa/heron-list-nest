/**
 * Seed dos cadastros/tabelas de referência da aplicação.
 *
 * Gerado a partir dos dados REAIS já existentes no banco em 2026-08-05,
 * para permitir recriar um ambiente novo (dev/teste) com os mesmos
 * cadastros de produção sem depender de digitar tudo manualmente.
 *
 * Propositalmente NÃO inclui (pedido explícito: excluir agendamento e
 * filas; PII excluída por decisão própria, ver AUDITORIA_MULTIALCANCE.md):
 *   - Agendamento: Calendario, Baixa, Sessao, AtividadeSessao, Protocolo,
 *     Pei, Portage, VBMappResultado, GuiaAmil e tabelas relacionadas.
 *   - Filas: Vaga, VagaOnEspecialidade.
 *   - Pessoas reais (PII): Usuario (login/senha), Terapeuta,
 *     TerapeutaOnFuncao, Paciente, PacienteHistorico — colocar isso num
 *     arquivo versionado no git exporia nome/telefone de paciente e hash de
 *     senha de usuário permanentemente no histórico do repositório.
 *
 * Idempotente: usa upsert por chave, pode rodar quantas vezes quiser.
 * Rodar com: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const convenio: any[] = [
  {
    "id": 1,
    "nome": "Unimed Intercâmbio"
  },
  {
    "id": 2,
    "nome": "Unimed Jundiaí"
  },
  {
    "id": 3,
    "nome": "Amil"
  },
  {
    "id": 4,
    "nome": "Particular"
  },
  {
    "id": 5,
    "nome": "Sobam"
  },
  {
    "id": 6,
    "nome": "Sul America"
  }
];

const especialidade: any[] = [
  {
    "id": 1,
    "nome": "Psico",
    "cor": "#8e24aa"
  },
  {
    "id": 2,
    "nome": "Fono",
    "cor": "#f6bf26"
  },
  {
    "id": 3,
    "nome": "TO",
    "cor": "#ef6c00"
  },
  {
    "id": 4,
    "nome": "PsicoPEDAG",
    "cor": "#000000"
  },
  {
    "id": 5,
    "nome": "Motricidade",
    "cor": "#4285F4"
  },
  {
    "id": 6,
    "nome": "Musicoterapia",
    "cor": "#795548"
  }
];

const periodo: any[] = [
  {
    "id": 1,
    "nome": "Integral"
  },
  {
    "id": 2,
    "nome": "Manhã"
  },
  {
    "id": 3,
    "nome": "Tarde"
  }
];

const status: any[] = [
  {
    "id": 1,
    "nome": "Urgente"
  },
  {
    "id": 2,
    "nome": "Padrão"
  },
  {
    "id": 3,
    "nome": "Voltou ABA"
  }
];

const tipoSessao: any[] = [
  {
    "id": 1,
    "nome": "Av Neuropsico"
  },
  {
    "id": 2,
    "nome": "Av Psicodiag"
  },
  {
    "id": 3,
    "nome": "Terapia"
  }
];

const statusPaciente: any[] = [
  {
    "id": 1,
    "nome": "Fila avaliacao",
    "cod": "queue_avaliation"
  },
  {
    "id": 2,
    "nome": "Avaliacao",
    "cod": "avaliation"
  },
  {
    "id": 3,
    "nome": "Fila devolutiva",
    "cod": "queue_devolutiva"
  },
  {
    "id": 4,
    "nome": "Devolutiva",
    "cod": "devolutiva"
  },
  {
    "id": 5,
    "nome": "Fila terapia",
    "cod": "queue_therapy"
  },
  {
    "id": 6,
    "nome": "Terapia",
    "cod": "therapy"
  },
  {
    "id": 7,
    "nome": "Crud Terapia",
    "cod": "crud_therapy"
  }
];

const localidade: any[] = [
  {
    "id": 1,
    "casa": "Casa 1",
    "sala": "Sala Rei Leão",
    "ativo": true
  },
  {
    "id": 2,
    "casa": "Casa 2",
    "sala": "Sala Divertidamente",
    "ativo": true
  },
  {
    "id": 3,
    "casa": "Casa 2 ",
    "sala": "Sala de Reunião",
    "ativo": true
  },
  {
    "id": 4,
    "casa": "Casa 1",
    "sala": "Sala Pocoyo",
    "ativo": true
  },
  {
    "id": 5,
    "casa": "Casa 2",
    "sala": "Sala Dino",
    "ativo": true
  },
  {
    "id": 6,
    "casa": "Casa 2",
    "sala": "Sala Lilo",
    "ativo": true
  },
  {
    "id": 7,
    "casa": "Casa 2 ",
    "sala": "Sala Toy Story",
    "ativo": true
  },
  {
    "id": 8,
    "casa": "Casa 1 ",
    "sala": "Sala Monstros",
    "ativo": true
  },
  {
    "id": 9,
    "casa": "Casa 1",
    "sala": " Sala Divertidamente",
    "ativo": true
  },
  {
    "id": 10,
    "casa": "Casa 1 ",
    "sala": "Sala Nemo",
    "ativo": true
  },
  {
    "id": 11,
    "casa": "Casa 1",
    "sala": "Sala Dino",
    "ativo": true
  },
  {
    "id": 12,
    "casa": "Casa 1",
    "sala": "Sala Toy Story",
    "ativo": true
  },
  {
    "id": 13,
    "casa": "Casa 1",
    "sala": "Sala Pooh",
    "ativo": false
  },
  {
    "id": 14,
    "casa": "Casa 1",
    "sala": "Sala Mickey",
    "ativo": false
  },
  {
    "id": 15,
    "casa": "Casa 1",
    "sala": "Sala Lilo",
    "ativo": false
  },
  {
    "id": 16,
    "casa": "Casa 2",
    "sala": "Sala Rei Leão",
    "ativo": true
  },
  {
    "id": 17,
    "casa": "Casa 2",
    "sala": "Sala Pooh",
    "ativo": true
  },
  {
    "id": 18,
    "casa": "Casa 2",
    "sala": "Sala Mickey",
    "ativo": true
  },
  {
    "id": 19,
    "casa": "Casa 2",
    "sala": "Sala Nemo",
    "ativo": true
  },
  {
    "id": 20,
    "casa": "Casa 2",
    "sala": "Sala Minions",
    "ativo": true
  },
  {
    "id": 21,
    "casa": "Casa 2",
    "sala": "Sala Heróis",
    "ativo": true
  },
  {
    "id": 22,
    "casa": "Casa 2",
    "sala": "Sala Masha",
    "ativo": true
  },
  {
    "id": 23,
    "casa": "Casa 2",
    "sala": "Sala Pocoyo",
    "ativo": true
  },
  {
    "id": 24,
    "casa": "Casa 2",
    "sala": "Ponóquio",
    "ativo": true
  },
  {
    "id": 25,
    "casa": "Casa 2",
    "sala": "Sala Princesas",
    "ativo": true
  },
  {
    "id": 26,
    "casa": "Casa 2",
    "sala": "Sala Monstros",
    "ativo": true
  }
];

const statusEventos: any[] = [
  {
    "id": 1,
    "nome": "Avisar",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Cancelado c/ Antecedência ",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 3,
    "nome": "Atestado",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 4,
    "nome": "Falta",
    "cobrar": true,
    "ativo": true
  },
  {
    "id": 5,
    "nome": "Confirmado",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 6,
    "nome": "Atendido",
    "cobrar": true,
    "ativo": true
  },
  {
    "id": 7,
    "nome": "Teste",
    "cobrar": false,
    "ativo": false
  },
  {
    "id": 8,
    "nome": "Cancelado Terapeuta",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 9,
    "nome": "Terapeuta de Férias",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 10,
    "nome": "Feriado",
    "cobrar": false,
    "ativo": true
  },
  {
    "id": 11,
    "nome": "Cancelado s/ Antecedência",
    "cobrar": true,
    "ativo": true
  },
  {
    "id": 12,
    "nome": "Cancelado Clínica",
    "cobrar": false,
    "ativo": true
  }
];

const frequencia: any[] = [
  {
    "id": 1,
    "nome": "Único",
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Recorrente",
    "ativo": true
  }
];

const modalidade: any[] = [
  {
    "id": 1,
    "nome": "Avaliação",
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Devolutiva",
    "ativo": true
  },
  {
    "id": 3,
    "nome": "Terapia",
    "ativo": true
  }
];

const intervalo: any[] = [
  {
    "id": 1,
    "nome": "Todas Semanas",
    "ativo": true
  },
  {
    "id": 2,
    "nome": "2 Semanas",
    "ativo": true
  },
  {
    "id": 3,
    "nome": "3 Semanas",
    "ativo": true
  }
];

const funcao: any[] = [
  {
    "id": 1,
    "nome": "Psicologa",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Fonoaudiologa",
    "especialidadeId": 2,
    "ativo": true
  },
  {
    "id": 3,
    "nome": "Terapeuta Ocupacional",
    "especialidadeId": 3,
    "ativo": true
  },
  {
    "id": 4,
    "nome": "Psicopedagoga",
    "especialidadeId": 4,
    "ativo": true
  },
  {
    "id": 5,
    "nome": "Acompanhante Terapêutica",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 6,
    "nome": "Musicoterapeuta",
    "especialidadeId": 6,
    "ativo": true
  },
  {
    "id": 7,
    "nome": "Psicomotricista",
    "especialidadeId": 5,
    "ativo": true
  },
  {
    "id": 8,
    "nome": "Aplicadora",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 9,
    "nome": "Treinadora",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 10,
    "nome": "Líder",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 11,
    "nome": "Líder Jr",
    "especialidadeId": 1,
    "ativo": true
  },
  {
    "id": 15,
    "nome": "Supervidor (a)",
    "especialidadeId": 1,
    "ativo": true
  }
];

const perfil: any[] = [
  {
    "id": 1,
    "nome": "Developer"
  },
  {
    "id": 2,
    "nome": "Administrador"
  },
  {
    "id": 3,
    "nome": "Coordenadora"
  },
  {
    "id": 4,
    "nome": "Secretária"
  },
  {
    "id": 5,
    "nome": "Terapeuta"
  }
];

const permissao: any[] = [
  {
    "id": 391,
    "cod": "DASHBOARD",
    "descricao": "Menu DASHBOARD"
  },
  {
    "id": 392,
    "cod": "HOME",
    "descricao": "Menu HOME"
  },
  {
    "id": 393,
    "cod": "FILA",
    "descricao": "Menu fila de espera"
  },
  {
    "id": 394,
    "cod": "CADASTRO",
    "descricao": "Menu cadastrado de elementos para o sistema"
  },
  {
    "id": 395,
    "cod": "AGENDA",
    "descricao": "Menu de agendamento"
  },
  {
    "id": 396,
    "cod": "DASHBOARD_TEMPO_FILA",
    "descricao": "Informação de tempo de espera"
  },
  {
    "id": 397,
    "cod": "DASHBOARD_RETORNO_FILA",
    "descricao": "Informação de quantidade de retornos"
  },
  {
    "id": 398,
    "cod": "DASHBOARD_GRAFICO_FILA",
    "descricao": "Gráfico de status"
  },
  {
    "id": 399,
    "cod": "FILA_AVALIACAO",
    "descricao": "Tab de Informação de avaliação"
  },
  {
    "id": 400,
    "cod": "FILA_AVALIACAO_FILTRO",
    "descricao": "Filtro da aba de avaliação"
  },
  {
    "id": 401,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 402,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_CONVENIO",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 403,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_ESPECIALIDADE",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 404,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_PRIORIDADE",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 405,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_PERIODOS",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 406,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_TIPO_SESSAO",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 407,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_AGENDADOS",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 408,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_INATIVOS",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 409,
    "cod": "FILA_AVALIACAO_FILTRO_SELECT_DEVOLUTIVAS",
    "descricao": "Campo do filtro da aba de avaliação"
  },
  {
    "id": 410,
    "cod": "FILA_AVALIACAO_FILTRO_BOTAO_CADASTRAR",
    "descricao": "Botão do filtro da aba de avaliação"
  },
  {
    "id": 411,
    "cod": "FILA_AVALIACAO_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro da aba de avaliação"
  },
  {
    "id": 412,
    "cod": "FILA_AVALIACAO_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro da aba de avaliação"
  },
  {
    "id": 413,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 414,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 415,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_AGENDA_CALENDARIOR",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 416,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_DEVOLUTIVA",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 417,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_RETORNAR",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 418,
    "cod": "FILA_AVALIACAO_LISTA_TAG_ESPECIALIDADES",
    "descricao": "TAG do item da lista de avaliação"
  },
  {
    "id": 419,
    "cod": "FILA_DEVOLUTIVA",
    "descricao": "Tab de Informação de devolutiva"
  },
  {
    "id": 420,
    "cod": "FILA_DEVOLUTIVA_FILTRO",
    "descricao": "Filtro da aba de de devolutiva"
  },
  {
    "id": 421,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 422,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_CONVENIO",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 423,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_ESPECIALIDADE",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 424,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_PRIORIDADE",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 425,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_PERIODOS",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 426,
    "cod": "FILA_DEVOLUTIVA_FILTRO_SELECT_AGENDADOS",
    "descricao": "Campo do filtro da aba de devolutiva"
  },
  {
    "id": 427,
    "cod": "FILA_DEVOLUTIVA_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro da aba de devolutiva"
  },
  {
    "id": 428,
    "cod": "FILA_DEVOLUTIVA_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro da aba de devolutiva"
  },
  {
    "id": 429,
    "cod": "FILA_DEVOLUTIVA_LISTA_BOTAO_AGENDA_CALENDARIOR",
    "descricao": "Botão do item da lista de devolutiva"
  },
  {
    "id": 430,
    "cod": "FILA_DEVOLUTIVA_LISTA_BOTAO_DEVOLUTIVA",
    "descricao": "Botão do item da lista de devolutiva"
  },
  {
    "id": 431,
    "cod": "FILA_DEVOLUTIVA_LISTA_BOTAO_RETORNAR",
    "descricao": "Botão do item da lista de devolutiva"
  },
  {
    "id": 432,
    "cod": "FILA_DEVOLUTIVA_LISTA_TAG_ESPECIALIDADES",
    "descricao": "TAG do item da lista de devolutiva"
  },
  {
    "id": 433,
    "cod": "FILA_TERAPIA",
    "descricao": "Tab de Informação de terapia"
  },
  {
    "id": 434,
    "cod": "FILA_TERAPIA_FILTRO",
    "descricao": "Filtro da aba de de terapia"
  },
  {
    "id": 435,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 436,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_CONVENIO",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 437,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_ESPECIALIDADE",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 438,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_PRIORIDADE",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 439,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_PERIODOS",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 440,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_AGENDADOS",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 441,
    "cod": "FILA_TERAPIA_FILTRO_SELECT_INATIVOS",
    "descricao": "Campo do filtro da aba de terapia"
  },
  {
    "id": 442,
    "cod": "FILA_TERAPIA_FILTRO_BOTAO_CADASTRAR",
    "descricao": "Botão do filtro da aba de terapia"
  },
  {
    "id": 443,
    "cod": "FILA_TERAPIA_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro da aba de terapia"
  },
  {
    "id": 444,
    "cod": "FILA_TERAPIA_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro da aba de terapia"
  },
  {
    "id": 445,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 446,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 447,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_AGENDA_CALENDARIOR",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 448,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_DEVOLUTIVA",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 449,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_RETORNAR",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 450,
    "cod": "FILA_TERAPIA_LISTA_TAG_ESPECIALIDADES",
    "descricao": "TAG do item da lista de terapia"
  },
  {
    "id": 451,
    "cod": "CADASTRO_PACIENTES",
    "descricao": "Tab de Informação de pacientes"
  },
  {
    "id": 452,
    "cod": "CADASTRO_PACIENTES_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro da aba de pacientes"
  },
  {
    "id": 453,
    "cod": "CADASTRO_PACIENTES_FILTRO_SELECT_CONVENIO",
    "descricao": "Campo do filtro da aba de pacientes"
  },
  {
    "id": 454,
    "cod": "CADASTRO_PACIENTES_FILTRO_SELECT_ESPECIALIDADE",
    "descricao": "Campo do filtro da aba de pacientes"
  },
  {
    "id": 455,
    "cod": "CADASTRO_PACIENTES_FILTRO_BOTAO_CADASTRAR",
    "descricao": "Botão do filtro de pacientes"
  },
  {
    "id": 456,
    "cod": "CADASTRO_PACIENTES_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro de pacientes"
  },
  {
    "id": 457,
    "cod": "CADASTRO_PACIENTES_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro de pacientes"
  },
  {
    "id": 458,
    "cod": "CADASTRO_PACIENTES_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista de pacientes"
  },
  {
    "id": 459,
    "cod": "CADASTRO_PACIENTES_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista de pacientes"
  },
  {
    "id": 460,
    "cod": "CADASTRO_USUARIOS",
    "descricao": "Tab de Informação de usuários"
  },
  {
    "id": 461,
    "cod": "CADASTRO_USUARIOS_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 462,
    "cod": "CADASTRO_USUARIOS_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 463,
    "cod": "CADASTRO_USUARIOS_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 464,
    "cod": "CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 465,
    "cod": "CADASTRO_MODALIDADE",
    "descricao": "Tab de Informação de modalidade"
  },
  {
    "id": 466,
    "cod": "CADASTRO_MODALIDADE_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 467,
    "cod": "CADASTRO_MODALIDADE_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 468,
    "cod": "CADASTRO_MODALIDADE_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 469,
    "cod": "CADASTRO_STATUS_EVENTOS",
    "descricao": "Tab de Informação de status de eventos"
  },
  {
    "id": 470,
    "cod": "CADASTRO_STATUS_EVENTOS_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 471,
    "cod": "CADASTRO_STATUS_EVENTOS_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 472,
    "cod": "CADASTRO_STATUS_EVENTOS_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 473,
    "cod": "CADASTRO_FREQUENCIA",
    "descricao": "Tab de Informação de frequência"
  },
  {
    "id": 474,
    "cod": "CADASTRO_FREQUENCIA_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 475,
    "cod": "CADASTRO_FREQUENCIA_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 476,
    "cod": "CADASTRO_FREQUENCIA_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 477,
    "cod": "CADASTRO_FUNCAO",
    "descricao": "Tab de Informação de função"
  },
  {
    "id": 478,
    "cod": "CADASTRO_FUNCAO_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 479,
    "cod": "CADASTRO_FUNCAO_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 480,
    "cod": "CADASTRO_FUNCAO_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 481,
    "cod": "CADASTRO_LOCALIDADE",
    "descricao": "Tab de Informação de localidade"
  },
  {
    "id": 482,
    "cod": "CADASTRO_LOCALIDADE_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 483,
    "cod": "CADASTRO_LOCALIDADE_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 484,
    "cod": "CADASTRO_LOCALIDADE_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 485,
    "cod": "AGENDA_CALENDARIO_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro de agendamento"
  },
  {
    "id": 486,
    "cod": "AGENDA_CALENDARIO_FILTRO_SELECT_TERAPEUTAS",
    "descricao": "Campo do filtro de agendamento"
  },
  {
    "id": 487,
    "cod": "AGENDA_CALENDARIO_FILTRO_SELECT_STATUS_EVENTOS",
    "descricao": "Campo do filtro de agendamento"
  },
  {
    "id": 488,
    "cod": "AGENDA_CALENDARIO_FILTRO_SELECT_MODALIDADE",
    "descricao": "Campo do filtro de agendamento"
  },
  {
    "id": 489,
    "cod": "AGENDA_CALENDARIO_FILTRO_BOTAO_CADASTRAR",
    "descricao": "Botão do filtro de agendamento"
  },
  {
    "id": 490,
    "cod": "AGENDA_CALENDARIO_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro de agendamento"
  },
  {
    "id": 491,
    "cod": "AGENDA_CALENDARIO_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro de agendamento"
  },
  {
    "id": 492,
    "cod": "AGENDA_CALENDARIO_LISTA_EDITAR",
    "descricao": "Botão de editar da modal de visualização do evento"
  },
  {
    "id": 493,
    "cod": "AGENDA_CALENDARIO_LISTA_EXCLUIR",
    "descricao": "Botão de excluir da modal de visualização do evento"
  },
  {
    "id": 494,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_PACIENTE",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 495,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_ESPECIALIDADE",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 496,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_TERAPEUTA",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 497,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_FUNCAO",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 498,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_LOCALIDADE",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 499,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_STATUS_EVENTOS",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 500,
    "cod": "AGENDA_CALENDARIO_EVENTO_TODOS_EVENTOS",
    "descricao": "Permissão para carregar todos os eventos"
  },
  {
    "id": 501,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_OBSERVACAO",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 502,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_MODALIDADE",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 503,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_DATA_INICIO",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 504,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_DATA_FIM",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 505,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_HORA_INICIO",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 506,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_HORA_FIM",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 507,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_FREQUENCIA",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 508,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_INTERVALO",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 509,
    "cod": "AGENDA_CALENDARIO_EVENTO_EDITAR_DIAS_FREQUENCIA",
    "descricao": "Campo do formulário do evento"
  },
  {
    "id": 510,
    "cod": "AGENDA_CALENDARIO_EVENTO_BOTAO_ATUALIZAR_SALVAR",
    "descricao": "Botão salvar/editar do formulário do evento"
  },
  {
    "id": 511,
    "cod": "FINANCEIRO",
    "descricao": "Menu Financeiro"
  },
  {
    "id": 512,
    "cod": "FINANCEIRO_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro do financeiro"
  },
  {
    "id": 513,
    "cod": "FINANCEIRO_FILTRO_SELECT_TERAPEUTA",
    "descricao": "Campo do filtro do financeiro"
  },
  {
    "id": 514,
    "cod": "FINANCEIRO_FILTRO_SELECT_DATA_INICIAL",
    "descricao": "Campo do filtro do financeiro"
  },
  {
    "id": 515,
    "cod": "FINANCEIRO_FILTRO_SELECT_DATA_FINAL",
    "descricao": "Campo do filtro do financeiro"
  },
  {
    "id": 516,
    "cod": "FINANCEIRO_FILTRO_BOTAO_LIMPAR",
    "descricao": "Botão do filtro do financeiro"
  },
  {
    "id": 517,
    "cod": "FINANCEIRO_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Botão do filtro do financeiro"
  },
  {
    "id": 518,
    "cod": "CADASTRO_PACIENTES_FILTRO_SELECT_AGENDA_CALENDARIODOS",
    "descricao": "Permissão para ver os pacientes agendados"
  },
  {
    "id": 519,
    "cod": "CADASTRO_PACIENTES_LISTA_BOTAO_RETORNAR",
    "descricao": "Botão do item da lista de pacientes"
  },
  {
    "id": 520,
    "cod": "AGENDA_CALENDARIO",
    "descricao": "Tab de Informação de calendario da agenda"
  },
  {
    "id": 521,
    "cod": "AGENDA_BAIXA",
    "descricao": "Tab de Informação de baixa da agenda"
  },
  {
    "id": 522,
    "cod": "AGENDA_BAIXA_UPDATE",
    "descricao": "Botão de baixa"
  },
  {
    "id": 523,
    "cod": "AGENDA_BAIXA_FILTRO_SELECT_PACIENTE",
    "descricao": "Campo do filtro de baaixa"
  },
  {
    "id": 524,
    "cod": "AGENDA_BAIXA_FILTRO_SELECT_CONVENIO",
    "descricao": "Campo do filtro de baaixa"
  },
  {
    "id": 525,
    "cod": "AGENDA_BAIXA_FILTRO_SELECT_TERAPEUTA",
    "descricao": "Campo do filtro de baaixa"
  },
  {
    "id": 526,
    "cod": "AGENDA_BAIXA_FILTRO_SELECT_LOCALIDADE",
    "descricao": "Campo do filtro de baaixa"
  },
  {
    "id": 527,
    "cod": "AGENDA_BAIXA_FILTRO_SELECT_BAIXADO",
    "descricao": "Campo do filtro de baaixa"
  },
  {
    "id": 528,
    "cod": "FILA_AVALIACAO_LISTA_BOTAO_AGENDAR",
    "descricao": "Botão do item da lista de avaliação"
  },
  {
    "id": 529,
    "cod": "FILA_TERAPIA_LISTA_BOTAO_AGENDAR",
    "descricao": "Botão do item da lista de terapia"
  },
  {
    "id": 531,
    "cod": "CADASTRO_PROGRAMA",
    "descricao": "Tab de Informação de programa"
  },
  {
    "id": 532,
    "cod": "CADASTRO_PROGRAMA_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 533,
    "cod": "CADASTRO_PROGRAMA_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 534,
    "cod": "CADASTRO_PROGRAMA_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 535,
    "cod": "CADASTRO_GRUPO_PERMISSOES",
    "descricao": "Tab de Informação de grupo de permissoes"
  },
  {
    "id": 536,
    "cod": "CADASTRO_GRUPO_PERMISSOES_BOTAO_CADASTRAR",
    "descricao": "Botão de cadastro"
  },
  {
    "id": 537,
    "cod": "CADASTRO_GRUPO_PERMISSOES_LISTA_BOTAO_EDITAR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 538,
    "cod": "CADASTRO_GRUPO_PERMISSOES_LISTA_BOTAO_EXCLUIR",
    "descricao": "Botão do item da lista"
  },
  {
    "id": 539,
    "cod": "DEVICE_WEB",
    "descricao": "Acesso ao sistema Multi Alcance Agenda"
  },
  {
    "id": 540,
    "cod": "DEVICE_MOBILE",
    "descricao": "Acesso ao sistema Multi Alcance Prontuário"
  },
  {
    "id": 541,
    "cod": "AGENDA_BAIXA_DELETE",
    "descricao": "Botão de exclui a baixa"
  },
  {
    "id": 542,
    "cod": "PEI_FILTRO_SELECT_PROTOCOLO",
    "descricao": "Campo filtro do PEI"
  },
  {
    "id": 543,
    "cod": "PEI_FILTRO_BOTAO_LIMPAR",
    "descricao": "Campo filtro do PEI"
  },
  {
    "id": 544,
    "cod": "PEI_FILTRO_BOTAO_PESQUISAR",
    "descricao": "Campo filtro do PEI"
  },
  {
    "id": 545,
    "cod": "PEI_FILTRO_BOTAO_CADASTRAR",
    "descricao": "Botão Cadastrar do PEI"
  },
  {
    "id": 546,
    "cod": "DASHBOARD_RESUMO",
    "descricao": "Cards de resumo do dashboard gerencial (pacientes ativos, sessões hoje, fila de espera, taxa de presença)"
  },
  {
    "id": 547,
    "cod": "DASHBOARD_SESSOES_ESPECIALIDADE",
    "descricao": "Gráfico de sessões realizadas na semana, por especialidade"
  },
  {
    "id": 548,
    "cod": "DASHBOARD_SESSOES_STATUS",
    "descricao": "Gráfico de sessões de hoje por status"
  },
  {
    "id": 549,
    "cod": "DASHBOARD_OCUPACAO_PERIODO",
    "descricao": "Distribuição das sessões de hoje por período (manhã/tarde/noite)"
  },
  {
    "id": 550,
    "cod": "DASHBOARD_FLUXO_PACIENTES",
    "descricao": "Funil de pacientes por estágio (fila avaliação, avaliação, fila terapia, terapia)"
  },
  {
    "id": 551,
    "cod": "DASHBOARD_FILA_ESPECIALIDADE",
    "descricao": "Fila de espera agrupada por especialidade"
  },
  {
    "id": 552,
    "cod": "DASHBOARD_PENDENCIAS",
    "descricao": "Lista de pendências do dia (avisar, evolução pendente, conflito de agenda)"
  },
  {
    "id": 553,
    "cod": "DASHBOARD_SESSOES_HOJE",
    "descricao": "Tabela de próximas sessões de hoje"
  },
  {
    "id": 554,
    "cod": "DASHBOARD_TOP_TERAPEUTAS",
    "descricao": "Ranking de terapeutas do dia"
  }
];

const grupoPermissao: any[] = [
  {
    "id": 1,
    "nome": "Developer"
  },
  {
    "id": 2,
    "nome": "ADM"
  },
  {
    "id": 3,
    "nome": "RECEPCAO"
  },
  {
    "id": 5,
    "nome": "RECEPCAO BASICO"
  },
  {
    "id": 6,
    "nome": "TERAPEUTA"
  }
];

const programa: any[] = [
  {
    "id": 1,
    "nome": "Brincar",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 2,
    "nome": "Cognição",
    "ativo": true,
    "tipoProtocolo": [
      1
    ]
  },
  {
    "id": 3,
    "nome": "Comportamental",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 4,
    "nome": "Ecóico",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 5,
    "nome": "Emocional",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 6,
    "nome": "Escrita",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 7,
    "nome": "Funcional",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 8,
    "nome": "Grupo",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 9,
    "nome": "Habilidades Sociais",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 10,
    "nome": "Imitação",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 11,
    "nome": "INTRAV",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 12,
    "nome": "Intraverbal",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 13,
    "nome": "Leitura",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 14,
    "nome": "Ling",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 15,
    "nome": "Linguística",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 16,
    "nome": "LRFFC",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 17,
    "nome": "Lúdico",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 18,
    "nome": "Mando",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 19,
    "nome": "Matemática",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 20,
    "nome": "MTS",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 21,
    "nome": "Neuropsicologia",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 22,
    "nome": "Ouvinte",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 23,
    "nome": "Pedagógico",
    "ativo": true,
    "tipoProtocolo": [
      3
    ]
  },
  {
    "id": 24,
    "nome": "Social",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 25,
    "nome": "Socialização",
    "ativo": true,
    "tipoProtocolo": [
      1
    ]
  },
  {
    "id": 26,
    "nome": "Tato",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  },
  {
    "id": 27,
    "nome": "Vocal",
    "ativo": true,
    "tipoProtocolo": [
      2
    ]
  }
];

const vBMappAtividades: any[] = [
  {
    "id": 1,
    "nome": "Emite 2 palavras, sinais ou PECS, porém pode precisar de dica ecóica, imitativa ou outras dicas, desde que não físicas.",
    "nivel": 1,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 2,
    "nome": "Emite 4 mandos diferentes sem dicas (exceto pela dica verbal 'O que você quer?'). O item desejado pode estar presente (e.g., música, comida, bola).",
    "nivel": 1,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 3,
    "nome": "Generaliza 6 mandos entre duas pessoas, dois ambientes e entre dois tipos diferentes de um mesmo reforçador (e.g., emite mandos para bolinhas de sabão tanto para a mãe quanto para o pai, dentro e fora da casa e em um pote plástico vermelho ou azul).",
    "nivel": 1,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 4,
    "nome": "Espontaneamente (sem dica verbal) emite 5 mandos. O item desejado pode estar presente.",
    "nivel": 1,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 5,
    "nome": "Emite 10 mandos diferentes sem dicas (exceto pela dica 'O que você quer'). O item desejado pode estar presente (e.g., maça, balanço, carro, suco)",
    "nivel": 1,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 6,
    "nome": "Emite 2 tatos com dica ecóica ou imitativa (e.g., pessoas, bichos de estimação, personagens ou objetos favoritos).",
    "nivel": 1,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 7,
    "nome": "Emite tatos para 4 itens quaisquer sem dica ecóica ou imitativa (e.g., pessoas, bichos de estimação, personagens ou outros objetos).",
    "nivel": 1,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 8,
    "nome": "Tateia 6 itens não-reforçadores (e.g., sapato, chapéu, colher, carrinho, copo, cama).",
    "nivel": 1,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 9,
    "nome": "Emite tatos espontaneamente (sem dicas verbais) para 2 itens diferentes.",
    "nivel": 1,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 10,
    "nome": "Emite tatos para 10 itens (objetos comuns, pessoas, partes do corpo ou figuras).",
    "nivel": 1,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 11,
    "nome": "Atenta para a voz de um falante ao estabelecer contato visual com ele por 5 vezes.",
    "nivel": 1,
    "programaId": 22,
    "permiteSubitens": false
  },
  {
    "id": 12,
    "nome": "Responde ao ouvir seu nome 5 vezes (e. g ., olha para o falante).",
    "nivel": 1,
    "programaId": 22,
    "permiteSubitens": false
  },
  {
    "id": 13,
    "nome": "Criança olha, toca ou aponta para o membro correto da família, bicho de estimação ou outro reforçador quando esses estímulos são apresentados em arranjos de dois, para 5 reforçadores diferentes (e.g., 'Onde está o Elmo?' ou 'Onde está a mãe?').",
    "nivel": 1,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 14,
    "nome": "Executa 4 ações motoras diferentes quando solicitada e não necessita de uma dica visual (e.g., Você pode pular?, Mostre-me como se bate palmas?).",
    "nivel": 1,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 15,
    "nome": "Seleciona o item correto em um arranjo de 4 estímulos para 20 objetos e figuras diferentes (e.g., Mostre-me o gato, toque no sapato).",
    "nivel": 1,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 16,
    "nome": "Segue visualmente um estímulo móvel por 2 segundos, por 5 vezes.",
    "nivel": 1,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 17,
    "nome": "Pega pequenos objetos com o polegar, indicador e dedo médio (movimento de pinça).",
    "nivel": 1,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 18,
    "nome": "Atenta visualmente para um brinquedo ou livro por 30 segundos (não vale se o item é utilizado para auto estimulação).",
    "nivel": 1,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 19,
    "nome": "Coloca 3 itens em um recipiente, empilha 3 blocos ou coloca 3 anéis em uma haste. Verificar se a criança realiza duas destas atividades ou atividades similares.",
    "nivel": 1,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 20,
    "nome": "Emparelha quaisquer 10 itens idênticos (e.g., quebra-cabeças, brinquedos ou figuras).",
    "nivel": 1,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 21,
    "nome": "Manipula e explora objetos por 1 minuto (e.g., olha para um brinquedo, vira o brinquedo, aperta botões).",
    "nivel": 1,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 22,
    "nome": "Mostra variação na brincadeira ao interagir de forma independente com 5 itens diferentes (e.g., brinca com anéis, depois com uma bola, depois blocos).",
    "nivel": 1,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 23,
    "nome": "Demonstra generalização ao engajar-se em movimentos exploratórios e brincadeira com brinquedos em um novo ambiente por 2 minutos (e.g., em uma nova brinquedoteca).",
    "nivel": 1,
    "programaId": 1,
    "permiteSubitens": false
  },
  {
    "id": 24,
    "nome": "Envolve-se de forma independente em brincadeiras de movimento por 2 minutos (e.g., balançar, dançar, pular, balançar, escalar, correr).",
    "nivel": 1,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 25,
    "nome": "Envolve-se de forma independente em brincadeiras de causa e efeito por 2 minutos (e.g., esvaziar recipientes, brincar com brinquedos que pulam, empurrar brinquedos, etc.).",
    "nivel": 1,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 26,
    "nome": "Faz contato visual como forma de mando por 05 vezes.",
    "nivel": 1,
    "programaId": 24,
    "permiteSubitens": false
  },
  {
    "id": 27,
    "nome": "Indica que quer ser segurada ou que brinquem fisicamente com ela por 2 vezes (e.g., subir no colo da mãe).",
    "nivel": 1,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 28,
    "nome": "Espontaneamente estabelece contato visual com outras crianças por 5 vezes.",
    "nivel": 1,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 29,
    "nome": "Espontaneamente se envolve em brincadeira paralela perto de outras crianças por um total de 2 minutos (e.g., senta na caixa de areia perto de outras crianças).",
    "nivel": 1,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 30,
    "nome": "Espontaneamente segue colegas ou imita o comportamento motor deles por 2 vezes (e.g., segue um colega numa casa de brincar).",
    "nivel": 1,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 31,
    "nome": "Imita 2 movimentos motores grossos com a dica 'Faça isso ' (e.g., bater palmas, levantar braços).",
    "nivel": 1,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 32,
    "nome": "Imita 4 movimentos motores grossos com a dica 'Faça isso'.",
    "nivel": 1,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 33,
    "nome": "Imita 8 movimentos motores, 2 dos quais envolvendo objetos (e.g., balançar um chocalho, bater pauzinhos).",
    "nivel": 1,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 34,
    "nome": "Imita espontaneamente o comportamento motor de outros em 5 ocasiões.",
    "nivel": 1,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 35,
    "nome": "Imita 20 movimentos motores de qualquer tipo (e.g., motor fino, motor grosso, imitação com objetos).",
    "nivel": 1,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 36,
    "nome": "Pontuação de no mínimo 2 no subteste APCE.",
    "nivel": 1,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 37,
    "nome": "Pontuação de no mínimo 5 no subteste APCE.",
    "nivel": 1,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 38,
    "nome": "Pontuação de no mínimo 10 no subteste APCE",
    "nivel": 1,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 39,
    "nome": "Pontuação de no mínimo 15 no subteste APCE.",
    "nivel": 1,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 40,
    "nome": "Pontuação de no mínimo 25 no subteste APCE",
    "nivel": 1,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 41,
    "nome": "Emissão espontânea de em média 5 sons por hora",
    "nivel": 1,
    "programaId": 27,
    "permiteSubitens": true
  },
  {
    "id": 42,
    "nome": "Emissão espontânea de 5 sons diferentes, com uma média total de 10 sons a cada hora.",
    "nivel": 1,
    "programaId": 27,
    "permiteSubitens": true
  },
  {
    "id": 43,
    "nome": "Emissão espontânea de 10 sons diferentes, com variação de entonação, com uma média total de 25 sons a cada hora",
    "nivel": 1,
    "programaId": 27,
    "permiteSubitens": true
  },
  {
    "id": 44,
    "nome": "Emissão espontânea  de  15  palavras  inteiras  ou  frases  com  entonação apropriada e ritmo.",
    "nivel": 1,
    "programaId": 27,
    "permiteSubitens": true
  },
  {
    "id": 45,
    "nome": "Vocalização espontânea  de  15  palavras  inteiras  ou  frases  com  entonação apropriada e ritmo.",
    "nivel": 1,
    "programaId": 27,
    "permiteSubitens": true
  },
  {
    "id": 46,
    "nome": "Emite mandos para 20 itens diferentes que estão ausentes e sem o uso de dicas (exceto, e.g., O que você precisa? ) (e.g., emite um mando para papel quando ganha um giz de cera). ",
    "nivel": 2,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 47,
    "nome": "Emite mandos para que outras pessoas realizem cinco (5) ações diferentes e necessárias para que uma atividade desejada seja possível e apreciada. (e.g., abrir a porta para sair, empurrar no balanço).",
    "nivel": 2,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 48,
    "nome": "Emite 5 mandos diferentes que contenham 2 ou mais palavras (não incluindo 'Eu quero'). Por exemplo, 'Vai rápido' 'Minha vez 'Põe suco'.",
    "nivel": 2,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 49,
    "nome": "Espontaneamente emite 15 mandos diferentes (e. g., 'Vamos brincar' 'Abre''Eu quero livro'.",
    "nivel": 2,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 50,
    "nome": "Emite 10 mandos novos sem treino específico (e.g., espontaneamente diz 'Onde o gatinho foi?' sem treino formal de mando).",
    "nivel": 2,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 51,
    "nome": "A criança emite tatos para 25 itens ao ser indagada 'O que é isso?' (e.g., livro, sapato, carro, cachorro, boné). ",
    "nivel": 2,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 52,
    "nome": "Generaliza tatos para 50 itens, sendo 3 exemplares de cada item, por testagem ou de uma lista de generalizações conhecidas (e.g., emite tatos para 3 carrinhos diferentes).",
    "nivel": 2,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 53,
    "nome": "A criança emite tatos para 10 ações ao ser indagada, por exemplo, 'O que eu estou fazendo?' (e.g., pulando, dormindo,comendo).",
    "nivel": 2,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 54,
    "nome": "Emite tatos para 50 combinações de dois componentes verbo-nome ou nome-verbo (e.g., lavar rosto, Paulo balançando, bebê dormindo).",
    "nivel": 2,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 55,
    "nome": "Emite tatos para um total de 200 nomes e/ou verbos (ou outras partes do discurso) testados ou de uma lista acumulada de tatos conhecidos.",
    "nivel": 2,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 56,
    "nome": "Seleciona o item correto em um arranjo misturado com 6 itens, para 40 objetos ou figuras diferentes (e. g ., Ache gato, Toque na bola). ",
    "nivel": 2,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 57,
    "nome": "Generaliza discriminações de ouvinte em um arranjo misturado de 8 itens, para 50 itens, sendo 3 exemplares diferentes de cada item (e.g., a criança pode achar 3 exemplares de um trenzinho).",
    "nivel": 2,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 58,
    "nome": "Criança executa 10 ações motoras específicas quando solicitada (e.g., 'Mostre-me bater palmas' 'Você pode pular?').",
    "nivel": 2,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 59,
    "nome": "Segue 50 instruções de dois componentes nome-verbo e/ou verbo-nome (e.g., 'Me mostre um bebê dormindo' , 'Empurre o balanço').",
    "nivel": 2,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 60,
    "nome": "Criança seleciona, quando solicitada, o item correto em um livro, cenário ou ambiente natural, para 250 itens (testados ou de uma lista acumulada de palavras conhecidas).",
    "nivel": 2,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 61,
    "nome": "Emparelha objetos ou figuras idênticas em um arranjo misturado de 6 itens, para 25 itens.",
    "nivel": 2,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 62,
    "nome": "Organiza itens diferentes por cores e formas dado 10 modelos diferentes de cores ou formas (e.g., dado um recipiente amarelo, outro azul e um vermelho e um conjunto de carrinhos vermelhos, amarelos e azuis, a criança combina os itens por suas respectivas cores.",
    "nivel": 2,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 63,
    "nome": "Emparelha objetos ou figuras idênticas em um arranjo misturado de 8 itens que contenham 3 estímulos similares, para 25 itens (e.g., combina um cão com outro cão em uma seleção que também contenha um gato, um porco e um pônei). ",
    "nivel": 2,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 64,
    "nome": "Emparelha objetos ou figuras não idênticos em um arranjo misturado de 10 itens, para 25 itens (e.g., combina uma caminhonete Ford com uma caminhonete Toyota).",
    "nivel": 2,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 65,
    "nome": "Emparelha objetos não idênticos (3D) com figuras (2D) e/ou vice versa, em um arranjo misturado de 10 itens, contendo 3 estímulos similares, para 25 itens.",
    "nivel": 2,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 66,
    "nome": "Procura por um brinquedo ausente ou parte de um conjunto que está faltando (e.g., uma peça de quebra-cabeça, uma bola para brincar de cesta, uma mamadeira para uma boneca) para 5 itens ou conjuntos.",
    "nivel": 2,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 67,
    "nome": "De forma independente faz uso de brinquedos e objetos de acordo com as suas respectivas funções para 5 itens (e.g., colocar um trem nos trilhos, puxar um vagão, segurar um telefone no ouvido).",
    "nivel": 2,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 68,
    "nome": "Brinca com objetos do cotidiano de uma forma criativa por 2 vezes (e.g., usa uma tigela como tambor e uma caixa como carro imaginário).",
    "nivel": 2,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 69,
    "nome": "De forma independente brinca em estruturas e equipamentos de playgrounds por um total de 5 minutos (e.g., escorrega no escorregador, balanço).",
    "nivel": 2,
    "programaId": 1,
    "permiteSubitens": false
  },
  {
    "id": 70,
    "nome": "Monta brinquedos com múltiplas partes para 5 conjuntos diferentes (e. g ., cabeça de batata, kit polibol, Legos).",
    "nivel": 2,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 71,
    "nome": "Inicia interação física com um colega por 2 vezes (e. g ., empurrar colega em um carrinho, segurar na mão, brincar de roda).",
    "nivel": 2,
    "programaId": 24,
    "permiteSubitens": false
  },
  {
    "id": 72,
    "nome": "Espontaneamente emite mandos para os colegas por 5 vezes (e.g ., 'Minha vez',; 'Me empurra'; 'Olhe! Vem').",
    "nivel": 2,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 73,
    "nome": "Se envolve e sustenta uma brincadeira social com colegas por 3 minutos sem dicas ou reforçamento de adultos (e. g ., monta um conjunto para brincar de forma cooperativa; brinca na água com colegas)",
    "nivel": 2,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 74,
    "nome": "Espontaneamente responde aos mandos de colegas por 5 vezes (e. g., colega diz 'me empurra no carrinho' e a criança empurra; colega diz 'eu quero o trenzinho' e a criança entrega o trenzinho).",
    "nivel": 2,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 75,
    "nome": "Espontaneamente emite mandos para que colegas participem de jogos, brincadeira social, etc., por 2 vezes (e.g., 'Venham todos'; 'Vamos cavar um buraco').",
    "nivel": 2,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 76,
    "nome": "Imita10 ações que exigem selecionar um objeto específico de um arranjo (e. g., seleciona uma baqueta de um arranjo que também contém uma corneta e um sino e imita o adulto batendo tambor com a baqueta).",
    "nivel": 2,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 77,
    "nome": "Imita 20 ações motoras finas diferentes ao receber a dica 'Faça isso' (e.g ., balançar dedos, beliscar, fazer punho, imitar uma borboleta).",
    "nivel": 2,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 78,
    "nome": "Imita 10 sequências de ações de três componentes diferentes ao receber a dica 'Faça isso'. (e. g., bater palmas, saltar e tocar dedos do pé; pegar uma boneca, colocá-la no berço e balançar o berço).",
    "nivel": 2,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 79,
    "nome": "Espontaneamente imita 5 habilidades funcionais em ambiente natural (e.g., comer com uma colher, colocar casaco, tirar sapatos).",
    "nivel": 2,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 80,
    "nome": "Imita (ou tenta imitar de forma aproximada) qualquer ação motora nova modelada por um adulto com ou sem objetos (i.e., apresenta repertório imitativo generalizado).",
    "nivel": 2,
    "programaId": 10,
    "permiteSubitens": true
  },
  {
    "id": 81,
    "nome": "Pontuação de ao menos 50 no teste APCE (ao menos 20 do grupo2).",
    "nivel": 2,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 82,
    "nome": "Pontuação de ao menos 60 no teste APCE.",
    "nivel": 2,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 83,
    "nome": "Pontuação de ao menos 70 no teste APCE.",
    "nivel": 2,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 84,
    "nome": "Pontuação de ao menos 80 no teste APCE.",
    "nivel": 2,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 85,
    "nome": "Pontuação de ao menos 90 no teste APCE (ao menos 10 dos grupos 4 e 5 grupo).",
    "nivel": 2,
    "programaId": 4,
    "permiteSubitens": true
  },
  {
    "id": 86,
    "nome": "Seleciona comidas ou bebidas diferentes quando apresentados em um conjunto de 05 itens (juntamente com 4 outros itens que não sejam nem comidas e nem bebidas) a partir do preenchimento de frases do tipo você come...... ou você bebe     para 05 comidas ou bebidas diferentes.",
    "nivel": 2,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 87,
    "nome": "Seleciona o item correto em um arranjo de 8 itens completando quaisquer tipos de frases (e. g., você senta em uma...) para 25 LRFFC diferentes.",
    "nivel": 2,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 88,
    "nome": "Seleciona o item correto em um arranjo de 8 itens completando quaisquer tipos de frases (e. g., você senta em uma...) para 25 LRFFC diferentes",
    "nivel": 2,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 89,
    "nome": "Seleciona um item quando 3 informações diferentes são fornecidas sobre ele e cada uma delas é apresentada de forma independente (e. g., 'Encontre um animal' 'Quem late?' 'Quem tem patas?' ) para 25 itens.",
    "nivel": 2,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 90,
    "nome": "Emite espontaneamente tatos para os itens em 50% das tentativas LRFFC (e. g., diz cão ao ser solicitada 'Ache um animal', em um arranjo visual que contenha a figura de um cão).",
    "nivel": 2,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 91,
    "nome": "Completa 10 frases diferentes de qualquer tipo no formato de preencher lacunas (e. g., continuar uma música, expressões verbais divertidas, sons de objetos ou animais).",
    "nivel": 2,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 92,
    "nome": "Criança fala o primeiro nome quando perguntamos ' Qual o seu nome?'.",
    "nivel": 2,
    "programaId": 12,
    "permiteSubitens": false
  },
  {
    "id": 93,
    "nome": "Completa 25 diferentes frases preenchendo lacunas (não incluindo músicas). Por exemplo: Você come..., Você dorme em uma...., Sapatos e...).",
    "nivel": 2,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 94,
    "nome": "Responde 25 questões diferentes que iniciam com 'O que /qual ' (e. g., 'O que você gosta de comer?').",
    "nivel": 2,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 95,
    "nome": "Responde 25 questões diferentes que iniciam com 'Quem ou Onde' (e.g., 'Quem é seu amigo?' 'Onde está seu travesseiro?').",
    "nivel": 2,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 96,
    "nome": "Senta em grupo para lanche ou almoço sem comportamento negativo por 3 minutos.",
    "nivel": 2,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 97,
    "nome": "Guarda objetos pessoais, entra na fila ou vem à mesa com apenas 1 dica verbal.",
    "nivel": 2,
    "programaId": 8,
    "permiteSubitens": true
  },
  {
    "id": 98,
    "nome": "Faz transição entre as atividades de sala de aula sem necessitar de mais de uma dica gestual ou verbal.",
    "nivel": 2,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 99,
    "nome": "Senta em um grupo pequeno por 5 minutos sem comportamento disruptivo ou tentativa de deixar o grupo.",
    "nivel": 2,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 100,
    "nome": "Senta em um grupo pequeno por 10 minutos, atenta ao professor ou ao material por 50% do período e responde a 5 SDs do professor.",
    "nivel": 2,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 101,
    "nome": "A articulação da  criança ao emitir  10 tatos pode  ser entendida por  adultos familiarizados com ela e que não podem ver o item tateado.",
    "nivel": 2,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 102,
    "nome": "Tem um vocabulário total de ouvinte de 100 palavras (e .g ., toque o nariz; pule; ache as chave).",
    "nivel": 2,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 103,
    "nome": "Emite 10 sentenças diferentes (por dia) de 2 palavras, de qualquer tipo, exceto ecóicas (e. g., mando, tato).",
    "nivel": 2,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 104,
    "nome": "Emite prosódia funcional (e. g., ritmo, ênfase, entonação) em 5 ocasiões em um dia (e. g., põe ênfase ou acentua certas palavras tais como 'É MEU!').",
    "nivel": 2,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 105,
    "nome": "Tem um vocabulário total de falante de 300 palavras (todos os operantes verbais, exceto ecóico).",
    "nivel": 2,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 106,
    "nome": "Espontaneamente emite mandos diferentes para obter informações verbais usando questões WH6 ou faz uso de uma palavra em forma de pergunta por 5 vezes (e.g., 'Qual o seu nome?' 'Quem é você?' 'Dormindo?' ).",
    "nivel": 3,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 107,
    "nome": "Educadamente emite mandos para parar uma atividade indesejada ou remover qualquer OM aversiva em 5 circunstâncias diferentes (e.g., 'Por favor para de me empurrar' 'Não obrigado' 'Você pode sair da frente?').",
    "nivel": 3,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 108,
    "nome": "Emite mandos contendo 10 adjetivos, preposições ou advérbios diferentes (e.g., 'Meu giz de cera amarelo quebrou' 'Não leva isso para fora' 'Vai rápido').",
    "nivel": 3,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 109,
    "nome": "Fornece informações, instruções ou explicações para como fazer algo ou para como participar de uma atividade, por 5 vezes (e.g., Você passa a cola primeiro, depois cola. Você senta aqui enquanto eu busco o livro).",
    "nivel": 3,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 110,
    "nome": "Emite mandos para que os outros atentem para o seu comportamento intraverbal por 5 vezes (e.g., Me escuta... Vou te contar... Aconteceu isso... Eu estou contando a história...).",
    "nivel": 3,
    "programaId": 18,
    "permiteSubitens": true
  },
  {
    "id": 111,
    "nome": "Emite tatos para cor, forma e função de 5 objetos (15 tentativas) quando cada objeto e pergunta são apresentados em ordem misturada (e. g., Qual a cor da geladeira? Qual a forma de um ovo? O que você faz com a bola?) (Isto é parte tato e parte intraverbal).",
    "nivel": 3,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 112,
    "nome": "Emite tatos para 4 preposições diferentes (e.g., dentro, fora, sobre, embaixo) e 4 pronomes (e. g., eu, você, meu, minha).",
    "nivel": 3,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 113,
    "nome": "Emite tatos para 4 adjetivos diferentes, excluindo cores e formas (e.g., grande, pequeno, comprido, curto) e 4 advérbios (e. g., rápido, devagar, gentilmente, discretamente).",
    "nivel": 3,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 114,
    "nome": "Emite tatos com sentenças completas contendo 4 ou mais palavras, 20 vezes.",
    "nivel": 3,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 115,
    "nome": "Possui um vocabulário de tato de 1000 palavras (nomes, verbos, adjetivos, etc) que foram testados ou de uma lista acumulada de tatos conhecidos.",
    "nivel": 3,
    "programaId": 26,
    "permiteSubitens": true
  },
  {
    "id": 116,
    "nome": "Seleciona itens por cor e forma em um arranjo de 6 estímulos similares, para 4 cores e 4 formas (e.g., 'Encontre o carro vermelho' 'Encontre o biscoito quadrado').",
    "nivel": 3,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 117,
    "nome": "Segue 2 instruções envolvendo 6 preposições diferentes (e.g., 'Fique atrás da cadeira') e 4 pronomes diferentes (e. g., 'Toque minha orelha').",
    "nivel": 3,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 118,
    "nome": "Seleciona itens de um arranjo de estímulos similares baseado na relacão entre 4 pares de adjetivos (e.g., grande – pequeno, comprido – curto) e demostra ações baseadas na relação entre 4 pares de advérbios (e. g., quieto – barulhento, rápido –devagar).",
    "nivel": 3,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 119,
    "nome": "Segue instruções com 3 passos para 10 direções diferentes (e.g., 'Pegue o casaco, pendure e sente na cadeira').",
    "nivel": 3,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 120,
    "nome": "Tem um repertório de ouvinte no total de 1200 palavras (nomes, verbos, adjetivos, etc.), testados ou de uma lista de registro acumulada de palavras conhecidas",
    "nivel": 3,
    "programaId": 22,
    "permiteSubitens": true
  },
  {
    "id": 121,
    "nome": "Emparelha espontaneamente qualquer parte de uma atividade artística ou artesanato com o modelo de outra pessoa por 2 vezes (e.g., um colega colore um balão de vermelho e a criança copia a cor para seu balão).",
    "nivel": 3,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 122,
    "nome": "Demonstra emparelhamento generalizado não idêntico em um conjunto desordenado de 10 itens com 3 estímulos similares, para 25 itens (e.g., combina novos itens na primeira tentativa)",
    "nivel": 3,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 123,
    "nome": "Completa 20 estruturas diferentes com blocos, encaixes, quebra cabeças de formas ou atividades similares que contenham pelo menos 8 peças diferentes.",
    "nivel": 3,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 124,
    "nome": "Organiza 5 itens de 5 categorias diferentes sem necessidade um modelo (e.g., animais. roupas, móveis).",
    "nivel": 3,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 125,
    "nome": "Continua 20 padrões de três passos, sequências ou tarefas seriadas (e.g., estrela, triângulo, coração, estrela, triângulo…).",
    "nivel": 3,
    "programaId": 20,
    "permiteSubitens": true
  },
  {
    "id": 126,
    "nome": "Espontaneamente envolve- se em brincadeira imaginária ou de faz de conta em 5 ocasiões (e.g., brincar de vestir, uma festa com bichos de pelúcia, fingir que está cozinhando).",
    "nivel": 3,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 127,
    "nome": "Repete uma brincadeira motora grossa para obter um resultado melhor em duas atividades diferentes (e.g., jogar uma bola na cesta, acertar a bola no jogo de taco, bater o pé para lançar um foguete, se esforçar para balançar mais rápido no balanço).",
    "nivel": 3,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 128,
    "nome": "Engaja-se de forma independente em atividades do tipo artesanato por 5 minutos (e.g., colorir, pintura, cortar, colar).",
    "nivel": 3,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 129,
    "nome": "De forma independente se envolve em atividades de brincadeira contínua por 10 minutos sem a presença de dicas ou reforçamento de um adulto (e.g., brincando com uma lousa mágica, brincar de vestir roupas diferentes).",
    "nivel": 3,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 130,
    "nome": "De forma independente desenha ou escreve em livros de atividade pré- acadêmicas por 5 minutos (e.g., ponto a ponto, jogos de pareamento, labirintos, traçar letras e números).",
    "nivel": 3,
    "programaId": 1,
    "permiteSubitens": true
  },
  {
    "id": 131,
    "nome": "Espontaneamente coopera com um colega para alcançar um resultado específico por 5 vezes (e.g., uma criança segura um balde enquanto outra o enche de água).",
    "nivel": 3,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 132,
    "nome": "Espontaneamente emite mandos aos colegas utilizando uma pergunta WH por 5 vezes (e.g., 'Onde você está indo?' 'O que é isso?' 'Quem você está imitando?').",
    "nivel": 3,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 133,
    "nome": "Responde de forma intraverbal a 5 questões ou afirmações diferentes oriundas dos colegas (e.g., verbalmente responde quando o colega pergunta 'Do que você quer brincar?').",
    "nivel": 3,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 134,
    "nome": "Participa de atividades de faz de conta e brincadeira social com colegas por 5 minutos sem dicas de adulto (e.g., brincadeira de vestir fantasia, encenar filmes, brincar de casinha).",
    "nivel": 3,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 135,
    "nome": "Participa de 4 trocas verbais sobre 1 tópico com colegas para 5 tópicos (e.g., as crianças conversam entre elas como fazer um rio em uma caixa de areia).",
    "nivel": 3,
    "programaId": 24,
    "permiteSubitens": true
  },
  {
    "id": 136,
    "nome": "Atenta para um livro quando uma história está sendo lida para ela por 75% do tempo.",
    "nivel": 3,
    "programaId": 13,
    "permiteSubitens": false
  },
  {
    "id": 137,
    "nome": "Seleciona (discriminação de ouvinte) a letra maiúscula correta em um arranjo de 5 letras para 10 letras diferentes.",
    "nivel": 3,
    "programaId": 13,
    "permiteSubitens": true
  },
  {
    "id": 138,
    "nome": "Emite tatos para 10 letras maiúsculas quando solicitada.",
    "nivel": 3,
    "programaId": 13,
    "permiteSubitens": true
  },
  {
    "id": 139,
    "nome": "Lê seu próprio nome.",
    "nivel": 3,
    "programaId": 13,
    "permiteSubitens": true
  },
  {
    "id": 140,
    "nome": "Emparelha 5 palavras com os itens ou figuras correspondentes em um arranjo de 5 e vice versa (e.g., combina a palavra escrita pássaro com a figura de um pássaro).",
    "nivel": 3,
    "programaId": 13,
    "permiteSubitens": true
  },
  {
    "id": 141,
    "nome": "Imita 5 ações diferentes de escrita a partir de um modelo fornecido por um adulto usando um instrumento de escrita e uma superfície de escrita.",
    "nivel": 3,
    "programaId": 6,
    "permiteSubitens": true
  },
  {
    "id": 142,
    "nome": "Faz um traçado de forma independente (distante cerca de 0.5 cm) das linhas de 05 formas geométricas diferentes (e.g., círculo, quadrado, triângulo, retângulo, estrela).",
    "nivel": 3,
    "programaId": 6,
    "permiteSubitens": true
  },
  {
    "id": 143,
    "nome": "Copia 10 letras ou números de forma legível.",
    "nivel": 3,
    "programaId": 6,
    "permiteSubitens": true
  },
  {
    "id": 144,
    "nome": "De forma legível soletra e escreve seu próprio nome sem fazer cópia.",
    "nivel": 3,
    "programaId": 6,
    "permiteSubitens": true
  },
  {
    "id": 145,
    "nome": "Copia todas as 26 letras maiúsculas e minúsculas de forma legível.",
    "nivel": 3,
    "programaId": 6,
    "permiteSubitens": true
  },
  {
    "id": 146,
    "nome": "Seleciona corretamente um item apresentado em um arranjo de 10 itens e que contenha 3 estímulos similares (e.g., cor similar, forma ou classe, sendo eles as escolhas erradas), para 25 questões WH diferentes em tarefas de LRFFC",
    "nivel": 3,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 147,
    "nome": "Seleciona itens de um livro baseado em 2 componentes verbais: uma característica (e.g., cor) ou função (e.g., desenha com) ou classe (e.g., roupa), para 25 tarefas LRFFC (e.g., 'Você vê um animal marrom?' 'Você consegue encontrar a roupa com botões?').",
    "nivel": 3,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 148,
    "nome": "Seleciona itens de uma página de livro ou do ambiente natural a partir de 3 componentes verbais (e.g., verbo, adjetivo, preposição, pronome), para 25 tarefas LRFFC iniciadas com perguntas WH (e.g., Qual fruta cresce em árvores?).",
    "nivel": 3,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 149,
    "nome": "Seleciona corretamente os itens de um livro ou do ambiente natural quando 4 perguntas LRFFC diferentes e sobre um único assunto são realizadas de forma alternada (Onde mora a vaca? O que a vaca come? Quem ordenha a vaca? ) para 25 tópicos diferentes.",
    "nivel": 3,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 150,
    "nome": "Demonstra 1000 respostas LRFFC diferentes, testadas ou obtidas de uma lista acumulada de respostas conhecidas.",
    "nivel": 3,
    "programaId": 16,
    "permiteSubitens": true
  },
  {
    "id": 151,
    "nome": "Espontaneamente emite 20 comentários intraverbais (podem ser parte mando) (e.g., O pai diz 'Eu vou até o carro' e a criança espontaneamente diz 'Eu quero dar uma volta').",
    "nivel": 3,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 152,
    "nome": "Demonstra 300 respostas intraverbais diferentes testadas ou obtidas de uma lista acumulada de intraverbais conhecidos.",
    "nivel": 3,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 153,
    "nome": "Responde 2 perguntas depois de ter ouvido a leitura de duas passagens curtas (15 ou mais palavras) de um livro, para 25 passagens (e.g,. Quem soprou a casa até derrubá-la?).",
    "nivel": 3,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 154,
    "nome": "Descreve 25 eventos diferentes, vídeos, histórias, etc. com 8 ou mais palavras (e.g., Me conte o que aconteceu ... 'O monstro grande assustou todo mundo e eles correram para dentro de casa').",
    "nivel": 3,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 155,
    "nome": "Responde a 4 questões WH diferentes e alternadas sobre um único tópico, para 10 tópicos diferentes (e.g.,. Quem leva você para a escola? Que escola você vai? O que você leva para a escola?).",
    "nivel": 3,
    "programaId": 12,
    "permiteSubitens": true
  },
  {
    "id": 156,
    "nome": "Usa o vaso e lava as mãos apenas com dicas verbais.",
    "nivel": 3,
    "programaId": 8,
    "permiteSubitens": true
  },
  {
    "id": 157,
    "nome": "Responde 5 diferentes perguntas ou instruções quando em grupo de 3 ou mais crianças sem necessitar de dicas diretas (e.g., 'Todo mundo levantando! '. 'Alguém está usando uma camisa vermelha?').",
    "nivel": 3,
    "programaId": 8,
    "permiteSubitens": true
  },
  {
    "id": 158,
    "nome": "Trabalha em grupo de forma independente por 5 minutos e permanece na tarefa por 50% do período.",
    "nivel": 3,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 159,
    "nome": "Adquire 2 comportamentos novos quando colocada por 15 minutos em uma tarefa de ensino de grupo que envolva 5 ou mais crianças.",
    "nivel": 3,
    "programaId": 8,
    "permiteSubitens": true
  },
  {
    "id": 160,
    "nome": "Senta em uma sessão de grupo que tenha 5 crianças, por 20 minutos, sem comportamento disruptivo e responde 5 questões intraverbais",
    "nivel": 3,
    "programaId": 8,
    "permiteSubitens": false
  },
  {
    "id": 161,
    "nome": "Emite inflexão 7 de nome ao combinar a raiz de 10 substantivos com sufixos para o plural (e.g., cachorro vs. cachorros) e 10 pronomes possessivos (e.g., Essa é a bicicleta dela).",
    "nivel": 3,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 162,
    "nome": "Emite inflexões de verbo ao combinar 10 verbos com sufixo para passado simples (e.g., comeu) e 10 verbos para futuro simples (e.g., comerá).",
    "nivel": 3,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 163,
    "nome": "Emite 10 frases diferentes com substantivos que contenham pelo menos 3 palavras com 2 modificadores (adjetivos, preposições, pronomes) (e.g., 'Esta é minha boneca' 'Eu quero sorvete de chocolate').",
    "nivel": 3,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 164,
    "nome": "Emite 10 frases diferentes com verbos que contenham pelo menos 3 palavras e 2 modificadores (advérbio, preposição, pronome) (e.g., 'Empurra com força' 'Fique em cima dos degraus').",
    "nivel": 3,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 165,
    "nome": "Combina frases com substantivo e verbo para produzir 10 sentenças diferentes, sintaticamente corretas, contendo pelo menos 5 palavras (e.g., O cachorro lambeu minha cara').",
    "nivel": 3,
    "programaId": 15,
    "permiteSubitens": true
  },
  {
    "id": 166,
    "nome": "Identifica como ouvinte os números de 1 a 5 em um arranjo com 5 números diferentes.",
    "nivel": 3,
    "programaId": 19,
    "permiteSubitens": true
  },
  {
    "id": 167,
    "nome": "Emite tatos para os números 1 a 5.",
    "nivel": 3,
    "programaId": 19,
    "permiteSubitens": true
  },
  {
    "id": 168,
    "nome": "Retira a quantidade correta de itens de um conjunto, entre 1 e 5 (e.g., 'Pegue 4 carros'; 'Agora me dê 2 carros'). ",
    "nivel": 3,
    "programaId": 19,
    "permiteSubitens": true
  },
  {
    "id": 169,
    "nome": "Identifica como ouvinte 8 comparações diferentes que envolvam medidas (e.g., mais e menos, grande e pequeno, comprido e curto, cheio e vazio, alto e baixo).",
    "nivel": 3,
    "programaId": 19,
    "permiteSubitens": true
  },
  {
    "id": 170,
    "nome": "Corretamente combina um número escrito com a quantidade e a quantidade com um número escrito para os números de 1 a 5 (e.g., combina o número 3 com uma figura que mostra 3 caminhões).",
    "nivel": 3,
    "programaId": 19,
    "permiteSubitens": true
  }
];

const portageAtividades: any[] = [
  {
    "id": 1,
    "nome": "Observa uma pessoa movimentando-se em seu campo visual",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 2,
    "nome": "Sorri em resposta à atenção do adulto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 3,
    "nome": "Vocaliza em resposta à atenção",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 4,
    "nome": "Olha para sua própria mão, sorrindo, vocalizando ou parando de chorar",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 5,
    "nome": "Responde a seu círculo familiar, sorrindo, vocalizando ou parando de chorar",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 6,
    "nome": "Sorri em resposta à expressão dos outros",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 7,
    "nome": "Sorri e vocaliza ao ver sua imagem no espelho",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 8,
    "nome": "Acaricia ou toca no rosto de adultos (puxa cabelo, nariz, óculos, etc)",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 9,
    "nome": "Estende a mão em direção a um objeto oferecido",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 10,
    "nome": "Estende os braços em direção a pessoas familiares",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 11,
    "nome": "Estende a mão e toca sua imagem refletida no espelho",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 12,
    "nome": "Segura e examina por 1 minuto um objeto que lhe foi dado",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 13,
    "nome": "Sacode ou aperta um objeto colocado em sua mão, produzindo sons involuntários",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 14,
    "nome": "Brinca sozinho por 10 minutos",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 15,
    "nome": "Procura contato visual quando alguém lhe dá atenção por 2 a 3 minutos",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 16,
    "nome": "Brinca sozinho sem reclamar por 15 a 20 minutos, próximo de um adulto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 17,
    "nome": "Vocaliza para obter atenção",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 18,
    "nome": "Imita adulto em brincadeiras de esconde-esconde",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 19,
    "nome": "Bate almas, imitando um adulto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 20,
    "nome": "Acena a mão, imitando um adulto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 21,
    "nome": "Ergue os braços para expressar “grande”, imitando um adulto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 22,
    "nome": "Oferece algo, mas nem sempre entrega",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 23,
    "nome": "Abraça, acaricia e beija familiares",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 24,
    "nome": "Responde ao próprio nome, olhando ou estendendo o  braço para ser pego",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 25,
    "nome": "Aperta ou sacode um brinquedo para produzir sons, em imitação",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 26,
    "nome": "Manipula brinquedo ou objeto",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 27,
    "nome": "Estende um brinquedo ou objeto a um adulto e o entrega",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 28,
    "nome": "Imita movimentos de outras crianças ao brincar",
    "programaId": 25,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 29,
    "nome": "Imita um adulto em uma tarefa simples",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 30,
    "nome": "Brinca ao lado de outra criança, cada uma realizando tarefas diferentes",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 31,
    "nome": "Toma parte em uma brincadeira com outra criança por  2 a 5 minutos",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 32,
    "nome": "Aceita a ausência dos pais, embora possa reclamar",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 33,
    "nome": "Explora ativamente seu meio ambiente",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 34,
    "nome": "Realiza atividade manipulativa com outra pessoa",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 35,
    "nome": "Abraça e carrega uma boneca ou brinquedo macio",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 36,
    "nome": "Repete ações que produzem risos e atenção",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 37,
    "nome": "Dá um livro para que um adulto o leia ou para que ambos o compartilhem",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 38,
    "nome": "Puxa uma pessoa para a mostrar-lhe algo",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 39,
    "nome": "Retira a mão ou diz 'não' quando está próximo de um objeto não permitido e alguém o lembra disto",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 40,
    "nome": "Quando colocado em sua cadeira ou trocador espera ser atendido",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 41,
    "nome": "Brinca com 2 ou 3 crianças de sua idade",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 42,
    "nome": "Compartilha um objeto ou alimento com outra criança",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 43,
    "nome": "Cumprimenta colegas ou adultos quando lembrado",
    "programaId": 25,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 44,
    "nome": "Obedece às ordens dos pais pelo menos ½ das vezes",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 45,
    "nome": "Busca/leva um objeto ou pessoa, quando solicitado",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 46,
    "nome": "Presta atenção à estória ou música por 5 a 10 minutos",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 47,
    "nome": "Diz 'Por favor' ou 'Obrigado' quando lembrado",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 48,
    "nome": "Tenta ajudar os pais a executarem tarefas realizando parte da mesma",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 49,
    "nome": "Brinca de usar roupas de adultos",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 50,
    "nome": "Faz uma escolha quando indagado",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 51,
    "nome": "Demostra entender sentimentos, expressando-os",
    "programaId": 25,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 52,
    "nome": "Canta e dança ao ouvir músicas",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 53,
    "nome": "Segue regras de um jogo imitando ações de outras crianças",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 54,
    "nome": "Cumprimenta pessoas familiares sem ser lembrado",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 55,
    "nome": "Seguem regras em jogo de grupos dirigidos por adultos",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 56,
    "nome": "Pede permissão para brincar com um brinquedo que está sendo usado por outra criança",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 57,
    "nome": "Diz 'Por favor' e 'Obrigado' sem ser lembrado ½ das vezes",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 58,
    "nome": "Atende ao telefone, chamando um adulto e falando com pessoas familiares",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 59,
    "nome": "Espera sua vez",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 60,
    "nome": "Segue regras em jogos dirigidos por uma criança mais velha",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 61,
    "nome": "Obedece às ordens de um adulto 75% das vezes. (3 vezes a cada 4 tentativas)",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 62,
    "nome": "Permanece em seu próprio quintal ou jardim",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 63,
    "nome": "Brinca perto de outras crianças conversando com elas enquanto trabalha em um projeto próprio (30 minutos)",
    "programaId": 25,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 64,
    "nome": "Pede ajuda quando esta tendo dificuldades",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 65,
    "nome": "Contribui para conversa de adultos",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 66,
    "nome": "Repete rimas, canções ou dança para os outros",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 67,
    "nome": "Faz uma tarefa sozinha por 20 a 30 minutos",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 68,
    "nome": "Pede desculpas sem ser lembrado 75% das vezes",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 69,
    "nome": "Espera sua vez em brincadeiras que envolvam de 8 a 9 crianças",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 70,
    "nome": "Brinca com 2 a 3 crianças por 20 minutos em uma atividades que envolva cooperação",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 71,
    "nome": "Quando em público, apresenta um comportamento socialmente aceitável",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 72,
    "nome": "Pede permissão para usar objeto dos outros em 75% das vezes",
    "programaId": 25,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 73,
    "nome": "Manifesta seus sentimentos",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 74,
    "nome": "Brinca com a criança em atividades de cooperação por 20 minutos, sem supervisão",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 75,
    "nome": "Explica aos outros as regras do jogo ou atividades",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 76,
    "nome": "Imita papéis de adulto",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 77,
    "nome": "Colabora para a conversa durante as refeições",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 78,
    "nome": "Segue regras de jogo que envolva raciocínio verbal",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 79,
    "nome": "Conforta colegas quando estes estão tristes",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 80,
    "nome": "Escolhe seus próprios amigos",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 81,
    "nome": "Planeja e constrói, usando ferramentas simples",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 82,
    "nome": "Estabelece metas para si próprio e executa atividades para atingi-las",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 83,
    "nome": "Dramatiza trechos de histórias, desempenhando um papel ou utilizando fantoches",
    "programaId": 25,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 84,
    "nome": "Remove um pano do rosto obscureça sua visão",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 85,
    "nome": "Procura com olhar um objeto que foi tirado de seu campo visual",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 86,
    "nome": "Remove um objeto de um recipiente colocando a mão dentro do mesmo",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 87,
    "nome": "Coloca um objeto em um recipiente imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 88,
    "nome": "Coloca um objeto em um recipiente quando recebe instruções",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 89,
    "nome": "Balança um brinquedo que produz som, pendurado em um barbante",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 90,
    "nome": "Coloca três objetos em um recipiente e o esvazia",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 91,
    "nome": "Transfere um objeto de uma mão à outra para apanhar outro objeto",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 92,
    "nome": "Deixa cair e apanha um brinquedo",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 93,
    "nome": "Descobre um objeto escondido sob um recipiente",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 94,
    "nome": "Empurra 3 blocos como se fosse um comboio",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 95,
    "nome": "Remove um círculo de uma prancha, por imitação",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 96,
    "nome": "Coloca um pino redondo em uma prancha de pinos, quando solicitado",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": false
  },
  {
    "id": 97,
    "nome": "Executa gestos simples quando requisitado",
    "programaId": 2,
    "faixaEtaria": "0 a 1",
    "permiteSubitens": true
  },
  {
    "id": 98,
    "nome": "Retira 6 objetos de um recipiente, um por vez",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 99,
    "nome": "Aponta para uma parte do corpo",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 100,
    "nome": "Empilha 3 blocos, dada a ordem",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 101,
    "nome": "Emparelha objetos semelhantes",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 102,
    "nome": "Faz rabiscos no papel",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 103,
    "nome": "Aponta para sim quando perguntam 'Cadê o fulano?'",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 104,
    "nome": "Coloca 5 pinos redondos, dada a ordem",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 105,
    "nome": "Emparelha objetos com a figura do mesmo nome",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 106,
    "nome": "Aponta para afigura nomeada",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": true
  },
  {
    "id": 107,
    "nome": "Viras as páginas de um livro (2/3 por vez) para encontrar a figura nomeada",
    "programaId": 2,
    "faixaEtaria": "1 a 2",
    "permiteSubitens": false
  },
  {
    "id": 108,
    "nome": "Encontra determinado livro quando solicitado",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 109,
    "nome": "Completa um quebra-cabeça de encaixe de 3 peças",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 110,
    "nome": "Nomeia 4 objetos comuns em figuras",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 111,
    "nome": "Desenha uma linha vertical  imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 112,
    "nome": "Desenha uma linha horizontal imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 113,
    "nome": "Copia um círculo",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 114,
    "nome": "Emparelha objetos com a mesma textura",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 115,
    "nome": "Aponta o 'pequeno' e o 'grande' quando solicitado",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 116,
    "nome": "Desenha (+) imitando um adulto..",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 117,
    "nome": "Emparelha 3 cores",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 118,
    "nome": "Coloca objetos dentro, em cima e em baixo de um recipiente, dada a ordem",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 119,
    "nome": "Nomeia objetos quando ouve o barulho que fazem",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 120,
    "nome": "Monta um brinquedo de encaixe de 4 peças",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 121,
    "nome": "Nomeia ações em figuras ('O que... está fazendo?')",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 122,
    "nome": "Emparelha forma geométrica com a figura da mesma",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": true
  },
  {
    "id": 123,
    "nome": "Empilha 5 ou mais argolas em uma vara na ordem",
    "programaId": 2,
    "faixaEtaria": "2 a 3",
    "permiteSubitens": false
  },
  {
    "id": 124,
    "nome": "Nomeia objetos como sendo grandes ou pequenos",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 125,
    "nome": "Aponta para 10 partes do corpo quando requisitado",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 126,
    "nome": "Aponta para menino e menina, dada a ordem",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 127,
    "nome": "Diz se um objeto é pesado ou leve",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 128,
    "nome": "Une 2 partes de uma figura para formar o todo",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 129,
    "nome": "Descreve 2 eventos ou personagens de uma estória familiar ou programa de televisão",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 130,
    "nome": "Repete Brincadeiras (rimas ou canções) que envolvam movimentos coordenados",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 131,
    "nome": "Emparelha 3 ou mais objetos",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 132,
    "nome": "Aponta para objetos compridos ou curtos",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 133,
    "nome": "Associa objetos correspondentes. Ex: meia/sapato",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 134,
    "nome": "Conta até 3 imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 135,
    "nome": "Agrupa objetos em categorias",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 136,
    "nome": "Traça um (V) em imitação",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 137,
    "nome": "Traça uma linha diagonal dado o exemplo",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 138,
    "nome": "Conta 10 objetos, imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 139,
    "nome": "Constrói uma ponte com 3 blocos por imitação",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 140,
    "nome": "Emparelha uma sequência ou padrão (tamanho, cor) de blocos ou contas",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 141,
    "nome": "Copia uma séria de (V) interligados",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 142,
    "nome": "Acrescenta perna ou braço em um desenho incompleto da figura humana",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 143,
    "nome": "Completa um quebra cabeças de 6 peças",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 144,
    "nome": "Indica se os objetos são iguais ou diferentes",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 145,
    "nome": "Desenha um quadrado imitando um adulto",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": false
  },
  {
    "id": 146,
    "nome": "Nomeia 3 cores sendo requisitado",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 147,
    "nome": "Nomeia 3 formas geométricas (quadrado, triângulo e círculo)",
    "programaId": 2,
    "faixaEtaria": "3 a 4",
    "permiteSubitens": true
  },
  {
    "id": 148,
    "nome": "Apanha de 1 a 5 objetos quando solicitado",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 149,
    "nome": "Nomeia 5 texturas diferentes",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 150,
    "nome": "Copia um triângulo ao ser requisitado",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 151,
    "nome": "Recorda-se de 4 objetos que haviam sido vistos em uma figura",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 152,
    "nome": "Diz o momento do dia associado a cada atividades",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 153,
    "nome": "Repete rimas familiares",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 154,
    "nome": "Diz se um objeto é mais pesado ou mais leve (objetos com diferença de 0,5 quilo)",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 155,
    "nome": "Diz o que está faltando quando um objeto é retirado de um grupo de 3 objetos",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 156,
    "nome": "'portage' Cognição 73’, nomeia 8 cores",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 157,
    "nome": "Identifica o valor de 3 moedas",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 158,
    "nome": "Espelha símbolos (letras e números)",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 159,
    "nome": "Diz a cor de objetos nomeados",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 160,
    "nome": "Relata 5 principais fatos de uma história contada 3x",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 161,
    "nome": "Desenha figura humana (cabeça, tronco e 4 membros)",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 162,
    "nome": "Canta 5 estrofes de uma canção",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 163,
    "nome": "Constrói uma pirâmide de 10 blocos por imitação",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": false
  },
  {
    "id": 164,
    "nome": "Nomeia objetos como sendo compridos ou curtos",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 165,
    "nome": "Coloca objetos 'atrás', 'ao lado' ou 'junto' a outros",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 166,
    "nome": "Faz conjuntos iguais de 10 objetos, segundo modelo",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 167,
    "nome": "Nomeia ou aponta para a parte ausente da figura",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 168,
    "nome": "Conta de 1 a 20",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 169,
    "nome": "Identifica o objeto que está colocado no meio, em primeiro e em último lugar",
    "programaId": 2,
    "faixaEtaria": "4 a 5",
    "permiteSubitens": true
  },
  {
    "id": 170,
    "nome": "Contar até 20 objetos e responde adequadamente à pergunta: 'Quantos ... você contou ?'",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 171,
    "nome": "Nomeia 10 numerais",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 172,
    "nome": "Identifica qual a sua esquerda e qual a sua direita",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 173,
    "nome": "Diz as vogais em ordem",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 174,
    "nome": "Escreve seu nome com letras de forma",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 175,
    "nome": "Nomeia 5 letras do alfabeto",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 176,
    "nome": "Ordena objetos em sequência de comprimentos e largura",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 177,
    "nome": "Nomeia as Letras maiúsculas do alfabeto",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 178,
    "nome": "Coloca numerais de 1 a 10 na sequência correta",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 179,
    "nome": "Identifica a posição de objetos em 1º, 2º e 3º lugar",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 180,
    "nome": "Nomeia as letras minúsculas do alfabeto",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 181,
    "nome": "Emparelha letras maiúsculas com minúsculas",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 182,
    "nome": "Aponta para numerais de 1 a 25",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 183,
    "nome": "Copia um losango",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 184,
    "nome": "Completa um labirinto simples",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 185,
    "nome": "Diz os dias da semana na ordem",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 186,
    "nome": "Soma e subtrai combinações de até três elementos",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 187,
    "nome": "Diz o mês e o dia de seu aniversário",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": false
  },
  {
    "id": 188,
    "nome": "Lê 10 palavras impressas",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 189,
    "nome": "Prediz o que vai ocorrer",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 190,
    "nome": "Aponta para os objetos inteiros e partidos ao meio",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  },
  {
    "id": 191,
    "nome": "Conta de memória de 1 a 100 (pedir que para no 40, e continue no 80, caso não erre até o 40)",
    "programaId": 2,
    "faixaEtaria": "5 a 6",
    "permiteSubitens": true
  }
];

const grupoPermissaoOnPermissao: any[] = [
  {
    "grupoPermissaoId": 2,
    "permissaoId": 391
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 392
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 393
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 394
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 395
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 396
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 397
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 398
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 399
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 400
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 401
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 402
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 403
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 404
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 405
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 406
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 407
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 408
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 409
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 410
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 411
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 412
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 413
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 414
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 415
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 416
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 417
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 418
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 419
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 420
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 421
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 422
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 423
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 424
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 425
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 426
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 427
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 428
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 429
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 430
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 431
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 432
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 433
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 434
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 435
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 436
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 437
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 438
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 439
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 440
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 441
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 442
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 443
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 444
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 445
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 446
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 447
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 448
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 449
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 450
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 451
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 452
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 453
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 454
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 455
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 456
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 457
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 458
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 459
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 460
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 461
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 462
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 463
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 464
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 465
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 466
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 467
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 468
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 469
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 470
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 471
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 472
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 473
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 474
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 475
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 476
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 477
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 478
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 479
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 480
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 481
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 482
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 483
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 484
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 485
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 486
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 487
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 488
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 489
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 490
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 491
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 492
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 493
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 494
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 495
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 496
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 497
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 498
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 499
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 500
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 501
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 502
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 503
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 504
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 505
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 506
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 507
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 508
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 509
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 510
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 511
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 512
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 513
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 514
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 515
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 516
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 517
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 518
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 519
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 520
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 521
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 522
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 523
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 524
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 525
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 526
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 527
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 528
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 529
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 531
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 532
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 533
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 534
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 535
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 536
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 537
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 538
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 539
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 541
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 391
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 392
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 393
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 394
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 395
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 396
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 397
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 398
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 399
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 400
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 401
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 402
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 403
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 404
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 405
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 406
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 407
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 408
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 409
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 410
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 411
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 412
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 413
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 414
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 415
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 416
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 417
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 418
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 419
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 420
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 421
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 422
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 423
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 424
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 425
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 426
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 427
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 428
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 429
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 430
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 431
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 432
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 433
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 434
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 435
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 436
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 437
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 438
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 439
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 440
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 441
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 442
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 443
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 444
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 445
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 446
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 447
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 448
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 449
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 450
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 451
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 452
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 453
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 454
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 455
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 456
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 457
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 458
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 459
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 460
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 461
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 462
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 463
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 464
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 465
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 466
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 467
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 468
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 469
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 470
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 471
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 472
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 473
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 474
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 475
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 476
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 477
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 478
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 479
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 480
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 481
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 482
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 483
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 484
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 485
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 486
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 487
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 488
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 489
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 490
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 491
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 492
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 493
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 494
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 495
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 496
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 497
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 498
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 499
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 500
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 501
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 502
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 503
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 504
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 505
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 506
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 507
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 508
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 509
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 510
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 511
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 512
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 513
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 514
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 515
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 516
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 517
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 518
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 519
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 520
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 521
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 522
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 523
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 524
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 525
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 526
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 527
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 528
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 529
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 531
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 532
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 533
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 534
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 535
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 536
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 537
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 538
  },
  {
    "grupoPermissaoId": 3,
    "permissaoId": 541
  },
  {
    "grupoPermissaoId": 4,
    "permissaoId": 395
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 392
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 393
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 394
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 395
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 399
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 400
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 401
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 402
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 403
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 404
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 405
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 406
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 407
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 408
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 409
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 410
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 411
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 412
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 413
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 414
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 415
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 416
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 417
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 418
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 420
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 421
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 422
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 423
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 424
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 425
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 426
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 427
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 428
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 429
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 430
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 431
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 432
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 433
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 434
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 435
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 436
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 437
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 438
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 439
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 440
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 441
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 442
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 443
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 444
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 445
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 446
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 447
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 448
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 449
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 450
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 451
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 452
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 453
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 454
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 455
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 456
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 457
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 458
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 459
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 462
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 463
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 464
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 466
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 467
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 468
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 471
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 472
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 474
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 475
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 476
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 479
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 480
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 482
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 483
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 484
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 485
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 486
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 487
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 488
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 489
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 490
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 491
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 492
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 493
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 494
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 495
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 496
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 497
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 498
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 499
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 500
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 501
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 502
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 503
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 504
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 505
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 506
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 507
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 508
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 509
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 510
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 518
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 519
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 520
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 521
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 523
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 524
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 525
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 526
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 527
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 528
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 529
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 533
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 534
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 536
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 537
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 538
  },
  {
    "grupoPermissaoId": 5,
    "permissaoId": 539
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 392
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 395
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 485
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 486
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 487
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 488
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 489
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 490
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 491
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 518
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 520
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 539
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 540
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 542
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 543
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 544
  },
  {
    "grupoPermissaoId": 6,
    "permissaoId": 545
  },
  // Tags do dashboard gerencial (546-554) atribuídas só ao ADM — o módulo
  // já é restrito por perfil (ProfileGuard, Admin/Developer), essas tags
  // controlam a granularidade por widget em cima disso. Developer não
  // precisa de entrada aqui: bypassa PermissionsGuard inteiro por perfil.
  {
    "grupoPermissaoId": 2,
    "permissaoId": 546
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 547
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 548
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 549
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 550
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 551
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 552
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 553
  },
  {
    "grupoPermissaoId": 2,
    "permissaoId": 554
  }
];

async function main() {
  // Ordem respeita dependências de FK (ex.: funcao depende de especialidade,
  // vBMappAtividades/portageAtividades dependem de programa,
  // grupoPermissaoOnPermissao depende de grupoPermissao + permissao).

  for (const item of convenio) {
    await prisma.convenio.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`convenio: ${convenio.length} registros`);

  for (const item of especialidade) {
    await prisma.especialidade.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`especialidade: ${especialidade.length} registros`);

  for (const item of periodo) {
    await prisma.periodo.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`periodo: ${periodo.length} registros`);

  for (const item of status) {
    await prisma.status.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`status: ${status.length} registros`);

  for (const item of tipoSessao) {
    await prisma.tipoSessao.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`tipoSessao: ${tipoSessao.length} registros`);

  for (const item of statusPaciente) {
    await prisma.statusPaciente.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`statusPaciente: ${statusPaciente.length} registros`);

  for (const item of localidade) {
    await prisma.localidade.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`localidade: ${localidade.length} registros`);

  for (const item of statusEventos) {
    await prisma.statusEventos.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`statusEventos: ${statusEventos.length} registros`);

  for (const item of frequencia) {
    await prisma.frequencia.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`frequencia: ${frequencia.length} registros`);

  for (const item of modalidade) {
    await prisma.modalidade.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`modalidade: ${modalidade.length} registros`);

  for (const item of intervalo) {
    await prisma.intervalo.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`intervalo: ${intervalo.length} registros`);

  for (const item of funcao) {
    await prisma.funcao.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`funcao: ${funcao.length} registros`);

  for (const item of perfil) {
    await prisma.perfil.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`perfil: ${perfil.length} registros`);

  for (const item of permissao) {
    await prisma.permissao.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`permissao: ${permissao.length} registros`);

  for (const item of grupoPermissao) {
    await prisma.grupoPermissao.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`grupoPermissao: ${grupoPermissao.length} registros`);

  for (const item of programa) {
    await prisma.programa.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`programa: ${programa.length} registros`);

  for (const item of vBMappAtividades) {
    await prisma.vBMappAtividades.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`vBMappAtividades: ${vBMappAtividades.length} registros`);

  for (const item of portageAtividades) {
    await prisma.portageAtividades.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`portageAtividades: ${portageAtividades.length} registros`);

  for (const item of grupoPermissaoOnPermissao) {
    await prisma.grupoPermissaoOnPermissao.upsert({
      where: {
        grupoPermissaoId_permissaoId: {
          grupoPermissaoId: item.grupoPermissaoId,
          permissaoId: item.permissaoId,
        },
      },
      update: item,
      create: item,
    });
  }
  console.log(`grupoPermissaoOnPermissao: ${grupoPermissaoOnPermissao.length} registros`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
