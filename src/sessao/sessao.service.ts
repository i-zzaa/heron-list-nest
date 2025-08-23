import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { dateAddtDay, dateFormatDDMMYYYY } from 'src/util/format-date';
import { TYPE_DTT, calcAcertos } from 'src/util/util';
import { inspect } from 'util';

// --- helpers de chave estável ---
type ProtocolKey = 'manual' | 'vbmapp' | 'portage';

interface LeafEntry {
  key: string; // chave única do item/subitem (folha)
  value: number; // 0..100
  path: Array<string | number>;
  parentKey: string; // chave única do pai (meta/bloco)
  parentTree: any; // a árvore que deve ir para manutenção (meta/bloco)
  protocol: ProtocolKey;
  parentLeafCount: number; // total de folhas sob o pai
  // ancestrais reais (para preservar labels do primeiro nível)
  programTree?: any; // MANUAL: programa
  nivelTree?: any; // VBMAPP: nível
  programaTree?: any; // VBMAPP: programa
}

@Injectable()
export class SessaoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  async getAll(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const data = await prisma.sessao.findMany({
      select: {
        id: true,
        resumo: true,
        sessao: true,
        paciente: {
          select: {
            nome: true,
            responsavel: true,
          },
        },
        evento: {
          select: {
            especialidade: true,
            dataInicio: true,
            terapeuta: {
              select: {
                usuario: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });

    const result = await Promise.all(
      data.map(async (item: any) => {
        const sessoes = JSON.parse(item.sessao);
        item.sessoes = await Promise.all(
          sessoes.map((sessao: any) => {
            sessao.children.map((children: any) => {
              const consecutive3 =
                children.loop[0] && children.loop[1] && children.loop[2];
              const trueCount = children.loop.filter(
                (child: any) => !!child,
              ).length;

              children.porcentagem = consecutive3
                ? 100
                : (trueCount / children.loop.length) * 100;

              return children;
            });

            return sessao;
          }),
        );

        return item;
      }),
    );

    return result;
  }

  async get(calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();
    const data: any = await prisma.sessao.findFirst({
      select: {
        id: true,
        resumo: true,
        sessao: true,
        maintenance: true,
        portage: true,
        vbmapp: true,
        selectedMaintenanceKeys: true,
      },
      where: {
        calendarioId: Number(calendarioId),
      },
    });

    if (Boolean(data?.sessao)) {
      data.sessao = data.sessao;
      data.selectedMaintenanceKeys = data.selectedMaintenanceKeys;
      data.maintenance = data.maintenance;

      // por compatibilidade
      data.vbmapp = data.vbmapp || [];
      data.portage = data.portage || [];
    }

    return data;
  }

  async create(body: any, login: string) {
    const prisma = this.prismaService.getPrismaClient();
    const dateFim = dateAddtDay(body.date, 1);

    // const evento = await this.agendaService.updateCalendarioMobile(
    //   body.calendarioId,
    //   login,
    //   body.date,
    //   dateFim,
    // );

    const { groupId } = await prisma.calendario.findUnique({
      select: {
        groupId: true,
      },
      where: {
        id: body.calendarioId,
      },
    });

    const calendarioIdPai = await prisma.calendario.findFirst({
      select: {
        id: true,
      },
      where: {
        groupId,
      },
      orderBy: { id: 'asc' },
      take: 1,
    });

    delete body.date;

    // await prisma.sessao.create({
    //   data: {
    //     ...body,
    //     sessao: body.sessao || [],
    //     calendarioId: evento.id,
    //   },
    // });

    await this.updateMaintenance(body.pacienteId, calendarioIdPai.id);

    return;
  }

  isTaskCompleted(childrenArray: any[]) {
    const fourCWithNulls =
      childrenArray.slice(0, 4).every((child) => child === 'C') &&
      childrenArray.slice(4).every((child) => child === null);

    const allCs = childrenArray.every((child) => child === 'C');

    return fourCWithNulls || allCs;
  }

  processActivities(node: any[]) {
    const taskCompletionCount: Record<string, number> = {};
    const manutencao: any[] = [];

    node.forEach((group: any[]) => {
      group.forEach((item: any) => {
        item.children.forEach((meta: any) => {
          meta.children.forEach((task: any) => {
            const taskKey = `${task.key}`;

            if (this.isTaskCompleted(task.children)) {
              // Contabiliza quantas vezes a tarefa foi completada 100%
              if (taskCompletionCount[taskKey]) {
                taskCompletionCount[taskKey]++;
              } else {
                taskCompletionCount[taskKey] = 1;
              }

              // Se completou 100% 3 vezes, move toda a árvore para manutenção
              if (taskCompletionCount[taskKey] === 3) {
                const existingIndex = manutencao.findIndex(
                  (m) => m.key === item.key,
                );

                if (existingIndex !== -1) {
                  const existingMetaIndex = manutencao[
                    existingIndex
                  ].children.findIndex((m: any) => m.key === meta.key);

                  if (existingMetaIndex !== -1) {
                    manutencao[existingIndex].children[
                      existingMetaIndex
                    ].children.push({
                      key: task.key,
                      label: task.label,
                      disabled: task.disabled,
                    });
                  } else {
                    manutencao[existingIndex].children.push({
                      key: meta.key,
                      label: meta.label,
                      children: [
                        {
                          key: task.key,
                          label: task.label,
                          disabled: task.disabled,
                        },
                      ],
                    });
                  }
                } else {
                  manutencao.push({
                    key: item.key,
                    label: item.label,
                    children: [
                      {
                        key: meta.key,
                        label: meta.label,
                        children: [
                          {
                            key: task.key,
                            label: task.label,
                            disabled: task.disabled,
                          },
                        ],
                      },
                    ],
                  });
                }
              }
            }
          });
        });
      });
    });

    // Remove apenas as tarefas que foram movidas para manutenção do array original
    node.forEach((group: any[]) => {
      group.forEach((item: any) => {
        item.data = item.key;

        item.children.forEach((meta: any) => {
          meta.data = meta.key;

          meta.children = meta.children.filter((task: any) => {
            task.data = task.key;
            const taskKey = `${task.key}`;

            delete task.children;
            return !(taskCompletionCount[taskKey] === 3);
          });
        });
      });
    });

    return {
      manutencao,
      atividades: node[0],
    };
  }

  // ===== helpers =====
  private countLeavesManual(meta: any): number {
    const itens = Array.isArray(meta?.children) ? meta.children : [];
    return itens.length;
  }

  private countLeavesFlat(meta: any): number {
    const itens = Array.isArray(meta?.children) ? meta.children : [];
    return itens.length;
  }

  // ===== Helpers p/ manutenção =====

  // Clona raso SEM children (preserva label/props do nível)
  private shallowNoChildren(node: any) {
    if (!node || typeof node !== 'object') return node;
    const { children: _c, ...rest } = node;
    return { ...rest };
  }

  // Remove o último nível (respostas) dos itens de um meta
  private stripItemResponses(meta: any) {
    const itens = Array.isArray(meta?.children) ? meta.children : [];
    const cleanedItems = itens.map((it: any) => {
      const { children, ...rest } = it || {};
      return { ...rest }; // mantém dados do item, remove o array de respostas
    });
    return { ...meta, children: cleanedItems };
  }

  // Monta wrapper do 1º nível preservando labels reais (manual/vbmapp). Portage não tem wrapper.
  private wrapWithFirstLevel(
    protocol: ProtocolKey,
    levelPath: (string | number)[],
    metaClean: any,
    ancestors: { programTree?: any; nivelTree?: any; programaTree?: any } = {},
  ) {
    if (protocol === 'manual') {
      const prog = ancestors.programTree
        ? this.shallowNoChildren(ancestors.programTree)
        : {
            key: String(levelPath?.[0] ?? 'programa'),
            label: String(levelPath?.[0] ?? 'programa'),
          };
      return { ...prog, children: [metaClean] };
    }

    if (protocol === 'vbmapp') {
      const nivel = ancestors.nivelTree
        ? this.shallowNoChildren(ancestors.nivelTree)
        : {
            key: String(levelPath?.[0] ?? 'nivel'),
            label: String(levelPath?.[0] ?? 'nivel'),
          };
      const programa = ancestors.programaTree
        ? this.shallowNoChildren(ancestors.programaTree)
        : {
            key: String(levelPath?.[1] ?? 'programa'),
            label: String(levelPath?.[1] ?? 'programa'),
          };
      return { ...nivel, children: [{ ...programa, children: [metaClean] }] };
    }

    // PORTAGE: lista de metas diretamente
    return metaClean;
  }

  // Chave estável do 1º nível (Portage: uma chave por META)
  private firstLevelKey(
    protocol: ProtocolKey,
    levelPath: (string | number)[],
    meta: any,
  ) {
    const p0 = String(levelPath?.[0] ?? '');
    const p1 = String(levelPath?.[1] ?? '');
    if (protocol === 'manual') return `${protocol}|${p0}`;
    if (protocol === 'vbmapp') return `${protocol}|${p0}|${p1}`;
    const metaId = meta?.key ?? meta?.id ?? meta?.label ?? 'meta';
    return `${protocol}|${metaId}`;
  }

  // Faz merge do wrapper no bucket por protocolo, agrupando metas
  private mergeIntoMaintenanceBucket(
    bucketMap: Map<string, any>,
    protocol: ProtocolKey,
    levelPath: (string | number)[],
    metaClean: any,
    ancestors: { programTree?: any; nivelTree?: any; programaTree?: any },
  ) {
    const key = this.firstLevelKey(protocol, levelPath, metaClean);
    const wrapper = this.wrapWithFirstLevel(
      protocol,
      levelPath,
      metaClean,
      ancestors,
    );

    if (!bucketMap.has(key)) {
      bucketMap.set(key, wrapper);
      return;
    }

    const current = bucketMap.get(key);

    const mergeMetaList = (list: any[], meta: any) => {
      const metas = Array.isArray(list) ? list : [];
      const idOf = (m: any) => m?.key ?? m?.id ?? m?.label;
      const idx = metas.findIndex((m: any) => idOf(m) === idOf(meta));
      if (idx === -1) {
        metas.push(meta);
      } else {
        const oldItems = Array.isArray(metas[idx].children)
          ? metas[idx].children
          : [];
        const newItems = Array.isArray(meta.children) ? meta.children : [];
        const seen = new Set(
          oldItems.map((i: any) => i?.key ?? i?.id ?? i?.label),
        );
        metas[idx].children = [
          ...oldItems,
          ...newItems.filter(
            (i: any) => !seen.has(i?.key ?? i?.id ?? i?.label),
          ),
        ];
      }
      return metas;
    };

    if (protocol === 'manual') {
      current.children = mergeMetaList(current.children, metaClean);
    } else if (protocol === 'vbmapp') {
      // nível -> [ programa -> metas ]
      const programas = Array.isArray(current.children) ? current.children : [];
      const programaKey = String(levelPath?.[1] ?? 'programa');
      const idOf = (x: any) => x?.key ?? x?.id ?? x?.label;
      let programa = programas.find((p: any) => idOf(p) === programaKey);
      if (!programa) {
        programas.push({
          key: programaKey,
          label: programaKey,
          children: [metaClean],
        });
      } else {
        programa.children = mergeMetaList(programa.children, metaClean);
      }
      current.children = programas;
    } else {
      // portage: é lista de metas
      current.children = mergeMetaList(current.children, metaClean);
    }

    bucketMap.set(key, current);
  }

  // ========== ATUALIZA MANUTENÇÃO (3 últimas sessões) ==========
  async updateMaintenance(pacienteId: number, calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const sessions = await prisma.sessao.findMany({
      select: {
        sessao: true, // MANUAL (array de programas)
        vbmapp: true, // VB-MAPP (nível -> programa -> metas)
        portage: true, // PORTAGE (lista de metas)
      },
      where: { pacienteId },
      orderBy: { id: 'desc' },
      take: 3,
    });

    if (sessions.length < 3) return;

    const ordered = [...sessions].reverse();

    // Garanta que tudo está em objeto (e não string JSON)
    const parsed = ordered.map((s: any) => {
      return {
        sessao: this.safeJsonParse(s.sessao) ?? s.sessao,
        vbmapp: this.safeJsonParse(s.vbmapp) ?? s.vbmapp,
        portage: this.safeJsonParse(s.portage) ?? s.portage,
      };
    });

    // extrai folhas de CADA sessão
    const perSessionLeaves = parsed.map((s: any) => {
      const manualLeaves = this.extractLeavesFromManual(s.sessao);
      const vbmappLeaves = this.extractLeavesFromVbmappFlat(s.vbmapp);
      const portageLeaves = this.extractLeavesFromPortageFlat(s.portage);
      return [...manualLeaves, ...vbmappLeaves, ...portageLeaves];
    });

    const { manutencao, toRemove } =
      this.buildMaintenanceFromThreeSessions(perSessionLeaves);

    // se nada bateu 3x 100%, não há o que promover
    if (
      !manutencao.manual.length &&
      !manutencao.vbmapp.length &&
      !manutencao.portage.length
    )
      return;

    // Carrega árvores ativas MAIS RECENTES (como arrays)
    const latest = ordered[2];

    const manualAtivo = this.safeJsonParse(latest?.sessao) || [];
    const vbmappAtivo = this.safeJsonParse(latest?.vbmapp) || [];
    const portageAtivo = this.safeJsonParse(latest?.portage) || [];

    // Podas específicas de cada protocolo
    const manualFiltrado = this.pruneManualActive(
      manualAtivo,
      new Set(toRemove.parents.manual),
      new Set(toRemove.leafs),
    );

    const vbmappFiltrado = this.pruneVbmappChildrenActive(
      vbmappAtivo,
      new Set(toRemove.parents.vbmapp),
      new Set(toRemove.leafs),
    );

    const portageFiltrado = this.prunePortageActive(
      portageAtivo,
      new Set(toRemove.parents.portage),
      new Set(toRemove.leafs),
    );

    // Payload de manutenção (1º nível preservado, último nível removido)
    const maintenancePayload = {
      manual: manutencao.manual,
      vbmapp: manutencao.vbmapp,
      portage: manutencao.portage,
    };

    await this.updateAtividadeSessao({
      calendarioId,
      maintenance: maintenancePayload,
      atividades: manualFiltrado,
      vbmapp: vbmappFiltrado,
      portage: portageFiltrado,
    });
  }

  async updateSumary(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.sessao.update({
      data: body,
      where: {
        id: body.id,
      },
    });
  }

  async createProtocolo(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.protocolo.createMany({
      data: body,
    });
  }

  async createAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.createMany({
      data: body,
    });
  }

  async updateAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.update({
      data: {
        ...body,
      },
      where: {
        calendarioId: body.calendarioId,
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.sessao.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getProtocoloByPacient(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const result: any = await prisma.protocolo.findMany({
      select: {
        id: true,
        protocolo: true,
        protocoloSet: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const last = result.at(-1);
    return {
      ...last,
      protocolo: JSON.parse(last.protocolo),
      protocoloSet: JSON.parse(last.protocoloSet),
    };
  }

  async getAtividadeSessaoByPacient(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      const result: any = await prisma.sessao.findMany({
        select: {
          sessao: true,
          createdAt: true,
          evento: true,
        },
        where: {
          pacienteId: Number(pacienteId),
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const sessoes: any[] = [];
      await Promise.all(
        result.map((item: any) => {
          const programas = Array.isArray(item.sessao)
            ? item.sessao
            : JSON.parse(item.sessao);

          programas.map((programa: any) => {
            const current: any[] = [];
            const metas = programa.children;
            metas.map((meta: any) => {
              const subtItem = meta.children;

              subtItem.map((sub: any) => {
                current.push({
                  programa: sub.label,
                  primeiraResposta: sub.children[0] === TYPE_DTT.c,
                  data: dateFormatDDMMYYYY(item.evento.dataInicio),
                  porcentagem: calcAcertos(sub.children),
                });
              });
            });

            sessoes.push({
              programa: programa.label,
              children: current,
            });
          });

          delete item.evento;
        }),
      );

      const programasFormatados: any[] = [];

      await Promise.all(
        sessoes.map((item: any) => {
          const formatted: any[] = [];

          let qtdColumns = 0;

          item.children.map((meta: any) => {
            const se = formatted.filter(
              (sessao: any) => sessao.programa === meta.programa,
            )[0];

            if (Boolean(se)) {
              se.dias.push({
                primeiraResposta: meta.primeiraResposta,
                data: meta.data,
                porcentagem: meta.porcentagem,
              });
            } else {
              formatted.push({
                programa: meta.programa,

                dias: [
                  {
                    primeiraResposta: meta.primeiraResposta,
                    data: meta.data,
                    porcentagem: meta.porcentagem,
                  },
                ],
              });
            }

            if (Boolean(se)) {
              qtdColumns =
                se.dias.length > qtdColumns ? se.dias.length : qtdColumns;
            } else {
              formatted.map((column) => {
                qtdColumns =
                  column.dias.length > qtdColumns
                    ? column.dias.length
                    : qtdColumns;
              });
            }
          });

          programasFormatados.push({
            programa: item.programa,
            children: formatted,
            qtdColumns,
          });
        }),
      );

      const groupedData = programasFormatados.reduce(
        (acc: any[], current: any) => {
          const programa = current.programa;
          const existingProgram = acc.find(
            (item) => item.programa === programa,
          );

          if (existingProgram) {
            current.children.forEach((child: any) => {
              const existingChild = existingProgram.children.find(
                (c: any) => c.programa === child.programa,
              );
              if (existingChild) {
                existingChild.dias.push(...child.dias);
              } else {
                existingProgram.children.push({ ...child });
              }
            });

            // Atualiza qtdColumns para o maior tamanho de dias encontrado
            existingProgram.qtdColumns = Math.max(
              ...existingProgram.children.map(
                (child: any) => child.dias.length,
              ),
            );
          } else {
            // Inicia qtdColumns com o tamanho do primeiro children
            const qtdColumns = Math.max(
              ...current.children.map((child: any) => child.dias.length),
            );
            acc.push({
              programa: programa,
              children: [...current.children],
              qtdColumns: qtdColumns,
            });
          }

          return acc;
        },
        [],
      );

      return groupedData;
    } catch (error) {
      console.log(error);
    }
  }

  private makeKey(params: {
    protocol: ProtocolKey;
    levelPath: (string | number)[];
    metaId?: string | number;
    itemId?: string | number;
    subitemId?: string | number;
  }) {
    const { protocol, levelPath, metaId, itemId, subitemId } = params;
    return [
      protocol,
      ...levelPath.map(String),
      metaId ?? '',
      itemId ?? '',
      subitemId ?? '',
    ].join('|');
  }

  private makeParentKey(params: {
    protocol: ProtocolKey;
    levelPath: (string | number)[];
    metaId?: string | number;
  }) {
    const { protocol, levelPath, metaId } = params;
    return [protocol, ...levelPath.map(String), metaId ?? ''].join('|');
  }

  // --- EXTRATOR MANUAL (programas -> metas -> subitens) ---
  private extractLeavesFromManual(sessaoField: any): LeafEntry[] {
    if (!sessaoField) return [];
    const programas = Array.isArray(sessaoField)
      ? sessaoField
      : this.safeJsonParse(sessaoField);
    if (!Array.isArray(programas)) return [];

    const out: LeafEntry[] = [];

    for (const programa of programas) {
      const levelPath: (string | number)[] = [
        programa?.id ?? programa?.key ?? programa?.label ?? 'prog',
      ];
      const programTree = this.shallowNoChildren(programa); // mantém label real do programa

      const metas = programa?.children ?? [];
      for (const meta of metas) {
        const metaId = meta?.id ?? meta?.key ?? meta?.label;
        const parentKey = this.makeParentKey({
          protocol: 'manual',
          levelPath,
          metaId,
        });
        const parentTree = meta;
        const parentLeafCount = this.countLeavesManual(meta);

        const items = meta?.children ?? [];
        for (const item of items) {
          const itemId = item?.id ?? item?.key ?? item?.label;
          const percent = Number(calcAcertos(item?.children ?? [])) || 0;

          const key = this.makeKey({
            protocol: 'manual',
            levelPath,
            metaId,
            itemId,
          });

          out.push({
            key,
            value: percent,
            path: levelPath,
            parentKey,
            parentTree,
            protocol: 'manual',
            parentLeafCount,
            programTree,
          });
        }
      }
    }

    return out;
  }

  private pruneVbmappChildrenActive(
    vbmapp: any[],
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    const raiz = Array.isArray(vbmapp) ? vbmapp : [];

    return raiz.map((nivel: any) => {
      const nivelPath: (string | number)[] = [
        nivel?.key ?? nivel?.label ?? 'nivel',
      ];
      const programas = Array.isArray(nivel?.children) ? nivel.children : [];

      const newProgramas = programas.map((programa: any) => {
        const levelPath = [
          ...nivelPath,
          programa?.key ?? programa?.label ?? 'programa',
        ];
        const metas = Array.isArray(programa?.children)
          ? programa.children
          : [];

        const newMetas = metas
          .map((meta: any) => {
            const metaId = meta?.key ?? meta?.id ?? meta?.label;
            const parentKey = this.makeParentKey({
              protocol: 'vbmapp',
              levelPath,
              metaId,
            });
            if (toRemoveParents.has(parentKey)) return null;

            const itens = Array.isArray(meta?.children) ? meta.children : [];
            const newItens = itens.filter((item: any) => {
              const itemId = item?.key ?? item?.id ?? item?.label;
              const leafKey = this.makeKey({
                protocol: 'vbmapp',
                levelPath,
                metaId,
                itemId,
              });
              return !toRemoveLeafs.has(leafKey);
            });

            if (!newItens.length) return null; // remove meta vazia
            return { ...meta, children: newItens };
          })
          .filter(Boolean);

        return { ...programa, children: newMetas };
      });

      return { ...nivel, children: newProgramas };
    });
  }

  // --- EXTRATOR VB-MAPP (nível -> programa -> metas -> itens) ---
  private extractLeavesFromVbmappFlat(vbmappField: any): LeafEntry[] {
    const raiz = this.safeJsonParse(vbmappField);
    if (!Array.isArray(raiz)) return [];

    const out: LeafEntry[] = [];

    for (const nivel of raiz) {
      const nivelPath: (string | number)[] = [
        nivel?.key ?? nivel?.label ?? 'nivel',
      ];
      const nivelTree = this.shallowNoChildren(nivel); // label real do NÍVEL
      const programas = Array.isArray(nivel?.children) ? nivel.children : [];

      for (const programa of programas) {
        const levelPath = [
          ...nivelPath,
          programa?.key ?? programa?.label ?? 'programa',
        ];
        const programaTree = this.shallowNoChildren(programa); // label real do PROGRAMA
        const metas = Array.isArray(programa?.children)
          ? programa.children
          : [];

        for (const meta of metas) {
          const metaId = meta?.key ?? meta?.id ?? meta?.label;
          const parentKey = this.makeParentKey({
            protocol: 'vbmapp',
            levelPath,
            metaId,
          });
          const parentTree = meta;

          const itens = Array.isArray(meta?.children) ? meta.children : [];
          const parentLeafCount = itens.length || 1;

          for (const item of itens) {
            const itemId = item?.key ?? item?.id ?? item?.label;
            const value = Number(calcAcertos(item?.children ?? [])) || 0;

            const key = this.makeKey({
              protocol: 'vbmapp',
              levelPath,
              metaId,
              itemId,
            });

            out.push({
              key,
              value,
              path: levelPath,
              parentKey,
              parentTree,
              protocol: 'vbmapp',
              parentLeafCount,
              nivelTree,
              programaTree,
            });
          }
        }
      }
    }

    return out;
  }

  // --- EXTRATOR PORTAGE (lista de metas -> itens) ---
  private extractLeavesFromPortageFlat(portageField: any): LeafEntry[] {
    const raiz = this.safeJsonParse(portageField);
    if (!Array.isArray(raiz)) return [];

    const out: LeafEntry[] = [];
    const levelPath: (string | number)[] = ['root'];

    for (const meta of raiz) {
      const metaId = meta?.key ?? meta?.id ?? meta?.label;
      const parentKey = this.makeParentKey({
        protocol: 'portage',
        levelPath,
        metaId,
      });
      const parentTree = meta;

      const itens = Array.isArray(meta?.children) ? meta.children : [];
      const parentLeafCount = itens.length || 1;

      for (const item of itens) {
        const itemId = item?.key ?? item?.id ?? item?.label;
        const value = Number(calcAcertos(item?.children ?? [])) || 0;

        const key = this.makeKey({
          protocol: 'portage',
          levelPath,
          metaId,
          itemId,
        });

        out.push({
          key,
          value,
          path: levelPath,
          parentKey,
          parentTree,
          protocol: 'portage',
          parentLeafCount,
        });
      }
    }

    return out;
  }

  private prunePortageActive(
    metas: any[],
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    const levelPath: (string | number)[] = ['root'];

    return (metas || [])
      .map((meta: any) => {
        const metaId = meta?.key ?? meta?.id ?? meta?.label;
        const parentKey = this.makeParentKey({
          protocol: 'portage',
          levelPath,
          metaId,
        });
        if (toRemoveParents.has(parentKey)) return null;

        const newItems = (meta?.children || []).filter((item: any) => {
          const itemId = item?.key ?? item?.id ?? item?.label;
          const leafKey = this.makeKey({
            protocol: 'portage',
            levelPath,
            metaId,
            itemId,
          });
          return !toRemoveLeafs.has(leafKey);
        });

        if (!newItems.length) return null; // remove meta vazia
        return { ...meta, children: newItems };
      })
      .filter(Boolean);
  }

  // --- combinador e regra 3x 100% (com os 3 protocolos) ---
  private buildMaintenanceFromThreeSessions(perSessionLeaves: LeafEntry[][]) {
    const maintenanceByProtocol = {
      manual: new Map<string, any>(), // chave 1º nível -> wrapper {programa -> [metas]}
      vbmapp: new Map<string, any>(), // chave 1º nível -> wrapper {nível -> [programa -> [metas]]}
      portage: new Map<string, any>(), // chave por meta (lista de metas)
    };

    const toRemoveParents = {
      manual: new Set<string>(),
      vbmapp: new Set<string>(),
      portage: new Set<string>(),
    };
    const toRemoveLeafs = new Set<string>(); // chaves das folhas a remover SEMPRE do ativo

    // mapas por sessão para lookup rápido
    const maps = perSessionLeaves.map((leaves) => {
      const m = new Map<string, LeafEntry>();
      for (const leaf of leaves) m.set(leaf.key, leaf);
      return m;
    });

    if (maps.length < 3) {
      return {
        manutencao: { manual: [], vbmapp: [], portage: [] },
        toRemove: {
          parents: { manual: [], vbmapp: [], portage: [] },
          leafs: [],
        },
      };
    }

    // folhas presentes nas 3 sessões e 100% em todas
    const keys100 = [...maps[0].keys()].filter((k) => {
      const a = maps[0].get(k),
        b = maps[1].get(k),
        c = maps[2].get(k);
      return (
        a && b && c && a.value === 100 && b.value === 100 && c.value === 100
      );
    });

    // qualquer folha 100% nas 3 sessões deve sair do ativo
    keys100.forEach((k) => toRemoveLeafs.add(k));

    // agrupa por pai (meta/bloco)
    interface ParentInfo {
      protocol: ProtocolKey;
      parentTree: any;
      parentLeafCount: number; // total de folhas sob o pai
      completedKeys: Set<string>; // chaves de folhas concluídas (100% nas 3)
      levelPath: (string | number)[]; // caminho para montar 1º nível
      programTree?: any;
      nivelTree?: any;
      programaTree?: any;
    }
    const byParent = new Map<string, ParentInfo>();

    for (const k of keys100) {
      const leaf = maps[2].get(k)!; // sessão mais recente
      if (!byParent.has(leaf.parentKey)) {
        byParent.set(leaf.parentKey, {
          protocol: leaf.protocol,
          parentTree: leaf.parentTree,
          parentLeafCount: leaf.parentLeafCount || 1,
          completedKeys: new Set<string>(),
          levelPath: leaf.path,
          programTree: leaf.programTree,
          nivelTree: leaf.nivelTree,
          programaTree: leaf.programaTree,
        });
      }
      byParent.get(leaf.parentKey)!.completedKeys.add(k);
    }

    // decide promoção e remoção do pai
    for (const [parentKey, info] of byParent.entries()) {
      const bucket = maintenanceByProtocol[info.protocol];

      // 1) limpa respostas (último nível)
      const metaClean = this.stripItemResponses(info.parentTree);
      // 2) embrulha no 1º nível (ou meta direta no portage) e faz merge no bucket
      this.mergeIntoMaintenanceBucket(
        bucket,
        info.protocol,
        info.levelPath,
        metaClean,
        {
          programTree: info.programTree,
          nivelTree: info.nivelTree,
          programaTree: info.programaTree,
        },
      );

      const allDone = info.completedKeys.size >= (info.parentLeafCount || 1);
      const onlyOne = (info.parentLeafCount || 1) === 1;

      if (allDone || onlyOne) {
        toRemoveParents[info.protocol].add(parentKey);
      }
    }

    return {
      manutencao: {
        manual: [...maintenanceByProtocol.manual.values()],
        vbmapp: [...maintenanceByProtocol.vbmapp.values()],
        portage: [...maintenanceByProtocol.portage.values()],
      },
      toRemove: {
        parents: {
          manual: [...toRemoveParents.manual],
          vbmapp: [...toRemoveParents.vbmapp],
          portage: [...toRemoveParents.portage],
        },
        leafs: [...toRemoveLeafs],
      },
    };
  }

  // ===== podas (remoção do ativo) =====
  // Manual: programa -> metas -> itens (cada item é uma folha)
  private pruneManualActive(
    programas: any[],
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    return (programas || []).map((prog: any) => {
      const levelPath = [prog?.id ?? prog?.key ?? prog?.label ?? 'prog'];
      const metas = (prog?.children || [])
        .map((meta: any) => {
          const metaId = meta?.id ?? meta?.key ?? meta?.label;
          const parentKey = this.makeParentKey({
            protocol: 'manual',
            levelPath,
            metaId,
          });

          // remove PAI inteiro?
          if (toRemoveParents.has(parentKey)) return null;

          // senão, filtra itens (folhas)
          const items = (meta?.children || []).filter((item: any) => {
            const itemId = item?.id ?? item?.key ?? item?.label;
            const leafKey = this.makeKey({
              protocol: 'manual',
              levelPath,
              metaId,
              itemId,
            });
            return !toRemoveLeafs.has(leafKey);
          });

          // meta vazia some
          if (!items.length) return null;

          return { ...meta, children: items };
        })
        .filter(Boolean);

      return { ...prog, children: metas };
    });
  }

  // VB-MAPP/PORTAGE: array plano de metas -> subitens (genérico, mantido por compatibilidade)
  private pruneFlatProtocolActive(
    metas: any[],
    protocol: Extract<ProtocolKey, 'vbmapp' | 'portage'>,
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    const levelPath = ['root'];
    const pruned = (Array.isArray(metas) ? metas : [])
      .map((meta: any) => {
        const metaId = meta?.id ?? meta?.key ?? meta?.label;
        const parentKey = this.makeParentKey({ protocol, levelPath, metaId });

        if (toRemoveParents.has(parentKey)) return null;

        const children = (
          Array.isArray(meta?.children) ? meta.children : []
        ).filter((item: any) => {
          const itemId = item?.id ?? item?.key ?? item?.label;
          const leafKey = this.makeKey({ protocol, levelPath, metaId, itemId });
          return !toRemoveLeafs.has(leafKey);
        });

        if (!children.length) return null;
        return { ...meta, children };
      })
      .filter(Boolean);

    return pruned;
  }

  private safeJsonParse(v: any) {
    if (!v) return null;
    if (typeof v === 'object') return v;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
}
