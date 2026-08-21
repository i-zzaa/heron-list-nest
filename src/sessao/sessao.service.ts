import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { dateAddtDay, dateFormatDDMMYYYY } from 'src/util/format-date';
import { TYPE_DTT, calcAcertos } from 'src/util/util';

// --- helpers de chave estável ---
type ProtocolKey = 'manual' | 'vbmapp' | 'portage';

interface LeafEntry {
  key: string; // chave única do item (folha)
  value: number; // 0..100
  path: Array<string | number>; // caminho do 1º nível (programa / nível->programa / 'root')
  parentKey: string; // chave única do pai (meta)
  parentTree: any; // meta completo
  protocol: ProtocolKey;
  parentLeafCount: number; // total de folhas sob o pai (itens)
  // ancestrais reais (para preservar labels do primeiro nível)
  programTree?: any; // MANUAL: programa
  nivelTree?: any; // VB-MAPP: nível
  programaTree?: any; // VB-MAPP: programa
}

@Injectable()
export class SessaoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  // ===================== QUERIES BÁSICAS =====================
  async getAll(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const data = await prisma.sessao.findMany({
      select: {
        id: true,
        resumo: true,
        sessao: true,
        paciente: { select: { nome: true, responsavel: true } },
        evento: {
          select: {
            especialidade: true,
            dataInicio: true,
            terapeuta: { select: { usuario: { select: { nome: true } } } },
          },
        },
      },
      where: { pacienteId: Number(pacienteId) },
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
      where: { calendarioId: Number(calendarioId) },
    });

    if (Boolean(data?.sessao)) {
      // por compatibilidade
      data.vbmapp = data.vbmapp || [];
      data.portage = data.portage || [];
    }

    return data;
  }

  /**
   * `resumo` é HTML vindo de um editor rich-text — "vazio" pro editor pode
   * ser `<p></p>`/`<p><br></p>`, não string vazia crua. Já validado no
   * cliente (useSessionForm.ts: isResumoVazio), mas nunca só confiar em
   * validação client-side pra uma regra obrigatória — reforça aqui.
   */
  private assertResumoPreenchido(resumo: any) {
    const textoSemTags = String(resumo || '')
      .replace(/<[^>]*>/g, '')
      .trim();

    if (!textoSemTags) {
      throw new Error('Resumo da sessão é obrigatório.');
    }
  }

  async create(body: any, login: string) {
    this.assertResumoPreenchido(body.resumo);

    const prisma = this.prismaService.getPrismaClient();
    const dateFim = dateAddtDay(body.date, 1);

    const evento = await this.agendaService.updateCalendarioMobile(
      body.calendarioId,
      login,
      body.date,
      dateFim,
    );

    const { groupId } = await prisma.calendario.findUnique({
      select: { groupId: true },
      where: { id: body.calendarioId },
    });

    const calendarioIdPai = await prisma.calendario.findFirst({
      select: { id: true },
      where: { groupId },
      orderBy: { id: 'asc' },
      take: 1,
    });

    delete body.date;

    await prisma.sessao.create({
      data: buildCreatePayload(
        { ...body, sessao: body.sessao || [], calendarioId: evento.id },
        [
          'resumo',
          'sessao',
          'calendarioId',
          'pacienteId',
          'maintenance',
          'portage',
          'vbmapp',
          'selectedMaintenanceKeys',
        ],
      ),
    });

    await this.updateMaintenance(body.pacienteId, calendarioIdPai!.id);
    return;
  }

  // ===================== LÓGICA DE MANUTENÇÃO =====================
  // Utilitário: clona raso SEM children (preserva label/props do nível)
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
    return { ...this.shallowNoChildren(meta), children: cleanedItems };
  }

  // Filtra os ITENS de um meta para conter SOMENTE os promovidos (e remove respostas)
  private filterMetaToPromotedItems(
    meta: any,
    protocol: ProtocolKey,
    levelPath: (string | number)[],
    completedLeafKeys: Set<string>,
  ) {
    const metaId = meta?.id ?? meta?.key ?? meta?.label;
    const itens = Array.isArray(meta?.children) ? meta.children : [];
    const kept = itens
      .filter((item: any) => {
        const itemId = item?.id ?? item?.key ?? item?.label;
        const k = this.makeKey({ protocol, levelPath, metaId, itemId });
        return completedLeafKeys.has(k);
      })
      .map((item: any) => {
        const { children, ...rest } = item || {};
        return { ...rest }; // remove respostas
      });
    return { ...this.shallowNoChildren(meta), children: kept };
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

  // ========= ATUALIZA MANUTENÇÃO (considerando 3 últimas sessões) =========
  async updateMaintenance(pacienteId: number, calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const sessions = await prisma.sessao.findMany({
      select: { sessao: true, vbmapp: true, portage: true },
      where: { pacienteId },
      orderBy: { id: 'desc' },
      take: 3,
    });

    if (sessions.length < 3) return;

    const ordered = [...sessions].reverse();

    const parsed = ordered.map((s: any) => ({
      sessao: this.safeJsonParse(s.sessao) ?? s.sessao,
      vbmapp: this.safeJsonParse(s.vbmapp) ?? s.vbmapp,
      portage: this.safeJsonParse(s.portage) ?? s.portage,
    }));

    const perSessionLeaves = parsed.map((s: any) => {
      const manualLeaves = this.extractLeavesFromManual(s.sessao);
      const vbmappLeaves = this.extractLeavesFromVbmappFlat(s.vbmapp);
      const portageLeaves = this.extractLeavesFromPortageFlat(s.portage);
      return [...manualLeaves, ...vbmappLeaves, ...portageLeaves];
    });

    const { manutencao, toRemove } =
      this.buildMaintenanceFromThreeSessions(perSessionLeaves);

    if (
      !manutencao.manual.length &&
      !manutencao.vbmapp.length &&
      !manutencao.portage.length
    )
      return;

    const latest = ordered[2];
    const manualAtivo = this.safeJsonParse(latest?.sessao) || [];
    const vbmappAtivo = this.safeJsonParse(latest?.vbmapp) || [];
    const portageAtivo = this.safeJsonParse(latest?.portage) || [];

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

  // ===================== PÓS-PROCESSO (poda dos ativos) =====================
  private pruneManualActive(
    programas: any[],
    toRemoveParents: Set<string>,
    toRemoveLeafs: Set<string>,
  ) {
    return (programas || []).map((prog) => {
      const levelPath = [prog?.id ?? prog?.key ?? prog?.label ?? 'prog'];
      const metas = (prog?.children || [])
        .map((meta: any) => {
          const metaId = meta?.id ?? meta?.key ?? meta?.label;
          const parentKey = this.makeParentKey({
            protocol: 'manual',
            levelPath,
            metaId,
          });
          if (toRemoveParents.has(parentKey)) return null; // remove meta inteira

          const items = (meta?.children || []).filter((item: any) => {
            const itemId = item?.id ?? item?.key ?? item?.label;
            const leafKey = this.makeKey({
              protocol: 'manual',
              levelPath,
              metaId,
              itemId,
            });
            return !toRemoveLeafs.has(leafKey); // remove só as folhas 100%
          });

          if (!items.length) return null; // meta vazia some
          return { ...meta, children: items };
        })
        .filter(Boolean);

      return { ...prog, children: metas };
    });
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

  // ===================== EXTRATORES DE FOLHAS =====================
  // MANUAL (programas -> metas -> itens)
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
        const parentLeafCount = Array.isArray(meta?.children)
          ? meta.children.length
          : 0;

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

  // VB-MAPP (nível -> programa -> metas -> itens)
  private extractLeavesFromVbmappFlat(vbmappField: any): LeafEntry[] {
    const raiz = this.safeJsonParse(vbmappField);
    if (!Array.isArray(raiz)) return [];

    const out: LeafEntry[] = [];

    for (const nivel of raiz) {
      const nivelPath: (string | number)[] = [
        nivel?.key ?? nivel?.label ?? 'nivel',
      ];
      const nivelTree = this.shallowNoChildren(nivel);
      const programas = Array.isArray(nivel?.children) ? nivel.children : [];

      for (const programa of programas) {
        const levelPath = [
          ...nivelPath,
          programa?.key ?? programa?.label ?? 'programa',
        ];
        const programaTree = this.shallowNoChildren(programa);
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

  // PORTAGE (lista de metas -> itens)
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

  // ===================== REGRA 3x 100% E PROMOÇÃO =====================
  private buildMaintenanceFromThreeSessions(perSessionLeaves: LeafEntry[][]) {
    const maintenanceByProtocol = {
      manual: new Map<string, any>(), // {programa -> [metas]}
      vbmapp: new Map<string, any>(), // {nível -> [programa -> [metas]]}
      portage: new Map<string, any>(), // lista de metas
    };

    const toRemoveParents = {
      manual: new Set<string>(),
      vbmapp: new Set<string>(),
      portage: new Set<string>(),
    };
    const toRemoveLeafs = new Set<string>();

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

    const keys100 = [...maps[0].keys()].filter((k) => {
      const a = maps[0].get(k),
        b = maps[1].get(k),
        c = maps[2].get(k);
      return (
        a && b && c && a.value === 100 && b.value === 100 && c.value === 100
      );
    });

    keys100.forEach((k) => toRemoveLeafs.add(k));

    interface ParentInfo {
      protocol: ProtocolKey;
      parentTree: any;
      parentLeafCount: number;
      completedKeys: Set<string>;
      levelPath: (string | number)[];
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

    // Regras de promoção:
    // - ÚNICO (parentLeafCount=1) OU allDone: promove meta inteiro (sem respostas) e remove o PAI do ativo.
    // - Parcial: promove apenas os itens concluídos; mantém o pai, removendo apenas as folhas concluídas.
    for (const [parentKey, info] of byParent.entries()) {
      const bucket = maintenanceByProtocol[info.protocol];
      const allDone = info.completedKeys.size >= (info.parentLeafCount || 1);
      const onlyOne = (info.parentLeafCount || 1) === 1;

      let metaForMaintenance: any;
      if (onlyOne || allDone) {
        metaForMaintenance = this.stripItemResponses(info.parentTree);
        toRemoveParents[info.protocol].add(parentKey); // remove meta inteira do ativo
      } else {
        metaForMaintenance = this.filterMetaToPromotedItems(
          info.parentTree,
          info.protocol,
          info.levelPath,
          info.completedKeys,
        );
      }

      if (
        !Array.isArray(metaForMaintenance?.children) ||
        metaForMaintenance.children.length === 0
      ) {
        continue; // nada a promover
      }

      // Sempre removemos do ativo as folhas concluídas
      for (const k of info.completedKeys) toRemoveLeafs.add(k);

      // Envelopa no 1º nível e faz merge por protocolo
      this.mergeIntoMaintenanceBucket(
        bucket,
        info.protocol,
        info.levelPath,
        metaForMaintenance,
        {
          programTree: info.programTree,
          nivelTree: info.nivelTree,
          programaTree: info.programaTree,
        },
      );
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

  // ===================== OUTRAS AÇÕES =====================
  async updateSumary(body: any) {
    this.assertResumoPreenchido(body.resumo);

    const prisma = this.prismaService.getPrismaClient();
    return await prisma.sessao.update({
      data: buildCreatePayload(body, [
        'resumo',
        'sessao',
        'pacienteId',
        'calendarioId',
        'maintenance',
        'portage',
        'vbmapp',
        'selectedMaintenanceKeys',
      ]),
      where: { id: body.id },
    });
  }

  async createProtocolo(body: any) {
    const prisma = this.prismaService.getPrismaClient();
    return await prisma.protocolo.createMany({ data: body });
  }

  async createAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();
    return await prisma.atividadeSessao.createMany({ data: body });
  }

  async updateAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();
    return await prisma.atividadeSessao.update({
      data: buildCreatePayload(body, [
        'calendarioId',
        'atividade',
        'resposta',
        'observacao',
      ]),
      where: { calendarioId: body.calendarioId },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();
    return await prisma.sessao.delete({ where: { id: Number(id) } });
  }

  async getProtocoloByPacient(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const result: any = await prisma.protocolo.findMany({
      select: { id: true, protocolo: true, protocoloSet: true },
      where: { pacienteId: Number(pacienteId) },
      orderBy: { createdAt: 'asc' },
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
        select: { sessao: true, createdAt: true, evento: true },
        where: { pacienteId: Number(pacienteId) },
        orderBy: { createdAt: 'asc' },
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

            sessoes.push({ programa: programa.label, children: current });
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

            existingProgram.qtdColumns = Math.max(
              ...existingProgram.children.map(
                (child: any) => child.dias.length,
              ),
            );
          } else {
            const qtdColumns = Math.max(
              ...current.children.map((child: any) => child.dias.length),
            );
            acc.push({ programa, children: [...current.children], qtdColumns });
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

  // ===================== CHAVES & JSON =====================
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
