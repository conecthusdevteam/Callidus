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
    email: 'gestor@cautela.local',
    nome: 'Gestor Teste',
    papel: UserRole.GESTOR,
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

    const gestorTeste = usersByEmail.get('gestor@cautela.local')!;
    const solicitanteTeste = usersByEmail.get('solicitante@cautela.local')!;
    const seedSectors = [
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
      existingSeedCautela.setor = almoxarifado;
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
