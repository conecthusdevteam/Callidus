import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PlateWash } from '../../plates/entities/plate-wash.entity';
import { Plate } from '../../plates/entities/plate.entity';
import { StencilWash } from '../../stencils/entities/stencil-wash.entity';
import { Stencil, WashStatus } from '../../stencils/entities/stencil.entity';

config();

const OPERATORS = [
  'Carlos Souza',
  'Maria Santos',
  'Ana Oliveira',
  'Pedro Costa',
  'Lucia Ferreira',
];

const STENCILS = [
  {
    stencilCode: 'A-019',
    manufactureId: 'MNF-001',
    country: 'Brasil',
    thickness: 0.12,
    addressing: 19,
    lineName: 'Line 1',
    status: WashStatus.ACTIVE,
    washHoursAgo: [32, 24, 16, 8, 1],
  },
  {
    stencilCode: 'A-020',
    manufactureId: 'MNF-002',
    country: 'China',
    thickness: 0.1,
    addressing: 20,
    lineName: 'Line 1',
    status: WashStatus.ACTIVE,
    washHoursAgo: [54, 46, 38, 30, 2],
  },
  {
    stencilCode: 'B-110',
    manufactureId: 'MNF-003',
    country: 'Alemanha',
    thickness: 0.15,
    addressing: 110,
    lineName: 'Line 2',
    status: WashStatus.ACTIVE,
    washHoursAgo: [36, 27, 18, 9],
  },
  {
    stencilCode: 'C-305',
    manufactureId: 'MNF-004',
    country: 'Japao',
    thickness: 0.08,
    addressing: 305,
    lineName: 'Line 3',
    status: WashStatus.INACTIVE,
    washHoursAgo: [20],
  },
];

const PLATES = [
  {
    plateModel: 'PCB-1000',
    serialNumber: 'PCB-1000-000001',
    blankId: 'BLANK-1001',
    lineName: 'Line 1',
    plateManufacturerId: 'MNF-101',
    country: 'Brasil',
    thickness: 0.09,
    addressing: '101',
    washHoursAgo: [22, 12, 3],
  },
  {
    plateModel: 'PCB-2000',
    serialNumber: 'PCB-2000-000002',
    blankId: 'BLANK-2002',
    lineName: 'Line 2',
    plateManufacturerId: 'MNF-102',
    country: 'Mexico',
    thickness: 0.11,
    addressing: '202',
    washHoursAgo: [30, 18, 6],
  },
  {
    plateModel: 'PCB-3000',
    serialNumber: 'PCB-3000-000003',
    blankId: 'BLANK-3003',
    lineName: 'Line 3',
    plateManufacturerId: 'MNF-103',
    country: 'Vietnã',
    thickness: 0.1,
    addressing: '303',
    washHoursAgo: [14, 4],
  },
];

function dateHoursAgo(hoursAgo: number) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() - hoursAgo);
  return date;
}

async function runSeed() {
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'smt_stencil',
    entities: [Stencil, StencilWash, Plate, PlateWash],
    synchronize: false,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  try {
    await dataSource.initialize();

    const stencilRepo = dataSource.getRepository(Stencil);
    const stencilWashRepo = dataSource.getRepository(StencilWash);
    const plateRepo = dataSource.getRepository(Plate);
    const plateWashRepo = dataSource.getRepository(PlateWash);

    for (const seed of STENCILS) {
      let stencil = await stencilRepo.findOne({
        where: { stencilCode: seed.stencilCode },
      });

      if (!stencil) {
        stencil = await stencilRepo.save(stencilRepo.create(seed));
      }

      const existingWashes = await stencilWashRepo.count({
        where: { stencilId: stencil.id },
      });
      if (existingWashes === 0) {
        for (const [index, hoursAgo] of seed.washHoursAgo.entries()) {
          await stencilWashRepo.save(
            stencilWashRepo.create({
              stencilId: stencil.id,
              operator: OPERATORS[index % OPERATORS.length],
              createdAt: dateHoursAgo(hoursAgo),
            }),
          );
        }
      }
    }

    for (const seed of PLATES) {
      let plate = await plateRepo.findOne({
        where: { serialNumber: seed.serialNumber },
      });

      if (!plate) {
        plate = await plateRepo.save(plateRepo.create(seed));
      }

      const existingWashes = await plateWashRepo.count({
        where: { plateId: plate.id },
      });
      if (existingWashes === 0) {
        for (const [index, hoursAgo] of seed.washHoursAgo.entries()) {
          await plateWashRepo.save(
            plateWashRepo.create({
              plateId: plate.id,
              operator: OPERATORS[index % OPERATORS.length],
              shift: (index % 3) + 1,
              phase: (index % 2) + 1,
              createdAt: dateHoursAgo(hoursAgo),
            }),
          );
        }
      }
    }

    console.log('Seed completed successfully.');
    console.log(`Stencils: ${await stencilRepo.count()}`);
    console.log(`Stencil washes: ${await stencilWashRepo.count()}`);
    console.log(`Plates: ${await plateRepo.count()}`);
    console.log(`Plate washes: ${await plateWashRepo.count()}`);
  } catch (error) {
    console.error('Error on seed:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runSeed();
