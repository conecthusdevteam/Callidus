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

const MIN_HOUR_UTC = 11;
const MAX_HOUR_UTC = 21;

const ANOMALOUS_HOURS_UTC = [11, 12, 13, 14, 16, 17, 18, 19, 21];

const SINGLE_WASH_PERCENTAGE = 0.85;
const PEAK_HOUR_PROBABILITY = 0.75;

const PEAK_HOURS_UTC = [
  { start: 15, end: 16 },
  { start: 20, end: 21 }
];


function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0;
}

function getLastBusinessDays(days: number = ANALYTICS_SEED_DAYS): Date[] {
  const businessDays: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let currentDate = new Date(today);
  let daysFound = 0;

  while (daysFound < days) {
    if (isWeekday(currentDate)) {
      businessDays.unshift(new Date(currentDate));
      daysFound++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  return businessDays;
}

function randomPastDate(date: Date): Date {
  const hours = random(MIN_HOUR_UTC, MAX_HOUR_UTC);
  const minutes = random(0, hours === MAX_HOUR_UTC ? 0 : 59);
  const seconds = random(0, 59);

  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCHours(hours, minutes, seconds);

  return result;
}

function randomDateInTimeRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

function randomCurrentDate(): Date {
  const now = new Date();
  const currentHourUTC = now.getUTCHours();
  const currentMinutesUTC = now.getUTCMinutes();

  const startDate = new Date(now);
  startDate.setUTCHours(MIN_HOUR_UTC, 0, 0, 0);

  const endDate = new Date(now);

  if (currentHourUTC >= MAX_HOUR_UTC) {
    endDate.setUTCHours(MAX_HOUR_UTC, 0, 0, 0);
  } else if (currentHourUTC >= MIN_HOUR_UTC) {
    endDate.setUTCHours(currentHourUTC, currentMinutesUTC, 0, 0);
  } else {
    return startDate;
  }

  if (startDate >= endDate) {
    return startDate;
  }

  const result = randomDateInTimeRange(startDate, endDate);

  return result;
}

function randomWashDate(dayOffset: number, planned: boolean, forcePeakHour: boolean = false): Date {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setUTCDate(targetDate.getUTCDate() - dayOffset);

  const isToday = dayOffset === 0;

  if (isToday) {
    const currentHourUTC = now.getUTCHours();
    const currentMinutesUTC = now.getUTCMinutes();
    const currentSecondsUTC = now.getUTCSeconds();

    if (currentHourUTC < MIN_HOUR_UTC) {
      const date = new Date(targetDate);
      date.setUTCHours(MIN_HOUR_UTC, 0, 0, 0);
      return date;
    }

    const startTotalMinutes = MIN_HOUR_UTC * 60;
    const currentTotalMinutes = (currentHourUTC * 60) + currentMinutesUTC;

    if (currentTotalMinutes <= startTotalMinutes) {
      const date = new Date(targetDate);
      date.setUTCHours(MIN_HOUR_UTC, 0, 0, 0);
      return date;
    }

    let randomMinutes: number;

    if (forcePeakHour) {
      const peakStartMinutes = 15 * 60;
      const peakEndMinutes = 16 * 60;
      const eveningPeakStart = 20 * 60;
      const eveningPeakEnd = 21 * 60;

      const useMorningPeak = Math.random() < 0.6;

      if (useMorningPeak && peakEndMinutes <= currentTotalMinutes) {
        randomMinutes = random(peakStartMinutes, Math.min(peakEndMinutes, currentTotalMinutes));
      } else if (eveningPeakEnd <= currentTotalMinutes) {
        randomMinutes = random(eveningPeakStart, Math.min(eveningPeakEnd, currentTotalMinutes));
      } else {
        randomMinutes = random(startTotalMinutes, currentTotalMinutes);
      }
    } else if (planned) {
      const plannedStart = 13 * 60;
      const plannedEnd = Math.min(17 * 60, currentTotalMinutes);
      if (plannedEnd > plannedStart) {
        randomMinutes = random(plannedStart, plannedEnd);
      } else {
        randomMinutes = random(startTotalMinutes, currentTotalMinutes);
      }
    } else {
      const anomalousHours = [11, 12, 18, 19];
      const anomalousHour = anomalousHours[Math.floor(Math.random() * anomalousHours.length)];
      let maxMinute = 59;
      if (anomalousHour === currentHourUTC) {
        maxMinute = currentMinutesUTC;
      }
      randomMinutes = (anomalousHour * 60) + random(0, maxMinute);

      if (randomMinutes > currentTotalMinutes) {
        randomMinutes = currentTotalMinutes;
      }
    }

    const hours = Math.floor(randomMinutes / 60);
    const minutes = randomMinutes % 60;
    const seconds = random(0, 59);

    const result = new Date(targetDate);
    result.setUTCHours(hours, minutes, seconds, 0);

    if (result > now) {
      return new Date(now);
    }

    return result;
  }


  let hourUTC: number;
  let minute: number;
  let second: number;

  if (forcePeakHour) {
    const peak = PEAK_HOURS_UTC[random(0, PEAK_HOURS_UTC.length - 1)];
    hourUTC = random(peak.start, peak.end);
    minute = random(0, hourUTC === peak.end ? 0 : 59);
    second = random(0, 59);
  } else if (planned) {
    if (Math.random() < 0.7) {
      const peak = PEAK_HOURS_UTC[random(0, PEAK_HOURS_UTC.length - 1)];
      hourUTC = random(peak.start, peak.end);
      minute = random(0, hourUTC === peak.end ? 0 : 59);
    } else {
      hourUTC = random(13, 17);
      minute = random(0, 59);
    }
    second = random(0, 59);
  } else {
    hourUTC = ANOMALOUS_HOURS_UTC[random(0, ANOMALOUS_HOURS_UTC.length - 1)];
    minute = random(0, 59);
    second = random(0, 59);
  }

  const resultDate = new Date(targetDate);
  resultDate.setUTCHours(hourUTC, minute, second, 0);

  return resultDate;
}

function generateStencilAnalyticsWashDates(index: number): Date[] {
  const dates: Date[] = [];
  const businessDays = getLastBusinessDays(ANALYTICS_SEED_DAYS);

  const isSingleWashProfile = Math.random() < SINGLE_WASH_PERCENTAGE;

  if (isSingleWashProfile) {
    const washCount = random(15, 25);

    const shuffledDays = [...businessDays];
    for (let i = shuffledDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDays[i], shuffledDays[j]] = [shuffledDays[j], shuffledDays[i]];
    }

    const selectedDays = shuffledDays.slice(0, Math.min(washCount, businessDays.length));

    for (const day of selectedDays) {
      const dayOffset = Math.floor((new Date().getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
      const usePeakHour = Math.random() < PEAK_HOUR_PROBABILITY;
      dates.push(randomWashDate(dayOffset, true, usePeakHour));
    }
  } else {
    const multipleDaysCount = random(10, Math.min(20, businessDays.length));
    const multipleDays = [...businessDays.slice(-multipleDaysCount)];

    for (const day of multipleDays) {
      const dayOffset = Math.floor((new Date().getTime() - day.getTime()) / (1000 * 60 * 60 * 24));

      dates.push(randomWashDate(dayOffset, true, true));

      if (Math.random() < 0.4) {
        dates.push(randomWashDate(dayOffset, false, false));
      }

      if (Math.random() < 0.2) {
        dates.push(randomWashDate(dayOffset, false, false));
      }
    }

    const extraWashesCount = random(5, 12);
    const remainingDays = [...businessDays];
    for (let i = remainingDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingDays[i], remainingDays[j]] = [remainingDays[j], remainingDays[i]];
    }

    const extraDays = remainingDays.slice(0, extraWashesCount);
    for (const day of extraDays) {
      const dayOffset = Math.floor((new Date().getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
      const usePeakHour = Math.random() < PEAK_HOUR_PROBABILITY;
      dates.push(randomWashDate(dayOffset, true, usePeakHour));
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function getLastWeekdays(days: number = 5): Date[] {
  const weekdays: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let currentDate = new Date(today);

  while (weekdays.length < days) {
    if (isWeekday(currentDate)) {
      weekdays.unshift(new Date(currentDate));
    }
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  return weekdays;
}

function generateWashDates(washCount: number, forceSingleWash: boolean = false): Date[] {
  const weekdays = getLastWeekdays(5);
  const dates: Date[] = [];

  if (forceSingleWash) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dayIndex = random(0, weekdays.length - 1);
    const selectedDay = weekdays[dayIndex];
    const isToday = selectedDay.getTime() === today.getTime();

    const washDate = isToday ? randomCurrentDate() : randomPastDate(selectedDay);
    dates.push(washDate);

    return dates;
  }

  for (let i = 0; i < washCount; i++) {
    const dayIndex = random(0, weekdays.length - 1);
    const selectedDay = weekdays[dayIndex];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let washDate: Date;

    if (selectedDay.getTime() === today.getTime()) {
      washDate = randomCurrentDate();
    } else {
      washDate = randomPastDate(selectedDay);
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
  const createdAt = randomCurrentDate();

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
  const createdAt = randomCurrentDate();

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

function generatePlateWashes(plateId: string, washCount: number, forceSingleWash: boolean = false): Partial<PlateWash>[] {
  const washDates = generateWashDates(washCount, forceSingleWash);

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

async function stencilExists(dataSource: DataSource, stencilCode: string): Promise<boolean> {
  const result = await dataSource
    .getRepository(Stencil)
    .createQueryBuilder('stencil')
    .where('stencil.stencilCode = :code', { code: stencilCode })
    .getCount();

  return result > 0;
}

async function plateExists(dataSource: DataSource, serialNumber: string): Promise<boolean> {
  const result = await dataSource
    .getRepository(Plate)
    .createQueryBuilder('plate')
    .where('plate.serialNumber = :serial', { serial: serialNumber })
    .getCount();

  return result > 0;
}

// ============================================
// MAIN SEED
// ============================================
async function runSeed() {
  console.log('🚀 Initializing seed of Stencils, Plates and Washes (SQL Server)...');
  console.log(`📊 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`💾 Database: ${process.env.DB_DATABASE}`);
  console.log(`⏰ Timezone: All dates stored in UTC`);
  console.log(`🕐 Today's range: 11:00 UTC (07:00 Manaus) until current time\n`);

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
    let plannedProfileCount = 0;
    let mixedProfileCount = 0;
    let multipleProfileCount = 0;

    for (let i = 0; i < createdStencils.length; i++) {
      const stencil = createdStencils[i];
      const washes = generateStencilAnalyticsWashDates(i);

      if (i % 10 <= 5) plannedProfileCount++;
      else if (i % 10 <= 7) mixedProfileCount++;
      else multipleProfileCount++;

      for (const date of washes) {
        const wash = stencilWashRepo.create({
          stencilId: stencil.id,
          operator: OPERATORS[random(0, OPERATORS.length - 1)],
          createdAt: date,
        });
        await stencilWashRepo.save(wash);
        stencilWashesInserted++;
      }

      if ((i + 1) % 10 === 0) {
        console.log(`   ✅ Processed ${i + 1}/${createdStencils.length} stencils`);
      }
    }

    console.log(`   ✅ Stencil Washes: ${stencilWashesInserted} inserted`);
    console.log(
      `   📊 Profiles: ${plannedProfileCount} planned-heavy, ${mixedProfileCount} mixed, ${multipleProfileCount} multiple-day`,
    );

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
        const washes = generatePlateWashes(plate.id, 1, true);
        for (const washData of washes) {
          const wash = plateWashRepo.create(washData);
          await plateWashRepo.save(wash);
          plateWashesInserted++;
          plateSingleWashCount++;
        }
      } else {
        const washCount = random(3, 8);
        const washes = generatePlateWashes(plate.id, washCount, false);
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
    console.log(`   Total new registers: ${stencilsInserted + platesInserted + stencilWashesInserted + plateWashesInserted}`);

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