import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const passwordService = app.get(PasswordService);

    const usersRepository = dataSource.getRepository(User);
    const sectorsRepository = dataSource.getRepository(Sector);

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

        usersByEmail.set(userData.email, await usersRepository.save(existingUser));
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

    const gestorManutencao = usersByEmail.get('gestor.manutencao@callidus.local')!;
    const gestorTi = usersByEmail.get('gestor.ti@callidus.local')!;
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
        gestorId: gestorManutencao.id,
        nome: 'Almoxarifado',
        numeroSetor: 303,
      },
    ];

    let setoresCriados = 0;
    let setoresAtualizados = 0;

    for (const sectorData of seedSectors) {
      const existingSector = await sectorsRepository.findOne({
        where: { numeroSetor: sectorData.numeroSetor },
      });

      if (existingSector) {
        existingSector.ativo = sectorData.ativo;
        existingSector.gestorId = sectorData.gestorId;
        existingSector.nome = sectorData.nome;

        await sectorsRepository.save(existingSector);
        setoresAtualizados += 1;
        continue;
      }

      await sectorsRepository.save(sectorsRepository.create(sectorData));
      setoresCriados += 1;
    }

    console.log('Seed finalizado com sucesso.');
    console.log(`Usuarios criados: ${usuariosCriados}`);
    console.log(`Usuarios atualizados: ${usuariosAtualizados}`);
    console.log(`Setores criados: ${setoresCriados}`);
    console.log(`Setores atualizados: ${setoresAtualizados}`);
    console.log(`Senha padrao aplicada apenas a usuarios novos: ${DEFAULT_PASSWORD}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
