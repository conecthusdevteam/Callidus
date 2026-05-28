import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PlateWash } from '../../plates/entities/plate-wash.entity';
import { Plate } from '../../plates/entities/plate.entity';
import { StencilWash } from '../../stencils/entities/stencil-wash.entity';
import { Stencil, WashStatus } from '../../stencils/entities/stencil.entity';

config();

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min: number, max: number, decimals: number = 6) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

const COUNTRIES = [
  'Brasil',
  'China',
  'Alemanha',
  'EUA',
  'Japão',
  'Coreia',
  'México',
  'Vietnã',
];
const LINE_NAMES = [
  'Manaus',
  'Manacapuru',
  'Borba',
  'Tefé',
  'Coari',
  'Manicoré',
  'Japurá',
  'Eirunepé',
];
const STENCIL_CODES = [
  'SMB-100',
  'SMB-200',
  'SMC-300',
  'SMD-400',
  'SME-500',
  'SMF-600',
  'SMG-700',
  'SMH-800',
];
const MANUFACTURE_IDS = [
  'MNF-001',
  'MNF-002',
  'MNF-003',
  'MNF-004',
  'MNF-005',
  'MNF-006',
];
const PLATE_MODELS = [
  'PCB-1000',
  'PCB-2000',
  'PCB-3000',
  'PCB-4000',
  'PCB-5000',
  'PCB-6000',
];

const OPERATORS = ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Souza'];
const SHIFTS = [1, 2];
const PHASES = [1, 2];

const INACTIVE_STENCIL_INTERVAL = 7;
const ANALYTICS_SEED_DAYS = 30;
const PLANNED_MANAUS_HOURS = [11, 16];
const ANOMALOUS_MANAUS_HOURS = [7, 8, 9, 10, 12, 13, 14, 15, 17];

const MIN_HOUR_UTC = 11;
const MAX_HOUR_UTC = 21;

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function randomDateForPastDay(date: Date, planned: boolean = false): Date {
  const PEAK_HOURS = [
    { start: 15, end: 16 },
    { start: 20, end: 21 }
  ];

  const usePeakHour = planned ? Math.random() < 0.9 : Math.random() < 0.65;

  let hours: number;
  let minutes: number;
  let seconds: number;

  if (usePeakHour) {
    const peak = PEAK_HOURS[random(0, PEAK_HOURS.length - 1)];
    hours = random(peak.start, peak.end);
    minutes = random(0, hours === peak.end ? 0 : 59);
    seconds = random(0, 59);
  } else {
    hours = random(MIN_HOUR_UTC, MAX_HOUR_UTC);
    minutes = random(0, hours === MAX_HOUR_UTC ? 0 : 59);
    seconds = random(0, 59);
  }

  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setHours(hours, minutes, seconds);

  return result;
}

function randomDateForToday(planned: boolean = false): Date {
  const now = new Date();
  const currentHourUTC = now.getUTCHours();
  const currentMinutesUTC = now.getUTCMinutes();
  const currentSecondsUTC = now.getUTCSeconds();

  const PEAK_HOURS = [
    { start: 15, end: 16 },
    { start: 20, end: 21 }
  ];

  const usePeakHour = planned ? Math.random() < 0.9 : Math.random() < 0.65;

  if (usePeakHour) {
    const peak = PEAK_HOURS[random(0, PEAK_HOURS.length - 1)];
    let hours = random(peak.start, peak.end);

    if (hours > currentHourUTC) {
      hours = currentHourUTC;
    }

    const isCurrentHour = hours === currentHourUTC;
    const minutes = isCurrentHour
      ? random(0, currentMinutesUTC)
      : random(0, hours === peak.end ? 0 : 59);

    const seconds = random(0, isCurrentHour && minutes === currentMinutesUTC ? currentSecondsUTC : 59);

    const date = new Date(now);
    date.setUTCHours(hours, minutes, seconds, 0);

    if (date > now) {
      return new Date(now);
    }

    return date;
  }

  if (currentHourUTC >= MAX_HOUR_UTC) {
    const hours = random(MIN_HOUR_UTC, MAX_HOUR_UTC);
    const minutes = random(0, hours === MAX_HOUR_UTC ? 0 : 59);
    const seconds = random(0, 59);

    const date = new Date(now);
    date.setUTCHours(hours, minutes, seconds, 0);
    return date;
  }

  if (currentHourUTC < MIN_HOUR_UTC) {
    const date = new Date(now);
    date.setUTCHours(MIN_HOUR_UTC, 0, 0, 0);
    return date;
  }

  const hours = random(MIN_HOUR_UTC, currentHourUTC);
  let minutes = random(0, 59);
  let seconds = random(0, 59);

  if (hours === currentHourUTC) {
    minutes = random(0, currentMinutesUTC);
    seconds = random(0, currentSecondsUTC);
  }

  const date = new Date(now);
  date.setUTCHours(hours, minutes, seconds, 0);

  if (date > now) {
    return new Date(now);
  }

  return date;
}

function getLast30Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i)
    days.push(date)
  }

  return days.reverse();
}

function generateWashDates(washCount: number, forceSingleWash: boolean = false, planned: boolean = false): Date[] {
  const weekdays = getLast30Days();
  const dates: Date[] = [];

  if (forceSingleWash) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayIndex = random(0, weekdays.length - 1);
    const selectedDay = weekdays[dayIndex];
    const isToday = selectedDay.getTime() === today.getTime();

    const washDate = isToday ? randomDateForToday(planned) : randomDateForPastDay(selectedDay, planned);
    dates.push(washDate);

    return dates;
  }

  for (let i = 0; i < washCount; i++) {
    const dayIndex = random(0, weekdays.length - 1);
    const selectedDay = weekdays[dayIndex];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let washDate: Date;

    if (selectedDay.getTime() === today.getTime()) {
      washDate = randomDateForToday();
    } else {
      washDate = randomDateForPastDay(selectedDay);
    }

    dates.push(washDate);
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function generateStencilData(index: number): Partial<Stencil> {
  const stencilCodeBase = STENCIL_CODES[random(0, STENCIL_CODES.length - 1)];
  const manufactureId = MANUFACTURE_IDS[random(0, MANUFACTURE_IDS.length - 1)];
  const country = COUNTRIES[random(0, COUNTRIES.length - 1)];
  const thickness = randomFloat(0.05, 0.15, 6);
  const addressing = String(random(1, 100)).padStart(3, '0');
  const lineName = LINE_NAMES[random(0, LINE_NAMES.length - 1)];
  const status =
    index % INACTIVE_STENCIL_INTERVAL === 0
      ? WashStatus.INACTIVE
      : WashStatus.ACTIVE;
  const createdAt = randomDateForToday();

  const stencil = new Stencil();
  stencil.stencilCode = `${stencilCodeBase}-${String(index).padStart(4, '0')}`;
  stencil.manufactureId = manufactureId;
  stencil.country = country;
  stencil.thickness = thickness;
  stencil.addressing = addressing;
  stencil.lineName = lineName;
  stencil.status = status;
  stencil.createdAt = createdAt;
  stencil.updatedAt = createdAt;

  return stencil;
}

function generatePlateData(index: number): Partial<Plate> {
  const plateModel = PLATE_MODELS[random(0, PLATE_MODELS.length - 1)];
  const serialNumber = `${plateModel}-${String(index).padStart(6, '0')}`;
  const blankId = `BLANK-${random(1000, 9999)}`;
  const lineName = LINE_NAMES[random(0, LINE_NAMES.length - 1)];
  const plateManufacturerId = MANUFACTURE_IDS[random(0, MANUFACTURE_IDS.length - 1)];
  const country = COUNTRIES[random(0, COUNTRIES.length - 1)];
  const thickness = randomFloat(0.05, 0.15, 2);
  const addressing = String(random(1, 100)).padStart(3, '0');
  const createdAt = randomDateForToday();

  const plate = new Plate();
  plate.plateModel = plateModel;
  plate.serialNumber = serialNumber;
  plate.blankId = blankId;
  plate.lineName = lineName;
  plate.plateManufacturerId = plateManufacturerId;
  plate.country = country;
  plate.thickness = thickness;
  plate.addressing = addressing;
  plate.createdAt = createdAt;
  plate.updatedAt = createdAt;

  return plate;
}

function generateStencilWashes(stencilId: string, washCount: number, forceSingleWash: boolean = false, planned: boolean = false): Partial<StencilWash>[] {
  const washDates = generateWashDates(washCount, forceSingleWash, planned);

  return washDates.map((date) => {
    const wash = new StencilWash();
    wash.stencilId = stencilId;
    wash.operator = OPERATORS[random(0, OPERATORS.length - 1)];
    wash.createdAt = date;
    return wash;
  });
}

function generatePlateWashes(plateId: string, washCount: number, forceSingleWash: boolean = false, planned: boolean = false): Partial<PlateWash>[] {
  const washDates = generateWashDates(washCount, forceSingleWash, planned);

  return washDates.map((date) => {
    const wash = new PlateWash();
    wash.plateId = plateId;
    wash.operator = OPERATORS[random(0, OPERATORS.length - 1)];
    wash.shift = SHIFTS[random(0, SHIFTS.length - 1)];
    wash.phase = PHASES[random(0, PHASES.length - 1)];
    wash.createdAt = date;
    return wash;
  });
}

async function stencilExists(
  dataSource: DataSource,
  stencilCode: string,
): Promise<boolean> {
  const result = await dataSource
    .getRepository(Stencil)
    .createQueryBuilder('stencil')
    .where('stencil.stencilCode = :code', { code: stencilCode })
    .getCount();

  return result > 0;
}

async function plateExists(
  dataSource: DataSource,
  serialNumber: string,
): Promise<boolean> {
  const result = await dataSource
    .getRepository(Plate)
    .createQueryBuilder('plate')
    .where('plate.serialNumber = :serial', { serial: serialNumber })
    .getCount();

  return result > 0;
}

async function runSeed() {
  console.log('🚀 Initializing seed of Stencils, Plates and Washes (SQL Server)...');
  console.log(`📊 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`💾 Database: ${process.env.DB_DATABASE}`);

  const weekdays = getLast30Days();
  console.log(`\n📅 Last 5 weekdays: ${weekdays.map(d => d.toLocaleDateString()).join(', ')}`);

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
    console.log('✅ Connect on SQL Server');

    const stencilRepo = dataSource.getRepository(Stencil);
    const stencilWashRepo = dataSource.getRepository(StencilWash);
    const plateRepo = dataSource.getRepository(Plate);
    const plateWashRepo = dataSource.getRepository(PlateWash);

    // ============================================
    // 1. SEED DE STENCILS (35 registers)
    // ============================================
    console.log('\n📦 Generate 35 Stencils...');
    let stencilsInserted = 0;
    let stencilsSkipped = 0;
    let activeStencilsInserted = 0;
    let inactiveStencilsInserted = 0;
    const createdStencils: Stencil[] = [];

    for (let i = 1; i <= 35; i++) {
      const stencilData = generateStencilData(i);
      const stencilCode = stencilData.stencilCode!;

      const exists = await stencilExists(dataSource, stencilCode);

      if (!exists) {
        const stencil = stencilRepo.create(stencilData);
        const savedStencil = await stencilRepo.save(stencil);
        createdStencils.push(savedStencil);
        stencilsInserted++;
        if (savedStencil.status === WashStatus.ACTIVE) activeStencilsInserted++;
        else inactiveStencilsInserted++;
      } else {
        stencilsSkipped++;
      }

      if (i % 10 === 0) {
        console.log(
          `   ✅ Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing`,
        );
      }
    }

    console.log(
      `   ✅ Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing`,
    );
    console.log(
      `   📊 Status: ${activeStencilsInserted} active, ${inactiveStencilsInserted} inactive`,
    );

    // ============================================
    // 1.1 WASHES FOR STENCILS (analytics-friendly 30-day history)
    // ============================================
    console.log('\n🧼 Generating Washes for Stencils (last 30 days)...');
    let stencilWashesInserted = 0;
    let singleWashCount = 0;
    let multiWashCount = 0;

    const totalStencilsCount = createdStencils.length;
    const singleWashTarget = Math.floor(totalStencilsCount * 0.8);

    for (let i = 0; i < createdStencils.length; i++) {
      const stencil = createdStencils[i];
      const useSingleWash = i < singleWashTarget;

      if (useSingleWash) {
        const washes = generateStencilWashes(stencil.id, 1, true, true);
        for (const washData of washes) {
          const wash = stencilWashRepo.create(washData);
          await stencilWashRepo.save(wash);
          stencilWashesInserted++;
          singleWashCount++;
        }
      } else {
        const washCount = random(3, 8);
        const washes = generateStencilWashes(stencil.id, washCount, false, false);
        for (const washData of washes) {
          const wash = stencilWashRepo.create(washData);
          await stencilWashRepo.save(wash);
          stencilWashesInserted++;
          multiWashCount++;
        }
      }
    }

    console.log(`   ✅ Stencil Washes: ${stencilWashesInserted} inserted`);
    console.log(`   📊 Distribution: ${singleWashCount} stencils with 1 wash (concentrated), ${multiWashCount} with multiple washes`);


    // ============================================
    // 2. SEED DE PLATES (35 registers)
    // ============================================
    console.log('\n📦 Generate 35 Plates...');
    let platesInserted = 0;
    let platesSkipped = 0;
    const createdPlates: Plate[] = [];

    for (let i = 1; i <= 35; i++) {
      const plateData = generatePlateData(i);
      const serialNumber = plateData.serialNumber!;

      const exists = await plateExists(dataSource, serialNumber);

      if (!exists) {
        const plate = plateRepo.create(plateData);
        const savedPlate = await plateRepo.save(plate);
        createdPlates.push(savedPlate);
        platesInserted++;
      } else {
        platesSkipped++;
      }

      if (i % 10 === 0) {
        console.log(
          `   ✅ Plates: ${platesInserted} inserted, ${platesSkipped} existing`,
        );
      }
    }

    console.log(
      `   ✅ Plates: ${platesInserted} inserted, ${platesSkipped} existing`,
    );

    // ============================================
    // 2.1 WASHES FOR PLATES (between 3-8 washes each)
    // ============================================
    console.log('\n🧼 Generating Washes for Plates (last 5 weekdays)...');
    let plateWashesInserted = 0;
    let plateSingleWashCount = 0;
    let plateMultiWashCount = 0;

    const totalPlatesCount = createdPlates.length;
    const plateSingleWashTarget = Math.floor(totalPlatesCount * 0.8);

    for (let i = 0; i < createdPlates.length; i++) {
      const plate = createdPlates[i];
      const useSingleWash = i < plateSingleWashTarget;

      if (useSingleWash) {
        const washes = generatePlateWashes(plate.id, 1, true, true);
        for (const washData of washes) {
          const wash = plateWashRepo.create(washData);
          await plateWashRepo.save(wash);
          plateWashesInserted++;
          plateSingleWashCount++;
        }
      } else {
        const washCount = random(3, 8);
        const washes = generatePlateWashes(plate.id, washCount, false, false);
        for (const washData of washes) {
          const wash = plateWashRepo.create(washData);
          await plateWashRepo.save(wash);
          plateWashesInserted++;
          plateMultiWashCount++;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`   ✅ Processed ${i + 1}/${totalPlatesCount} plates`);
      }
    }

    console.log(`   ✅ Plate Washes: ${plateWashesInserted} inserted`);
    console.log(`   📊 Distribution: ${plateSingleWashCount} plates with 1 wash (concentrated), ${plateMultiWashCount} with multiple washes`);

    // ============================================
    // 3. FINAL VERIFICATION
    // ============================================
    const totalStencils = await stencilRepo.count();
    const totalStencilWashes = await stencilWashRepo.count();
    const totalPlates = await plateRepo.count();
    const totalPlateWashes = await plateWashRepo.count();

    console.log('\n📊 SEED RESUME:');
    console.log(`   Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing.`);
    console.log(`   Stencil Washes: ${stencilWashesInserted} inserted.`);
    console.log(`   Plates: ${platesInserted} inserted, ${platesSkipped} existing.`);
    console.log(`   Plate Washes: ${plateWashesInserted} inserted.`);
    console.log(`   New registers total: ${stencilsInserted + platesInserted + stencilWashesInserted + plateWashesInserted}`);

    console.log('\n📈 DATABASE TOTAL:');
    console.log(`   Stencils: ${totalStencils}`);
    console.log(`   Stencil Washes: ${totalStencilWashes}`);
    console.log(`   Plates: ${totalPlates}`);
    console.log(`   Plate Washes: ${totalPlateWashes}`);

    if (stencilsInserted > 0) {
      const lastStencils = await stencilRepo.find({
        take: 3,
        order: { createdAt: 'DESC' },
        relations: ['washes'],
      });
      console.log('\n🔍 Last stencils inserted:');
      lastStencils.forEach((s) => {
        const washDates = s.washes.map(w => w.createdAt.toLocaleDateString()).join(', ');
        console.log(
          `   - ${s.stencilCode} | ${s.lineName} | Created: ${s.createdAt.toLocaleString()} | ${s.washes.length} washes (${washDates})`,
        );
      });
    }

    if (platesInserted > 0) {
      const lastPlates = await plateRepo.find({
        take: 3,
        order: { createdAt: 'DESC' },
        relations: ['washes'],
      });
      console.log('\n🔍 Latest plates inserted:');
      lastPlates.forEach((p) => {
        const washDates = p.washes.map(w => w.createdAt.toLocaleDateString()).join(', ');
        const shifts = p.washes.map(w => w.shift).join(', ');
        console.log(
          `   - ${p.serialNumber} | ${p.lineName} | Created: ${p.createdAt.toLocaleString()} | ${p.washes.length} washes (${washDates}) | Shifts: ${shifts}`,
        );
      });
    }

    console.log('\n✅ Seed concluded successfully!');
  } catch (error) {
    console.error('\n❌ Error on seed:', error);
    if (error instanceof Error) {
      console.error('Detail:', error.message);
    } else if (typeof error === 'string') {
      console.error('Detail:', error);
    } else {
      console.error('Detail: Unknown error');
    }
  } finally {
    await dataSource.destroy();
    console.log('🔌 Connection to SQL Server completed.');
  }
}

runSeed();
