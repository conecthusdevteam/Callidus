import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../app.module';
import { CautelaStatus } from '../common/enums/cautela-status.enum';
import { CautelaType } from '../common/enums/cautela-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { PasswordService } from '../common/security/password.service';
import { CautelaEvent } from '../cautela/entities/cautela-event.entity';
import { CautelaItem } from '../cautela/entities/cautela-item.entity';
import { Cautela } from '../cautela/entities/cautela.entity';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../user/entities/user.entity';

const DEFAULT_PASSWORD = '123456';

const seedUsers = [
  {
    email: 'admin.cautela@callidus.local',
    nome: 'Admin Cautela',
    papel: UserRole.ADMIN,
  },
  {
    email: 'gestor.manutencao@callidus.local',
    nome: 'Marina Gestora',
    papel: UserRole.GESTOR,
  },
  {
    email: 'gestor.ti@callidus.local',
    nome: 'Rafael Gestor',
    papel: UserRole.GESTOR,
  },
  {
    email: 'portaria.turno-a@callidus.local',
    nome: 'Camila Portaria',
    papel: UserRole.PORTARIA,
  },
  {
    email: 'portaria.turno-b@callidus.local',
    nome: 'Bruno Portaria',
    papel: UserRole.PORTARIA,
  },
];

type SeedUserEmail = (typeof seedUsers)[number]['email'];

const seedSectorNumbers = [101, 202, 303];

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const passwordService = app.get(PasswordService);

    const usersRepository = dataSource.getRepository(User);
    const sectorsRepository = dataSource.getRepository(Sector);
    const cautelasRepository = dataSource.getRepository(Cautela);
    const itemsRepository = dataSource.getRepository(CautelaItem);
    const eventsRepository = dataSource.getRepository(CautelaEvent);

    await dataSource.transaction(async (manager) => {
      const seedEmails = seedUsers.map((user) => user.email);

      const existingSeedUsers = await manager.getRepository(User).find({
        select: { id: true },
        where: { email: In(seedEmails) },
      });
      const existingSeedUserIds = existingSeedUsers.map((user) => user.id);

      const existingSeedSectors = await manager.getRepository(Sector).find({
        select: { id: true },
        where: { numeroSetor: In(seedSectorNumbers) },
      });
      const existingSeedSectorIds = existingSeedSectors.map((sector) => sector.id);

      const cautelaCleanupWhere = [
        ...(existingSeedUserIds.length > 0
          ? [{ solicitadoPorId: In(existingSeedUserIds) }]
          : []),
        ...(existingSeedUserIds.length > 0
          ? [{ gestorId: In(existingSeedUserIds) }]
          : []),
        ...(existingSeedSectorIds.length > 0
          ? [{ setorId: In(existingSeedSectorIds) }]
          : []),
      ];
      const existingSeedCautelas =
        cautelaCleanupWhere.length > 0
          ? await manager.getRepository(Cautela).find({
              select: { id: true },
              where: cautelaCleanupWhere,
            })
          : [];
      const existingSeedCautelaIds = existingSeedCautelas.map((cautela) => cautela.id);

      if (existingSeedCautelaIds.length > 0) {
        await manager.getRepository(CautelaEvent).delete({
          cautelaId: In(existingSeedCautelaIds),
        });
        await manager.getRepository(CautelaItem).delete({
          cautelaId: In(existingSeedCautelaIds),
        });
        await manager.getRepository(Cautela).delete({
          id: In(existingSeedCautelaIds),
        });
      }

      if (existingSeedSectorIds.length > 0) {
        await manager.getRepository(Sector).delete({
          id: In(existingSeedSectorIds),
        });
      }

      if (existingSeedUserIds.length > 0) {
        await manager.getRepository(User).delete({
          id: In(existingSeedUserIds),
        });
      }
    });

    const usersByEmail = new Map<SeedUserEmail, User>();
    const senhaHash = passwordService.hash(DEFAULT_PASSWORD);

    for (const userData of seedUsers) {
      const user = usersRepository.create({
        ativo: true,
        email: userData.email,
        nome: userData.nome,
        papel: userData.papel,
        senhaHash,
      });

      usersByEmail.set(userData.email, await usersRepository.save(user));
    }

    const gestorManutencao = usersByEmail.get('gestor.manutencao@callidus.local')!;
    const gestorTi = usersByEmail.get('gestor.ti@callidus.local')!;
    const portariaA = usersByEmail.get('portaria.turno-a@callidus.local')!;
    const portariaB = usersByEmail.get('portaria.turno-b@callidus.local')!;

    const sectors = await sectorsRepository.save([
      sectorsRepository.create({
        ativo: true,
        gestorId: gestorManutencao.id,
        nome: 'Manutencao Predial',
        numeroSetor: 101,
      }),
      sectorsRepository.create({
        ativo: true,
        gestorId: gestorTi.id,
        nome: 'Tecnologia da Informacao',
        numeroSetor: 202,
      }),
      sectorsRepository.create({
        ativo: true,
        gestorId: gestorManutencao.id,
        nome: 'Almoxarifado',
        numeroSetor: 303,
      }),
    ]);

    const [manutencao, tecnologia, almoxarifado] = sectors;

    await cautelasRepository.save([
      cautelasRepository.create({
        eventos: [
          eventsRepository.create({
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela criada e encaminhada para analise do gestor responsavel.',
            feitoPorId: portariaA.id,
          }),
        ],
        gestorId: gestorManutencao.id,
        itens: [
          itemsRepository.create({ nomeItem: 'Furadeira de impacto', quantidade: 1 }),
          itemsRepository.create({ nomeItem: 'Jogo de brocas', quantidade: 2 }),
        ],
        justificativaRejeicao: null,
        proprietarioEmail: 'joao.silva@fornecedor.local',
        proprietarioNome: 'Joao Silva',
        respondidoEm: null,
        retornoItem: true,
        setorId: manutencao.id,
        solicitadoPorId: portariaA.id,
        status: CautelaStatus.EM_ANALISE,
        tipo: CautelaType.EQUIPAMENTO,
        validade: daysFromNow(7),
      }),
      cautelasRepository.create({
        eventos: [
          eventsRepository.create({
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela criada e encaminhada para analise do gestor responsavel.',
            feitoPorId: portariaB.id,
          }),
          eventsRepository.create({
            acao: CautelaStatus.APROVADA,
            descricao: 'Cautela aprovada pelo gestor responsavel.',
            feitoPorId: gestorTi.id,
          }),
        ],
        gestorId: gestorTi.id,
        itens: [
          itemsRepository.create({ nomeItem: 'Notebook Dell Latitude', quantidade: 1 }),
          itemsRepository.create({ nomeItem: 'Carregador USB-C', quantidade: 1 }),
        ],
        justificativaRejeicao: null,
        proprietarioEmail: 'ana.costa@parceiro.local',
        proprietarioNome: 'Ana Costa',
        respondidoEm: daysFromNow(-1),
        retornoItem: true,
        setorId: tecnologia.id,
        solicitadoPorId: portariaB.id,
        status: CautelaStatus.APROVADA,
        tipo: CautelaType.EQUIPAMENTO,
        validade: daysFromNow(14),
      }),
      cautelasRepository.create({
        eventos: [
          eventsRepository.create({
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela criada e encaminhada para analise do gestor responsavel.',
            feitoPorId: portariaA.id,
          }),
          eventsRepository.create({
            acao: CautelaStatus.REPROVADA,
            descricao: 'Cautela reprovada. Motivo: item sem patrimonio identificado.',
            feitoPorId: gestorManutencao.id,
          }),
        ],
        gestorId: gestorManutencao.id,
        itens: [
          itemsRepository.create({ nomeItem: 'Multimetro digital', quantidade: 1 }),
        ],
        justificativaRejeicao: 'Item sem patrimonio identificado.',
        proprietarioEmail: 'marcos.lima@visitante.local',
        proprietarioNome: 'Marcos Lima',
        respondidoEm: daysFromNow(-2),
        retornoItem: true,
        setorId: almoxarifado.id,
        solicitadoPorId: portariaA.id,
        status: CautelaStatus.REPROVADA,
        tipo: CautelaType.EQUIPAMENTO,
        validade: daysFromNow(5),
      }),
      cautelasRepository.create({
        eventos: [
          eventsRepository.create({
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela criada e encaminhada para analise do gestor responsavel.',
            feitoPorId: portariaB.id,
          }),
        ],
        gestorId: gestorManutencao.id,
        itens: [
          itemsRepository.create({ nomeItem: 'Caixa de ferramentas', quantidade: 3 }),
        ],
        justificativaRejeicao: null,
        proprietarioEmail: 'patricia.rocha@callidus.local',
        proprietarioNome: 'Patricia Rocha',
        respondidoEm: null,
        retornoItem: false,
        setorId: almoxarifado.id,
        solicitadoPorId: portariaB.id,
        status: CautelaStatus.EM_ANALISE,
        tipo: CautelaType.EQUIPAMENTO,
        validade: null,
      }),
    ]);

    console.log('Seed finalizado com sucesso.');
    console.log(`Usuarios criados: ${seedUsers.length}`);
    console.log(`Setores criados: ${sectors.length}`);
    console.log('Cautelas criadas: 4');
    console.log(`Senha padrao dos usuarios: ${DEFAULT_PASSWORD}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
