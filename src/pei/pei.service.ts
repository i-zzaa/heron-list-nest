import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { METAS, PROCEDIMENTO_ENSINO } from './procedimentoEnsino';
import { TIPO_PROTOCOLO, TIPO_PROTOCOLO_ID } from 'src/protocolo/protocolo';
import { buildPacienteFilter } from 'src/util/filters';
import { VALOR_PORTAGE } from 'src/util/util';
import { buildCreatePayload } from 'src/util/crud';

type TreeNode = {
  key: string | number;
  label?: string;
  children?: TreeNode[];
  subitems?: TreeNode[];
  [k: string]: any;
};

type SelectionKeys = Record<
  string,
  boolean | { checked?: boolean; partialChecked?: boolean }
>;

type MaintenanceObject = {
  manual?: TreeNode[];
  vbmapp?: TreeNode[];
  portage?: TreeNode[];
};

type SelectedMaintenanceByCategory = {
  manual?: SelectionKeys;
  vbmapp?: SelectionKeys;
  portage?: SelectionKeys;
};

// Item 7 do pedido do front: as árvores de Manual/VB-MAPP/Portage/
// Manutenção devem chegar já no formato final de slots — hoje o front
// reconstrói isso em runtime (luck/src/pages/session/useSessionForm.ts:
// transformGenericNode/transformVBMappNode), e essas funções são
// idempotentes em cima do próprio formato de saída delas (rodar de novo
// sobre um nó já no formato final não muda nada). As funções abaixo são
// port 1:1 dessas duas (mesmos 3 casos de branching, mesmos helpers
// isPrimitiveOrNull/isObj/padSlots de luck/src/util/sessionTree.ts) —
// aplicadas aqui, o transform do cliente vira no-op.
const SLOT_COUNT_ATIVIDADE = 10; // Manual/VB-MAPP/Portage
const SLOT_COUNT_MANUTENCAO = 1;

const isObjNode = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const isPrimitiveOrNull = (v: any) => v === null || !isObjNode(v);

const padSlots = (arr: any[], count: number): any[] => {
  const base = Array.isArray(arr) ? arr.slice(0, count) : [];
  if (base.length < count) {
    base.push(...Array.from({ length: count - base.length }, () => null));
  }
  return base;
};

/**
 * GENÉRICO (Manual/Portage/Manutenção): entende children e subitems,
 * cria slots no penúltimo nível ou em folhas puras. Port de
 * transformGenericNode.
 */
function transformGenericNode(node: any, slotCount: number): any {
  const out: any = {
    key: String(node?.key ?? node?.id ?? ''),
    label: node?.label ?? node?.nome ?? '',
    estimuloDiscriminativo: node?.estimuloDiscriminativo ?? '',
    estimuloReforcadorPositivo: node?.estimuloReforcadorPositivo ?? '',
    resposta: node?.resposta ?? '',
  };

  const kids: any[] = (() => {
    if (Array.isArray(node?.children) && node.children.length) {
      return node.children;
    }
    if (Array.isArray(node?.subitems) && node.subitems.length) {
      return node.subitems.map((si: any) => ({
        ...si,
        key: String(si?.key ?? si?.id ?? ''),
        label: si?.label ?? si?.nome ?? '',
        children: Array.isArray(si?.children) ? si.children : undefined,
        subitems: Array.isArray(si?.subitems) ? si.subitems : undefined,
      }));
    }
    return [];
  })();

  if (kids.length > 0) {
    // CASO 1: folha com array de slots (primitivos/null) — usa direto e padroniza
    if (kids.every(isPrimitiveOrNull)) {
      out.children = padSlots(kids, slotCount);
      return out;
    }

    // CASO 2: array de objetos "folha" (sem children/subitems — penúltimo nível)
    const isLeafObject = (k: any) =>
      isObjNode(k) && !Array.isArray(k?.children) && !Array.isArray(k?.subitems);

    if (kids.every(isLeafObject)) {
      out.children = kids.map((sub: any) => ({
        key: String(sub?.key ?? sub?.id ?? ''),
        label: sub?.label ?? sub?.nome ?? '',
        estimuloDiscriminativo: sub?.estimuloDiscriminativo ?? '',
        estimuloReforcadorPositivo: sub?.estimuloReforcadorPositivo ?? '',
        resposta: sub?.resposta ?? '',
        children:
          Array.isArray(sub?.children) && sub.children.every(isPrimitiveOrNull)
            ? padSlots(sub.children, slotCount)
            : Array.from({ length: slotCount }, () => null),
      }));
      return out;
    }

    // CASO 3: nó interno — recursão
    out.children = kids.map((ch: any) => transformGenericNode(ch, slotCount));
    return out;
  }

  // Sem filhos: folha pura — cria slots vazios
  out.children = Array.from({ length: slotCount }, () => null);
  return out;
}

/**
 * VB-MAPP: formato de saída próprio (permiteSubitens, sem subitems). Port
 * de transformVBMappNode.
 */
function transformVBMappNode(node: any): any {
  const out: any = {
    key: String(node?.key ?? node?.id ?? ''),
    label: node?.label ?? node?.nome ?? '',
    estimuloDiscriminativo: node?.estimuloDiscriminativo ?? '',
    estimuloReforcadorPositivo: node?.estimuloReforcadorPositivo ?? '',
    resposta: node?.resposta ?? '',
  };

  const ch = node?.children;

  if (Array.isArray(ch) && ch.length > 0) {
    // Caso 1: folha com array de valores (primitivos/null)
    if (ch.every(isPrimitiveOrNull)) {
      out.children = padSlots(ch, SLOT_COUNT_ATIVIDADE);
      return out;
    }

    const first = ch[0];

    // 2.a) Subitens: objetos sem "children" (ou "children" não-array).
    // Trata array vazio como equivalente a ausente — filterSelectedItemsTree
    // (acima, já roda antes de chegar aqui) força `children: []` em toda
    // folha marcada, então "não tem children de verdade" na prática
    // também é "children é []", não só undefined/não-array.
    if (isObjNode(first) && !(Array.isArray(first.children) && first.children.length > 0)) {
      out.children = ch.map((sub: any) => {
        const subOut: any = {
          key: String(sub?.key ?? sub?.id ?? ''),
          label: sub?.label ?? sub?.nome ?? '',
          permiteSubitens: !!sub?.permiteSubitens,
        };

        if (
          Array.isArray(sub?.children) &&
          sub.children.length > 0 &&
          sub.children.every(isPrimitiveOrNull)
        ) {
          subOut.children = padSlots(sub.children, SLOT_COUNT_ATIVIDADE);
        } else {
          subOut.children = Array.from(
            { length: SLOT_COUNT_ATIVIDADE },
            () => null,
          );
        }

        return subOut;
      });
      return out;
    }

    // 2.b) Nós internos com filhos-objetos — recursão
    out.children = ch.map((child: any) => transformVBMappNode(child));
    return out;
  }

  out.children = Array.from({ length: SLOT_COUNT_ATIVIDADE }, () => null);
  return out;
}

function transformMaintenanceObject(maintenanceObj: MaintenanceObject = {}) {
  return {
    manual: (maintenanceObj?.manual || []).map((n) =>
      transformGenericNode(n, SLOT_COUNT_MANUTENCAO),
    ),
    vbmapp: (maintenanceObj?.vbmapp || []).map((n) =>
      transformGenericNode(n, SLOT_COUNT_MANUTENCAO),
    ),
    portage: (maintenanceObj?.portage || []).map((n) =>
      transformGenericNode(n, SLOT_COUNT_MANUTENCAO),
    ),
  };
}

@Injectable()
export class PeiService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      await prisma.pei.create({
        data: buildCreatePayload(
          {
            ...body,
            terapeutaId: Number(terapeutaId),
          },
          [
            'estimuloDiscriminativo',
            'estimuloReforcadorPositivo',
            'pacienteId',
            'procedimentoEnsinoId',
            'programaId',
            'resposta',
            'metas',
            'terapeutaId',
          ],
        ),
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async delete(programaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.pei.delete({
      where: {
        id: Number(programaId),
      },
    });
  }

  async filtro({ paciente, protocoloId, notSelected = [] }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const protocoloIdCurrent =
      typeof protocoloId == 'object' ? protocoloId.id : protocoloId;

    switch (protocoloIdCurrent) {
      case TIPO_PROTOCOLO_ID.pei:
        try {
          const resultPei = await prisma.pei.findMany({
            select: {
              id: true,
              estimuloDiscriminativo: true,
              estimuloReforcadorPositivo: true,
              procedimentoEnsinoId: true,
              metas: true,
              programa: {
                select: {
                  nome: true,
                  id: true,
                },
              },
              resposta: true,
              paciente: {
                select: {
                  nome: true,
                  id: true,
                },
              },
            },
            where: buildPacienteFilter(paciente.id),
          });

          resultPei.map((item: any) => {
            item.procedimentoEnsino = PROCEDIMENTO_ENSINO.filter(
              (pe: any) => pe.id === item.procedimentoEnsinoId,
            )[0];
          });

          // Protocolo Manual mostra só os próprios programas — nada de
          // VB-MAPP misturado aqui (bug reportado: Mando/Tato/Ouvinte
          // apareciam junto de "Comportamental"). O merge com vbMapp que
          // existia aqui não tinha nenhum consumidor real: a tela que
          // motivou o comentário original (tela de metas) já busca
          // VB-MAPP numa chamada própria (POST /protocolo/meta/filtro),
          // separada desta.
          //
          // Agrupado por programa (era 1 item por registro Pei — 3
          // registros "Comportamental" viravam 3 abas idênticas no
          // Accordion). `entries` preserva cada registro original (com
          // seu id, estímulo/resposta/procedimento próprios) pra
          // editar/excluir continuar agindo sobre o registro certo,
          // sem apagar as outras metas do mesmo programa.
          return this.agruparPeiPorPrograma(resultPei);
        } catch (error) {
          console.log(error);
        }
      case TIPO_PROTOCOLO_ID.portage:
        const resultPortage = await prisma.portage.findFirst({
          select: {
            id: true,
            respostaPortage: true,
            paciente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          where: buildPacienteFilter(paciente.id),
          orderBy: {
            id: 'desc',
          },
        });

        if (!resultPortage) {
          return [];
        }

        const oneResult = resultPortage;
        const portage: any = {
          paciente,
          id: oneResult.id,
        };

        portage.portage = oneResult.respostaPortage;

        const filter = this.filterDataBySelected(portage.portage, notSelected);
        const convertToTreeStructure = await this.formatJsonPortageTelaPEI(
          filter,
          paciente,
        );

        return convertToTreeStructure;

      default:
        return this.getVbmappMetas(paciente.id, notSelected);
    }
  }

  /**
   * Agrupa os registros de Pei (protocolo Manual) por programa — cada
   * programa vira UM item da lista (era um item por registro Pei, então
   * um programa com 3 registros virava 3 abas idênticas no Accordion do
   * front). `entries` guarda cada registro original intacto (id,
   * estímulo/resposta/procedimento e suas próprias metas), pra
   * editar/excluir continuar agindo sobre o registro certo — sem isso,
   * um "editar"/"excluir" na aba agrupada não saberia qual dos vários
   * registros originais mexer.
   */
  private agruparPeiPorPrograma(resultPei: any[]) {
    const porPrograma = new Map<number, any>();

    resultPei.forEach((item: any) => {
      const programaId = item.programa?.id;
      const grupo = porPrograma.get(programaId) || {
        id: programaId,
        programa: item.programa,
        paciente: item.paciente,
        entries: [],
      };

      grupo.entries.push(item);
      porPrograma.set(programaId, grupo);
    });

    return Array.from(porPrograma.values());
  }

  /**
   * Itens já respondidos no vbMapp, no mesmo formato de meta usado pela
   * tela de PEI (transformJsonVBPPEI). Usado pelo case default
   * (protocoloId = vbMapp).
   */
  private async getVbmappMetas(pacienteId: number, notSelected: any[] = []) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.vBMappResultado.findMany({
      select: {
        id: true,
        respostaSessao: true,

        estimuloDiscriminativo: true,
        resposta: true,
        estimuloReforcadorPositivo: true,
        procedimentoEnsinoId: true,
        subitems: true,

        vbmapp: {
          select: {
            id: true,
            nome: true,
            nivel: true,
            programaId: true,
            programa: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        createdAt: true,
        paciente: {
          select: {
            id: true,
            nome: true,
            dataNascimento: true,
          },
        },
      },
      where: buildPacienteFilter(pacienteId, {
        respostaSessao: {
          notIn: notSelected,
        },
      }),
    });

    const transformDataFilterVBMapp = this.transformDataFilterVBMapp(result);

    return this.transformJsonVBPPEI(transformDataFilterVBMapp);
  }

  async transformJsonVBPPEI(inputJson: any) {
    const transformedArray = [];
    const prisma = this.prismaService.getPrismaClient();

    for (const programaNome in inputJson) {
      const metasArray = inputJson[programaNome];

      const metaPreenchida = metasArray.find(
        (m: any) =>
          m.estimuloDiscriminativo ||
          m.resposta ||
          m.estimuloReforcadorPositivo,
      );

      const metaReferencial = metaPreenchida || metasArray[0];

      const {
        estimuloDiscriminativo,
        resposta,
        estimuloReforcadorPositivo,
        procedimentoEnsinoId,
      } = metaReferencial;
      const [procedimentoEnsino] = PROCEDIMENTO_ENSINO.filter(
        (item: any) => item.id === procedimentoEnsinoId,
      );

      const transformedObject = {
        ...metaReferencial,
        permiteSubitens: metaReferencial?.permiteSubitens,
        metas: metasArray.map((m: any) => ({
          id: m.id,
          name: 'meta',
          type: 'input-add',
          value: m.nome,
          labelFor: 'meta',
          subitems:
            m.subitems && m.subitems.length > 0
              ? m.subitems.map((subitem: any) => ({
                  id: subitem.id,
                  name: 'item',
                  type: 'input-add',
                  value: subitem.nome,
                  labelFor: 'item',
                  buttonAdd: true,
                  customCol: 'col-span-5 sm:col-span-5',
                  labelText: 'Item',
                }))
              : null,
          buttonAdd: true,
          customCol: 'col-span-5 sm:col-span-5',
          labelText: 'Meta',
        })),
        programa: {
          id: metaReferencial.programaId,
          nome: programaNome,
        },
        estimuloDiscriminativo,
        resposta,
        estimuloReforcadorPositivo,
        procedimentoEnsino,
      };

      transformedArray.push(transformedObject);
    }

    return transformedArray;
  }

  transformDataFilterVBMapp(data: any[]) {
    const result: any = {};

    data.forEach((item) => {
      const {
        estimuloDiscriminativo,
        respostaSessao,
        resposta,
        estimuloReforcadorPositivo,
        procedimentoEnsinoId,
        subitems,
      } = item;

      // `item.vbmapp` só tem os campos escalares de VBMappAtividades
      // (ver select em getVbmappMetas) — programa é uma relação separada
      // (VBMappAtividades.programa), não um campo direto. Desestruturar
      // `programa` daqui sempre dava undefined, e todo item caía
      // agrupado sob a chave literal "undefined" em vez do nome real do
      // programa (Mando, Tato etc.) — a tela de meta nunca conseguia
      // separar os itens por programa.
      const { id, nome, nivel, programaId } = item.vbmapp;
      const programa = item.vbmapp.programa?.nome;

      const selected = respostaSessao;

      if (!result[programa]) {
        result[programa] = [];
      }

      const existingItem = result[programa].find((i) => i.id === id);

      if (existingItem) {
        if (!existingItem.selected) {
          existingItem.selected = selected;
        }
      } else {
        result[programa].push({
          id,
          nome,
          nivel,
          programa,
          programaId,
          estimuloDiscriminativo,
          resposta,
          estimuloReforcadorPositivo,
          procedimentoEnsinoId,
          respostaSessao,
          subitems,
          ...(selected && { selected }),
        });
      }
    });

    // Ordem do id dentro do programa — a ordem de chegada do banco (sem
    // orderBy em getVbmappMetas) não é confiável pra exibição.
    Object.keys(result).forEach((programa) => {
      result[programa].sort((a: any, b: any) => a.id - b.id);
    });

    return result;
  }

  async formatJsonPortageTelaPEI(dados: any, paciente: any) {
    const transformedArray: any[] = [];
    const prisma = this.prismaService.getPrismaClient();

    for (const programaNome in dados) {
      const [programa] = await prisma.programa.findMany({
        select: {
          id: true,
          nome: true,
        },
        where: {
          nome: programaNome,
        },
      });

      const programaList: any = {
        id: 29,
        permiteSubitens: true,
        procedimentoEnsinoId: 2,
        estimuloDiscriminativo: '',
        estimuloReforcadorPositivo: '',
        resposta: '',
        metas: [],
        programa,
        procedimentoEnsino: {},
      };
      const faixaEtariaObj = dados[programaNome];

      for (const faixaEtaria in faixaEtariaObj) {
        if (faixaEtariaObj.hasOwnProperty(faixaEtaria)) {
          const metas = faixaEtariaObj[faixaEtaria];
          metas.forEach(async (meta) => {
            if (meta.procedimentoEnsinoId) {
              const [procedimentoEnsino] = PROCEDIMENTO_ENSINO.filter(
                (item) => item.id === meta.procedimentoEnsinoId,
              );
              meta.procedimentoEnsino = procedimentoEnsino;
            }

            programaList.metas.push({
              ...meta,
              id: meta.id,
              name: 'meta',
              type: 'input-add',
              value: meta.nome,
              labelFor: 'meta',
              subitems: meta?.subitems
                ? meta.subitems.map((subitem) => ({
                    id: subitem.id,
                    name: 'item',
                    type: 'input-add',
                    value: subitem.nome,
                    labelFor: 'item',
                    buttonAdd: true,
                    customCol: 'col-span-5 sm:col-span-5',
                    labelText: 'Item',
                  }))
                : null,
              buttonAdd: true,
              customCol: 'col-span-5 sm:col-span-5',
              labelText: 'Meta',
            });
          });
        }
      }

      transformedArray.push(programaList);
    }

    return transformedArray;
  }

  filterDataBySelected(data: any, notSelected: string[]) {
    const result: any = {};

    for (const portage in data) {
      const faixasEtarias = data[portage];
      const filteredFaixasEtarias: any = {};

      for (const faixaEtaria in faixasEtarias) {
        const atividades = faixasEtarias[faixaEtaria];

        let filteredAtividades: any[] = [];
        if (notSelected.length) {
          filteredAtividades = atividades
            .map((activity: any) => {
              const cloned = { ...activity };

              if (Array.isArray(cloned.subitems)) {
                cloned.subitems = cloned.subitems.filter(
                  (sub: any) =>
                    sub.hasOwnProperty('selected') &&
                    !notSelected.includes(sub.selected),
                );
              }

              return cloned;
            })
            .filter(
              (activity: any) =>
                activity.hasOwnProperty('selected') &&
                !notSelected.includes(activity.selected),
            );
        } else {
          filteredAtividades = atividades.filter((activity: any) =>
            activity.hasOwnProperty('selected'),
          );
        }

        if (filteredAtividades.length > 0) {
          filteredFaixasEtarias[faixaEtaria] = filteredAtividades;
        }
      }

      if (Object.keys(filteredFaixasEtarias).length > 0) {
        result[portage] = filteredFaixasEtarias;
      }
    }

    return result;
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.pei.update({
      data: buildCreatePayload(
        {
          ...body,
          id: body.id,
        },
        [
          'estimuloDiscriminativo',
          'estimuloReforcadorPositivo',
          'pacienteId',
          'procedimentoEnsinoId',
          'programaId',
          'resposta',
          'metas',
          'id',
        ],
      ),
      where: {
        id: body.id,
      },
    });
  }

  async getActivity(calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.findFirst({
      select: {
        atividades: true,
        selectedKeys: true,

        maintenance: true,
        selectedMaintenanceKeys: true,

        portage: true,
        selectedPortageKeys: true,

        vbmapp: true,
        selectedVbMappKeys: true,
      },
      where: {
        calendarioId,
      },
    });
  }

  async createAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.create({
      data: {
        ...data,
        terapeutaId,
        atividades: data.atividades,
        selectedKeys: data.selectedKeys,

        // Agora maintenance padrão é OBJETO
        maintenance: data.maintenance || {},
        selectedMaintenanceKeys: data.selectedMaintenanceKeys || {},

        selectedPortageKeys: data.selectedPortageKeys || {},
        portage: data.portage || [],

        selectedVbMappKeys: data.selectedVbMappKeys || {},
        vbmapp: data.vbmapp || [],

        peisIds: JSON.stringify(data.peisIds),
      },
    });
  }

  async updateAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const atividade = await prisma.atividadeSessao.findFirst({
      where: { calendarioId: data.calendario },
    });

    if (!atividade) {
      delete data.id;
      return this.createAtividadeSessao(data, terapeutaId);
    }

    return await prisma.atividadeSessao.update({
      data: {
        ...data,
        terapeutaId,
        atividades: data.atividades,
        selectedKeys: data.selectedKeys,

        // OBJETO de manutenção e suas seleções por categoria
        maintenance: data.maintenance || {},
        selectedMaintenanceKeys: data.selectedMaintenanceKeys || {},

        // Portage / VB-Mapp e seleções
        selectedPortageKeys: data.selectedPortageKeys || {},
        portage: data.portage || [],

        selectedVbMappKeys: data.selectedVbMappKeys || {},
        vbmapp: data.vbmapp || [],

        peisIds: JSON.stringify(data.peisIds),
      },
      where: {
        id: atividade.id,
      },
    });
  }

  // ----------------- Helpers de filtragem -----------------

  /** Normaliza maintenance para objeto com arrays */
  private normalizeMaintenanceObject(raw: any): MaintenanceObject {
    const safeArray = (v: any) => (Array.isArray(v) ? v : []);
    if (!raw || typeof raw !== 'object')
      return { manual: [], vbmapp: [], portage: [] };
    return {
      manual: safeArray(raw.manual),
      vbmapp: safeArray(raw.vbmapp),
      portage: safeArray(raw.portage),
    };
  }

  /** Aplica filterTree por categoria e retorna maintenance como OBJETO filtrado */
  private filterMaintenanceObject(
    maint: MaintenanceObject,
    keysByCat: SelectedMaintenanceByCategory,
  ): MaintenanceObject {
    const manualSel = keysByCat?.manual || {};
    const vbmappSel = keysByCat?.vbmapp || {};
    const portageSel = keysByCat?.portage || {};

    return {
      manual: this.filterTree(maint.manual || [], manualSel),
      vbmapp: this.filterTree(maint.vbmapp || [], vbmappSel),
      portage: this.filterTree(maint.portage || [], portageSel),
    };
  }

  /** Checa se a key está selecionada (suporta true OU {checked:true}) */
  private isChecked(keys: SelectionKeys | any, key: string | number): boolean {
    const k = String(key);
    return keys?.[k] === true || keys?.[k]?.checked === true;
  }

  /**
   * Filtra uma ÁRVORE (ARRAY de nós) mantendo:
   * - as folhas cujas keys estão em "keys" (checked)
   * - e os ancestrais necessários para manter a hierarquia
   */
  filterTree(data: TreeNode[] = [], keys: SelectionKeys = {}): TreeNode[] {
    return (data || [])
      .map((item: TreeNode) => {
        const hasChildren =
          Array.isArray(item.children) && item.children.length > 0;

        if (hasChildren) {
          const filteredChildren = this.filterTree(item.children!, keys);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
        }

        if (this.isChecked(keys, item.key)) {
          // folha selecionada
          return { ...item, children: [] };
        }
        return null;
      })
      .filter((item: any): item is TreeNode => item !== null);
  }

  /**
   * Mantém nós (e sua hierarquia) cujas keys foram selecionadas
   * para árvores como Portage / VB-Mapp.
   */
  filterSelectedItemsTree(
    data: TreeNode[] = [],
    keys: SelectionKeys = {},
  ): TreeNode[] {
    const walk = (nodes: TreeNode[]): TreeNode[] =>
      (nodes || [])
        .map((n) => {
          const kids = Array.isArray(n.children) ? walk(n.children) : [];

          if (kids.length > 0 || this.isChecked(keys, n.key)) {
            return { ...n, children: kids, subitems: n?.subitems };
          }
          return null;
        })
        .filter((x): x is any => x !== null);

    return walk(data);
  }

  async activitySession(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();
    const result: any[] = await prisma.atividadeSessao.findMany({
      select: {
        atividades: true,
        maintenance: true,
        portage: true,
        selectedPortageKeys: true,
        selectedMaintenanceKeys: true,
        selectedVbMappKeys: true,
        vbmapp: true,
      },
      where: {
        pacienteId: pacienteId,
      },
    });

    result.map((item) => {
      // ---------- Maintenance como OBJETO ----------
      const maintenanceParse: MaintenanceObject =
        this.normalizeMaintenanceObject(item.maintenance);
      const selectedMaintenanceKeys: SelectedMaintenanceByCategory =
        item.selectedMaintenanceKeys || {};

      const maintenance = this.filterMaintenanceObject(
        maintenanceParse,
        selectedMaintenanceKeys,
      );

      // ---------- Portage ----------
      const portageParse: TreeNode[] = Array.isArray(item.portage)
        ? item.portage
        : [];
      let portage: TreeNode[] = [];
      if (portageParse.length && item?.selectedPortageKeys) {
        portage = this.filterSelectedItemsTree(
          portageParse,
          item.selectedPortageKeys,
        );
      }

      // ---------- VB-Mapp ----------
      const vbMappParse: TreeNode[] = Array.isArray(item?.vbmapp)
        ? item.vbmapp
        : [];
      let vbMapp: TreeNode[] = [];
      if (vbMappParse.length && item?.selectedVbMappKeys) {
        vbMapp = this.filterSelectedItemsTree(
          vbMappParse,
          item.selectedVbMappKeys,
        );
      }

      // Item 7: normaliza cada árvore pro formato final de slots antes de
      // devolver — o transformGenericNode/transformVBMappNode do cliente
      // (useSessionForm.ts) é idempotente em cima desse formato, então
      // passa a virar no-op.
      item.atividades = (Array.isArray(item.atividades) ? item.atividades : []).map(
        (n: any) => transformGenericNode(n, SLOT_COUNT_ATIVIDADE),
      );
      item.maintenance = transformMaintenanceObject(maintenance);
      item.portage = portage.map((n: any) =>
        transformGenericNode(n, SLOT_COUNT_ATIVIDADE),
      );
      item.vbmapp = vbMapp.map((n: any) => transformVBMappNode(n));
      item.selectedMaintenanceKeys = selectedMaintenanceKeys;
    });

    return result[0];
  }

  getProcedimentoEnsino() {
    return PROCEDIMENTO_ENSINO;
  }
  getMetas() {
    return METAS;
  }
}
