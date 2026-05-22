import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { CautelaEvent } from '../cautela/entities/cautela-event.entity';
import { CautelaItem } from '../cautela/entities/cautela-item.entity';
import { Cautela } from '../cautela/entities/cautela.entity';
import { CautelaFlowStep } from '../common/enums/cautela-flow-step.enum';
import { CautelaPermissionType } from '../common/enums/cautela-permission-type.enum';
import { CautelaStatus } from '../common/enums/cautela-status.enum';
import { CautelaType } from '../common/enums/cautela-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { PasswordService } from '../common/security/password.service';
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
    email: 'gestor@cautela.local',
    nome: 'Gestor Teste',
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
  {
    email: 'portaria@cautela.local',
    nome: 'Portaria Teste',
    papel: UserRole.PORTARIA,
  },
  {
    email: 'solicitante@cautela.local',
    nome: 'Solicitante Teste',
    papel: UserRole.SOLICITANTE,
  },
];

type SeedUserEmail = (typeof seedUsers)[number]['email'];

const seedCautelaDate = new Date('2026-02-28T10:00:00');
const seedCautelaOwnerEmail = 'almoxarifado.teste@cautela.local';

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

    const usersByEmail = new Map<SeedUserEmail, User>();
    const senhaHash = passwordService.hash(DEFAULT_PASSWORD);
    let usuariosCriados = 0;
    let usuariosAtualizados = 0;

    for (const userData of seedUsers) {
      const existingUser = await usersRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        existingUser.ativo = true;
        existingUser.nome = userData.nome;
        existingUser.papel = userData.papel;

        usersByEmail.set(
          userData.email,
          await usersRepository.save(existingUser),
        );
        usuariosAtualizados += 1;
        continue;
      }

      const createdUser = usersRepository.create({
        ativo: true,
        email: userData.email,
        nome: userData.nome,
        papel: userData.papel,
        senhaHash,
      });

      usersByEmail.set(userData.email, await usersRepository.save(createdUser));
      usuariosCriados += 1;
    }

    const gestorManutencao = usersByEmail.get(
      'gestor.manutencao@callidus.local',
    )!;
    const gestorTi = usersByEmail.get('gestor.ti@callidus.local')!;
    const gestorTeste = usersByEmail.get('gestor@cautela.local')!;
    const portariaTeste = usersByEmail.get('portaria@cautela.local')!;
    const solicitanteTeste = usersByEmail.get('solicitante@cautela.local')!;
    const seedSectors = [
      {
        ativo: true,
        gestorId: gestorManutencao.id,
        nome: 'Manutencao Predial',
        numeroSetor: 101,
      },
      {
        ativo: true,
        gestorId: gestorTi.id,
        nome: 'Tecnologia da Informacao',
        numeroSetor: 202,
      },
      {
        ativo: true,
        gestorId: gestorTeste.id,
        nome: 'Almoxarifado',
        numeroSetor: 303,
      },
    ];

    let setoresCriados = 0;
    let setoresAtualizados = 0;
    const setoresByNumero = new Map<number, Sector>();

    for (const sectorData of seedSectors) {
      const existingSector = await sectorsRepository.findOne({
        where: { numeroSetor: sectorData.numeroSetor },
      });

      if (existingSector) {
        existingSector.ativo = sectorData.ativo;
        existingSector.gestorId = sectorData.gestorId;
        existingSector.nome = sectorData.nome;

        setoresByNumero.set(
          sectorData.numeroSetor,
          await sectorsRepository.save(existingSector),
        );
        setoresAtualizados += 1;
        continue;
      }

      setoresByNumero.set(
        sectorData.numeroSetor,
        await sectorsRepository.save(sectorsRepository.create(sectorData)),
      );
      setoresCriados += 1;
    }

    const almoxarifado = setoresByNumero.get(303)!;
    const startOfSeedDate = new Date('2026-02-28T00:00:00');
    const endOfSeedDate = new Date('2026-03-01T00:00:00');
    const existingSeedCautela = await cautelasRepository
      .createQueryBuilder('cautela')
      .where('cautela.proprietarioEmail = :email', {
        email: seedCautelaOwnerEmail,
      })
      .andWhere('cautela.setorId = :setorId', { setorId: almoxarifado.id })
      .andWhere('cautela.criadoEm >= :startOfSeedDate', { startOfSeedDate })
      .andWhere('cautela.criadoEm < :endOfSeedDate', { endOfSeedDate })
      .getOne();

    let cautelasCriadas = 0;
    let cautelasAtualizadas = 0;

    if (existingSeedCautela) {
      existingSeedCautela.gestorId = gestorTeste.id;
      existingSeedCautela.solicitadoPorId = solicitanteTeste.id;
      existingSeedCautela.setorId = almoxarifado.id;
      existingSeedCautela.proprietarioNome = 'Visitante Almoxarifado';
      existingSeedCautela.proprietarioEmail = seedCautelaOwnerEmail;
      existingSeedCautela.empresa = 'Fornecedor Seed';
      existingSeedCautela.documentoProprietario = '12345678900';
      existingSeedCautela.status = CautelaStatus.EM_ANALISE;
      existingSeedCautela.etapaFluxo = CautelaFlowStep.SOLICITADA;
      existingSeedCautela.tipo = CautelaType.EQUIPAMENTO;
      existingSeedCautela.tipoPermissao = CautelaPermissionType.ENTRADA_UNICA;
      existingSeedCautela.justificativaRejeicao = null;
      existingSeedCautela.aprovadoEm = null;
      existingSeedCautela.entradaValidadaEm = null;
      existingSeedCautela.entradaValidadaPorId = null;
      existingSeedCautela.rejeitadoEm = null;
      existingSeedCautela.respondidoEm = null;
      existingSeedCautela.saidaAutorizadaEm = null;
      existingSeedCautela.saidaAutorizadaPorId = null;
      existingSeedCautela.encerradoEm = null;
      existingSeedCautela.encerradoPorId = null;
      existingSeedCautela.tipoPermissaoAlteradoEm = null;
      existingSeedCautela.tipoPermissaoAlteradoPorId = null;
      existingSeedCautela.visualizadoGestorEm = null;
      existingSeedCautela.visualizadoPortariaEm = null;
      existingSeedCautela.visualizadoSolicitanteEm = seedCautelaDate;
      existingSeedCautela.criadoEm = seedCautelaDate;
      existingSeedCautela.atualizadoEm = seedCautelaDate;

      await cautelasRepository.save(existingSeedCautela);
      cautelasAtualizadas += 1;
    } else {
      await cautelasRepository.save(
        cautelasRepository.create({
          atualizadoEm: seedCautelaDate,
          criadoEm: seedCautelaDate,
          eventos: [
            eventsRepository.create({
              acao: CautelaStatus.EM_ANALISE,
              descricao:
                'Cautela solicitada pelo seed e encaminhada para analise do gestor do almoxarifado.',
              feitoPorId: solicitanteTeste.id,
              timestamp: seedCautelaDate,
            }),
          ],
          gestorId: gestorTeste.id,
          aprovadoEm: null,
          documentoProprietario: '12345678900',
          empresa: 'Fornecedor Seed',
          encerradoEm: null,
          encerradoPorId: null,
          itens: [
            itemsRepository.create({
              criadoEm: seedCautelaDate,
              atualizadoEm: seedCautelaDate,
              nomeItem: 'Kit de ferramentas do almoxarifado',
              quantidade: 1,
            }),
          ],
          justificativaRejeicao: null,
          proprietarioEmail: seedCautelaOwnerEmail,
          proprietarioNome: 'Visitante Almoxarifado',
          rejeitadoEm: null,
          respondidoEm: null,
          saidaAutorizadaEm: null,
          saidaAutorizadaPorId: null,
          setorId: almoxarifado.id,
          solicitadoPorId: solicitanteTeste.id,
          status: CautelaStatus.EM_ANALISE,
          etapaFluxo: CautelaFlowStep.SOLICITADA,
          tipo: CautelaType.EQUIPAMENTO,
          tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
          visualizadoSolicitanteEm: seedCautelaDate,
        }),
      );
      cautelasCriadas += 1;
    }

    const seedFlowCautelas = [
      {
        atualizadoEm: new Date('2026-03-02T09:15:00'),
        criadoEm: new Date('2026-03-02T09:00:00'),
        email: 'aprovada.seed@cautela.local',
        empresa: 'Manutencao Externa Ltda',
        eventos: [
          {
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela seed criada para validacao de fluxo aprovado.',
            feitoPorId: solicitanteTeste.id,
            timestamp: new Date('2026-03-02T09:00:00'),
          },
          {
            acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
            descricao: 'Cautela seed aprovada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-03-02T09:15:00'),
          },
          {
            acao: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
            descricao: 'Entrada seed validada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-03-02T09:25:00'),
          },
        ],
        item: 'Furadeira industrial',
        nome: 'Visitante Aprovado',
        status: CautelaStatus.APROVADA,
        aprovadoEm: new Date('2026-03-02T09:15:00'),
        entradaValidadaEm: new Date('2026-03-02T09:25:00'),
        etapaFluxo: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
        tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
        saidaAutorizadaEm: null,
        encerradoEm: null,
      },
      {
        atualizadoEm: new Date('2026-03-03T10:30:00'),
        criadoEm: new Date('2026-03-03T10:00:00'),
        email: 'saida.autorizada.seed@cautela.local',
        empresa: 'Calibracao Norte',
        eventos: [
          {
            acao: CautelaStatus.EM_ANALISE,
            descricao:
              'Cautela seed criada para validacao de saida autorizada.',
            feitoPorId: solicitanteTeste.id,
            timestamp: new Date('2026-03-03T10:00:00'),
          },
          {
            acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
            descricao: 'Cautela seed aprovada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-03-03T10:10:00'),
          },
          {
            acao: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
            descricao: 'Entrada seed validada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-03-03T10:20:00'),
          },
          {
            acao: 'SAIDA_AUTORIZADA',
            descricao: 'Saida seed autorizada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-03-03T10:30:00'),
          },
        ],
        item: 'Notebook de diagnostico',
        nome: 'Visitante Saida Autorizada',
        status: CautelaStatus.APROVADA,
        aprovadoEm: new Date('2026-03-03T10:10:00'),
        entradaValidadaEm: new Date('2026-03-03T10:20:00'),
        etapaFluxo: CautelaFlowStep.SAIDA_AUTORIZADA_PELO_GESTOR,
        tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
        saidaAutorizadaEm: new Date('2026-03-03T10:30:00'),
        encerradoEm: null,
      },
      {
        atualizadoEm: new Date('2026-03-04T16:00:00'),
        criadoEm: new Date('2026-03-04T13:00:00'),
        email: 'encerrada.seed@cautela.local',
        empresa: 'Inspecao Tecnica SA',
        eventos: [
          {
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela seed criada para validacao de encerramento.',
            feitoPorId: solicitanteTeste.id,
            timestamp: new Date('2026-03-04T13:00:00'),
          },
          {
            acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
            descricao: 'Cautela seed aprovada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-03-04T13:20:00'),
          },
          {
            acao: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
            descricao: 'Entrada seed validada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-03-04T13:30:00'),
          },
          {
            acao: 'SAIDA_AUTORIZADA',
            descricao: 'Saida seed autorizada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-03-04T15:45:00'),
          },
          {
            acao: CautelaStatus.ENCERRADA,
            descricao: 'Cautela seed encerrada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-03-04T16:00:00'),
          },
        ],
        item: 'Camera termografica',
        nome: 'Visitante Encerrado',
        status: CautelaStatus.ENCERRADA,
        aprovadoEm: new Date('2026-03-04T13:20:00'),
        entradaValidadaEm: new Date('2026-03-04T13:30:00'),
        etapaFluxo: CautelaFlowStep.ENCERRADA_PELA_PORTARIA,
        tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
        saidaAutorizadaEm: new Date('2026-03-04T15:45:00'),
        encerradoEm: new Date('2026-03-04T16:00:00'),
      },
      {
        atualizadoEm: new Date('2026-02-06T11:00:00'),
        criadoEm: new Date('2026-02-06T08:00:00'),
        email: 'encerrada.30dias.seed@cautela.local',
        empresa: 'Arquivo Historico Ltda',
        eventos: [
          {
            acao: CautelaStatus.EM_ANALISE,
            descricao: 'Cautela seed historica criada para validacao de busca.',
            feitoPorId: solicitanteTeste.id,
            timestamp: new Date('2026-02-06T08:00:00'),
          },
          {
            acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
            descricao: 'Cautela seed historica aprovada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-02-06T08:30:00'),
          },
          {
            acao: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
            descricao: 'Entrada seed historica validada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-02-06T08:40:00'),
          },
          {
            acao: 'SAIDA_AUTORIZADA',
            descricao: 'Saida seed historica autorizada pelo gestor.',
            feitoPorId: gestorTeste.id,
            timestamp: new Date('2026-02-06T10:45:00'),
          },
          {
            acao: CautelaStatus.ENCERRADA,
            descricao: 'Cautela seed historica encerrada pela portaria.',
            feitoPorId: portariaTeste.id,
            timestamp: new Date('2026-02-06T11:00:00'),
          },
        ],
        item: 'Scanner patrimonial',
        nome: 'Visitante Encerrado Historico',
        status: CautelaStatus.ENCERRADA,
        aprovadoEm: new Date('2026-02-06T08:30:00'),
        entradaValidadaEm: new Date('2026-02-06T08:40:00'),
        etapaFluxo: CautelaFlowStep.ENCERRADA_PELA_PORTARIA,
        tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
        saidaAutorizadaEm: new Date('2026-02-06T10:45:00'),
        encerradoEm: new Date('2026-02-06T11:00:00'),
      },
    ];

    for (const seedData of seedFlowCautelas) {
      const existingCautela = await cautelasRepository.findOne({
        where: {
          proprietarioEmail: seedData.email,
          setorId: almoxarifado.id,
        },
      });

      const cautelaData = {
        aprovadoEm: seedData.aprovadoEm,
        atualizadoEm: seedData.atualizadoEm,
        criadoEm: seedData.criadoEm,
        documentoProprietario: '98765432100',
        empresa: seedData.empresa,
        encerradoEm: seedData.encerradoEm,
        encerradoPorId: seedData.encerradoEm ? portariaTeste.id : null,
        gestorId: gestorTeste.id,
        entradaValidadaEm: seedData.entradaValidadaEm,
        entradaValidadaPorId: seedData.entradaValidadaEm
          ? portariaTeste.id
          : null,
        etapaFluxo: seedData.etapaFluxo,
        justificativaRejeicao: null,
        proprietarioEmail: seedData.email,
        proprietarioNome: seedData.nome,
        rejeitadoEm: null,
        respondidoEm: seedData.aprovadoEm,
        saidaAutorizadaEm: seedData.saidaAutorizadaEm,
        saidaAutorizadaPorId: seedData.saidaAutorizadaEm
          ? gestorTeste.id
          : null,
        setorId: almoxarifado.id,
        solicitadoPorId: solicitanteTeste.id,
        status: seedData.status,
        tipo: CautelaType.EQUIPAMENTO,
        tipoPermissao: seedData.tipoPermissao,
        visualizadoGestorEm: seedData.aprovadoEm,
        visualizadoPortariaEm: seedData.entradaValidadaEm,
        visualizadoSolicitanteEm: null,
      };

      if (existingCautela) {
        await cautelasRepository.save({
          ...existingCautela,
          ...cautelaData,
        });
        cautelasAtualizadas += 1;
        continue;
      }

      const savedCautela = await cautelasRepository.save(
        cautelasRepository.create({
          ...cautelaData,
          itens: [
            itemsRepository.create({
              atualizadoEm: seedData.criadoEm,
              criadoEm: seedData.criadoEm,
              nomeItem: seedData.item,
              quantidade: 1,
            }),
          ],
        }),
      );

      await eventsRepository.save(
        seedData.eventos.map((event) => ({
          acao: event.acao,
          cautelaId: savedCautela.id,
          descricao: event.descricao,
          feitoPorId: event.feitoPorId,
          timestamp: event.timestamp,
        })),
      );

      cautelasCriadas += 1;
    }

    console.log('Seed finalizado com sucesso.');
    console.log(`Usuarios criados: ${usuariosCriados}`);
    console.log(`Usuarios atualizados: ${usuariosAtualizados}`);
    console.log(`Setores criados: ${setoresCriados}`);
    console.log(`Setores atualizados: ${setoresAtualizados}`);
    console.log(`Cautelas criadas: ${cautelasCriadas}`);
    console.log(`Cautelas atualizadas: ${cautelasAtualizadas}`);
    console.log(
      `Senha padrao aplicada apenas a usuarios novos: ${DEFAULT_PASSWORD}`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
