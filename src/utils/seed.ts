import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senha = bcrypt.hashSync('12345678', 8);

  await [
    'Developer',
    'Administrador',
    'Secretária',
    'Coordenador',
    'Coordenador-terapeuta',
    'Terapeuta',
  ].map(async (perfil: string, index: number) => {
    await prisma.perfil.upsert({
      where: { id: index },
      update: {},
      create: {
        nome: perfil,
      },
    });
  });

  await [
    {
      nome: 'Andressa Novaes Menezes',
      login: 'isa.menezes',
      perfilId: 1,
      senha: senha,
    },
    {
      nome: 'Samara Balbino Andreuci',
      login: 'samara.andreuci',
      perfilId: 2,
      senha: senha,
    },
  ].map(async (usuario: any, id: number) => {
    await prisma.usuario.upsert({
      where: { id: id },
      update: {},
      create: {
        ...usuario,
      },
    });
  });

  await ['Av Neuropsico', 'Av Psicodiag', 'Terapia ABA'].map(
    async (tipoSessao: string, id: number) => {
      await prisma.tipoSessao.upsert({
        where: { id: id },
        update: {},
        create: {
          nome: tipoSessao,
        },
      });
    }
  );

  await [
    { nome: 'Psico', cor: '#8e24aa' },
    { nome: 'TO', cor: '#ef6c00' },
    { nome: 'PsicoPEDAG', cor: '#000000' },
    { nome: 'Fono', cor: '#f6bf26' },
  ].map(async (especialidade: any, id: number) => {
    await prisma.especialidade.upsert({
      where: { id: id },
      update: {},
      create: { ...especialidade },
    });
  });

  await ['Integral', 'Manhã', 'Tarde'].map(
    async (periodo: string, id: number) => {
      await prisma.periodo.upsert({
        where: { id: id },
        update: {},
        create: {
          nome: periodo,
        },
      });
    }
  );

  await ['Urgente', 'Padrão', 'Voltou ABA'].map(
    async (periodo: string, id: number) => {
      await prisma.status.upsert({
        where: { id: id },
        update: {},
        create: {
          nome: periodo,
        },
      });
    }
  );

  await ['Unimed', 'Amil', 'Particular'].map(
    async (periodo: string, id: number) => {
      await prisma.convenio.upsert({
        where: { id: id },
        update: {},
        create: {
          nome: periodo,
        },
      });
    }
  );

  await ['Todas Semanas', '2 Semanas', '3 Semanas'].map(
    async (intervalo: string, id: number) => {
      await prisma.intervalo.upsert({
        where: { id: id },
        update: {},
        create: {
          nome: intervalo,
        },
      });
    }
  );

  await ['Único', 'Recorrente'].map(async (frequencia: string, id: number) => {
    await prisma.frequencia.upsert({
      where: { id: id },
      update: {},
      create: {
        nome: frequencia,
      },
    });
  });

  // await prisma.statusPaciente.createMany({
  //   date: ['Fila avaliacao', 'Fila terapia', 'Terapia', 'Avaliacao', 'Crud Terapia' ],
  // });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // process.exit(1);
  });
