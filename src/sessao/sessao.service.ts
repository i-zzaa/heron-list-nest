import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { dateAddtDay, dateFormatDDMMYYYY } from 'src/util/format-date';
import { TYPE_DTT, calcAcertos } from 'src/util/util';
import { inspect } from 'util';

// --- helpers de chave estável ---
type ProtocolKey = 'manual' | 'vbmapp' | 'portage';

interface LeafEntry {
  key: string;               // chave única do item/subitem (folha)
  value: number;             // 0..100
  path: Array<string | number>;
  parentKey: string;         // chave única do pai (meta/bloco)
  parentTree: any;           // a árvore que deve ir para manutenção (meta/bloco)
  protocol: ProtocolKey;
  parentLeafCount: number;   // total de folhas sob o pai
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
        groupId: true
      },
      where: {
        id: body.calendarioId
      }
    })

    const calendarioIdPai = await prisma.calendario.findFirst({
      select: {
        id: true
      },
      where: {
       groupId
      },
      orderBy: { id: 'asc' },
      take: 1
    })

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

  isTaskCompleted(childrenArray) {
    const fourCWithNulls =
      childrenArray.slice(0, 4).every((child) => child === 'C') &&
      childrenArray.slice(4).every((child) => child === null);

    const allCs = childrenArray.every((child) => child === 'C');

    return fourCWithNulls || allCs;
  }

  processActivities(node) {
    const taskCompletionCount = {};
    const manutencao = [];

    node.forEach((group) => {
      group.forEach((item) => {
        item.children.forEach((meta) => {
          meta.children.forEach((task) => {
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
                // Adicionar ao array de manutenção a estrutura completa
                const existingIndex = manutencao.findIndex(
                  (m) => m.key === item.key,
                );

                if (existingIndex !== -1) {
                  const existingMetaIndex = manutencao[
                    existingIndex
                  ].children.findIndex((m) => m.key === meta.key);

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
    node.forEach((group) => {
      group.forEach((item) => {
        item.data = item.key;

        item.children.forEach((meta) => {
          meta.data = meta.key;

          meta.children = meta.children.filter((task) => {
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

  // ========== ATUALIZA MANUTENÇÃO (3 últimas sessões) ==========
  async updateMaintenance(pacienteId: number, calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const sessions = await prisma.sessao.findMany({
      select: {
        sessao: true,   // MANUAL (array de programas)
        vbmapp: true,   // VB-MAPP (array plano de metas)
        portage: true,  // PORTAGE (array plano de metas)
      },
      where: { pacienteId },
      orderBy: { id: 'desc' },
      take: 3,
    });


    if (sessions.length < 3) return;

    const ordered = [...sessions].reverse();

    // Garanta que tudo está em objeto (e não string JSON)
    const parsed = ordered.map((s: any) => {
// console.log(s);

  return    {
      sessao:  this.safeJsonParse(s.sessao)  ?? s.sessao,
      vbmapp:  this.safeJsonParse(s.vbmapp)  ?? s.vbmapp,
      portage: this.safeJsonParse(s.portage) ?? s.portage,
    }
    });

    // console.log(parsed);

    



    // // Logs úteis
    // console.log('3 últimas sessões (expandidas):\n',
    //   inspect(parsed, { depth: null, colors: true })
    // );
    // console.log('Tamanhos:', {
    //   sessao:  parsed.map(s => Array.isArray(s.sessao)  ? s.sessao.length  : 0),
    //   vbmapp:  parsed.map(s => Array.isArray(s.vbmapp)  ? s.vbmapp.length  : 0),
    //   portage: parsed.map(s => Array.isArray(s.portage) ? s.portage.length : 0),
    // });


    // extrai folhas de CADA sessão
    const perSessionLeaves = parsed.map((s: any) => {
      const manualLeaves  = this.extractLeavesFromManual(s.sessao);
      const vbmappLeaves  = this.extractLeavesFromVbmappFlat(s.vbmapp);
      const portageLeaves = this.extractLeavesFromPortageFlat(s.portage);
      return [...manualLeaves, ...vbmappLeaves, ...portageLeaves];
    });

// console.log(perSessionLeaves);


  const { manutencao, toRemove } = this.buildMaintenanceFromThreeSessions(perSessionLeaves);

  // console.log(toRemove);
   

  // console.log('manutenção ->\n', inspect(manutencao, { depth: null, colors: true }));
  // console.log('toRemove ->\n', inspect(toRemove, { depth: null, colors: true }));

    // se nada bateu 3x 100%, não há o que promover
    if (
      !manutencao.manual.length &&
      !manutencao.vbmapp.length &&
      !manutencao.portage.length
    ) return;    

    // Carrega árvores ativas MAIS RECENTES (como arrays)
    const latest        = ordered[2];

    const manualAtivo   = this.safeJsonParse(latest?.sessao)   || [];
    const vbmappAtivo   = this.safeJsonParse(latest?.vbmapp)   || []; // << array
    const portageAtivo  = this.safeJsonParse(latest?.portage)  || []; // << array

    // Podas específicas de cada protocolo
    const manualFiltrado  = this.pruneManualActive(
      manualAtivo,
      new Set(toRemove.parents.manual),
      new Set(toRemove.leafs),
    );

    const vbmappFiltrado  = this.pruneVbmappChildrenActive(     // << novo
      vbmappAtivo,
      new Set(toRemove.parents.vbmapp),
      new Set(toRemove.leafs),
    );

    const portageFiltrado = this.prunePortageActive(            // << novo
      portageAtivo,
      new Set(toRemove.parents.portage),
      new Set(toRemove.leafs),
    );

// console.log(manualFiltrado);


    // Payload de manutenção
    const maintenancePayload = {
      manual:  manutencao.manual,
      vbmapp:  manutencao.vbmapp,
      portage: manutencao.portage,
    };


    await this.updateAtividadeSessao({
      calendarioId,
      maintenance: maintenancePayload,
      atividades:  manualFiltrado,
      vbmapp:  vbmappFiltrado,
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
    // console.log(body);
    
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

      const sessoes = [];
      await Promise.all(
        result.map((item: any) => {
          const programas = Array.isArray(item.sessao)
            ? item.sessao
            : JSON.parse(item.sessao);

          programas.map((programa: any) => {
            let current = [];
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

      const programasFormatados = [];

      await Promise.all(
        sessoes.map((item: any) => {
          const formatted = [];

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

      const groupedData = programasFormatados.reduce((acc, current) => {
        const programa = current.programa;
        const existingProgram = acc.find((item) => item.programa === programa);

        if (existingProgram) {
          current.children.forEach((child) => {
            const existingChild = existingProgram.children.find(
              (c) => c.programa === child.programa,
            );
            if (existingChild) {
              existingChild.dias.push(...child.dias);
            } else {
              existingProgram.children.push({ ...child });
            }
          });

          // Atualiza qtdColumns para o maior tamanho de dias encontrado
          existingProgram.qtdColumns = Math.max(
            ...existingProgram.children.map((child) => child.dias.length),
          );
        } else {
          // Inicia qtdColumns com o tamanho do primeiro children
          const qtdColumns = Math.max(
            ...current.children.map((child) => child.dias.length),
          );
          acc.push({
            programa: programa,
            children: [...current.children],
            qtdColumns: qtdColumns,
          });
        }

        return acc;
      }, []);

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
    const programas = Array.isArray(sessaoField) ? sessaoField : this.safeJsonParse(sessaoField);
    if (!Array.isArray(programas)) return [];

    const out: LeafEntry[] = [];

    for (const programa of programas) {
      const levelPath: (string | number)[] = [programa?.id ?? programa?.key ?? programa?.label ?? 'prog'];

      const metas = programa?.children ?? [];
      for (const meta of metas) {
        const metaId = meta?.id ?? meta?.key ?? meta?.label;
        const parentKey = this.makeParentKey({ protocol: 'manual', levelPath, metaId });
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
    const nivelPath: (string | number)[] = [nivel?.key ?? nivel?.label ?? 'nivel'];
    const programas = Array.isArray(nivel?.children) ? nivel.children : [];

    const newProgramas = programas.map((programa: any) => {
      const levelPath = [...nivelPath, programa?.key ?? programa?.label ?? 'programa'];
      const metas = Array.isArray(programa?.children) ? programa.children : [];

      const newMetas = metas
        .map((meta: any) => {
          const metaId = meta?.key ?? meta?.id ?? meta?.label;
          const parentKey = this.makeParentKey({ protocol: 'vbmapp', levelPath, metaId });
          if (toRemoveParents.has(parentKey)) return null;

          const itens = Array.isArray(meta?.children) ? meta.children : [];
          const newItens = itens.filter((item: any) => {
            const itemId = item?.key ?? item?.id ?? item?.label;
            const leafKey = this.makeKey({ protocol: 'vbmapp', levelPath, metaId, itemId });
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


  // --- EXTRATOR VB-MAPP (array plano de metas -> subitens) ---
  private extractLeavesFromVbmappFlat(vbmappField: any): LeafEntry[] {
   const raiz = this.safeJsonParse(vbmappField);
  if (!Array.isArray(raiz)) return [];

  const out: LeafEntry[] = [];

  for (const nivel of raiz) {
    const nivelPath: (string | number)[] = [nivel?.key ?? nivel?.label ?? 'nivel'];
    const programas = Array.isArray(nivel?.children) ? nivel.children : [];

    for (const programa of programas) {
      const levelPath = [...nivelPath, programa?.key ?? programa?.label ?? 'programa'];
      const metas = Array.isArray(programa?.children) ? programa.children : [];

      for (const meta of metas) {
        const metaId = meta?.key ?? meta?.id ?? meta?.label;
        const parentKey = this.makeParentKey({ protocol: 'vbmapp', levelPath, metaId });
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
          });
        }
      }
    }
  }

  return out;
  }

  // --- EXTRATOR PORTAGE (array plano de metas -> subitens) ---
  private extractLeavesFromPortageFlat(portageField: any): LeafEntry[] {
 const raiz = this.safeJsonParse(portageField);
  if (!Array.isArray(raiz)) return [];

  const out: LeafEntry[] = [];
  const levelPath: (string | number)[] = ['root'];

  for (const meta of raiz) {
    const metaId = meta?.key ?? meta?.id ?? meta?.label;
    const parentKey = this.makeParentKey({ protocol: 'portage', levelPath, metaId });
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
      const parentKey = this.makeParentKey({ protocol: 'portage', levelPath, metaId });
      if (toRemoveParents.has(parentKey)) return null;

      const newItems = (meta?.children || []).filter((item: any) => {
        const itemId = item?.key ?? item?.id ?? item?.label;
        const leafKey = this.makeKey({ protocol: 'portage', levelPath, metaId, itemId });
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
      manual: new Map<string, any>(),   // parentKey -> parentTree
      vbmapp: new Map<string, any>(),
      portage: new Map<string, any>(),
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
        toRemove: { parents: { manual: [], vbmapp: [], portage: [] }, leafs: [] },
      };
    }

    // folhas presentes nas 3 sessões e 100% em todas
    const keys100 = [...maps[0].keys()].filter((k) => {
      const a = maps[0].get(k), b = maps[1].get(k), c = maps[2].get(k);
      return a && b && c && a.value === 100 && b.value === 100 && c.value === 100;
    });

    // qualquer folha 100% nas 3 sessões deve sair do ativo
    keys100.forEach((k) => toRemoveLeafs.add(k));

    // agrupa por pai (meta/bloco)
    interface ParentInfo {
      protocol: ProtocolKey;
      parentTree: any;
      parentLeafCount: number;     // total de folhas sob o pai
      completedKeys: Set<string>;  // chaves de folhas concluídas (100% nas 3)
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
        });
      }
      byParent.get(leaf.parentKey)!.completedKeys.add(k);
    }

    // decide promoção e remoção do pai
    for (const [parentKey, info] of byParent.entries()) {
      const bucket = maintenanceByProtocol[info.protocol];

      // promove SEMPRE para manutenção se houver pelo menos 1 folha 100% nas 3
      if (!bucket.has(parentKey)) {
        bucket.set(parentKey, info.parentTree);
      }

      const allDone = info.completedKeys.size >= (info.parentLeafCount || 1);
      const onlyOne = (info.parentLeafCount || 1) === 1;

      if (allDone || onlyOne) {
        toRemoveParents[info.protocol].add(parentKey);
      }
    }

    return {
      manutencao: {
        manual:  [...maintenanceByProtocol.manual.values()],
        vbmapp:  [...maintenanceByProtocol.vbmapp.values()],
        portage: [...maintenanceByProtocol.portage.values()],
      },
      toRemove: {
        parents: {
          manual:  [...toRemoveParents.manual],
          vbmapp:  [...toRemoveParents.vbmapp],
          portage: [...toRemoveParents.portage],
        },
        leafs: [...toRemoveLeafs],
      },
    };
  }

  // ===== podas (remoção do ativo) =====
  // Manual: programa -> metas -> itens (cada item é uma folha)
  private pruneManualActive(programas: any[], toRemoveParents: Set<string>, toRemoveLeafs: Set<string>) {
    return (programas || []).map((prog) => {
      const levelPath = [prog?.id ?? prog?.key ?? prog?.label ?? 'prog'];
      const metas = (prog?.children || [])
        .map((meta: any) => {
          const metaId = meta?.id ?? meta?.key ?? meta?.label;
          const parentKey = this.makeParentKey({ protocol: 'manual', levelPath, metaId });

          // remove PAI inteiro?
          if (toRemoveParents.has(parentKey)) return null;

          // senão, filtra itens (folhas)
          const items = (meta?.children || []).filter((item: any) => {
            const itemId = item?.id ?? item?.key ?? item?.label;
            const leafKey = this.makeKey({ protocol: 'manual', levelPath, metaId, itemId });
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

  // VB-MAPP/PORTAGE: array plano de metas -> subitens
  private pruneFlatProtocolActive(
    metas: any[],
    protocol: Extract<ProtocolKey, 'vbmapp' | 'portage'>,
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    const levelPath = ['root'];
    const pruned = (Array.isArray(metas) ? metas : []).map((meta: any) => {
      const metaId = meta?.id ?? meta?.key ?? meta?.label;
      const parentKey = this.makeParentKey({ protocol, levelPath, metaId });

      if (toRemoveParents.has(parentKey)) return null;

      const children = (Array.isArray(meta?.children) ? meta.children : []).filter((item: any) => {
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
