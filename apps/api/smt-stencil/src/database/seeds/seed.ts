import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PlateWash } from '../../plates/entities/plate-wash.entity';
import { Plate, PlatePhaseKind } from '../../plates/entities/plate.entity';
import { StencilWash } from '../../stencils/entities/stencil-wash.entity';
import {
  Stencil,
  StencilApprovalStatus,
  StencilPhase,
  StencilTechnicalOpinion,
  WashStatus,
} from '../../stencils/entities/stencil.entity';

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
  'A960',
  'A90S',
  'P3H&P3K',
  'SMB100',
  'SMC300',
  'SMD400',
];
const STENCIL_TYPES = ['MAIN', 'RF', 'TOP'];
const STENCIL_VERSIONS = ['53', '17', '03', ''];
const STENCIL_PHASES = [
  StencilPhase.FIRST,
  StencilPhase.SECOND,
  StencilPhase.UNIQUE,
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
  'P3H&P3K',
  'A960',
  'A90S',
  'P2K',
  'P3K',
  'MAINBOARD',
];
const PLATE_TYPES = ['MAIN', 'SUB', 'IO', 'RF', 'TOP', 'BOTTOM'];

const OPERATORS = ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Souza'];
const SHIFTS = [1, 2];
const PHASES = [1, 2];

const NON_ACTIVE_STENCIL_INTERVAL = 7;
const ANALYTICS_SEED_DAYS = 90;
const STENCIL_SEED_COUNT = 20;
const PLANNED_WASHES_PER_STENCIL = 50;
const ANOMALOUS_WASHES_PER_STENCIL = 5;
const MULTIPLE_DAYS_PER_STENCIL = 2;

const MIN_HOUR_UTC = 11;
const MAX_HOUR_UTC = 21;

const TODAY_MIN_WASHES = 25;
const TODAY_MAX_WASHES = 40;
const PLANNED_HOURS_UTC = [15, 16, 20]; 
const ANOMALOUS_HOURS_UTC = [12, 13, 17, 18, 19];

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleDates(dates: Date[]): Date[] {
  return shuffleArray(dates);
}

function getLastBusinessDays(days: number = ANALYTICS_SEED_DAYS): Date[] {
  const businessDays: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let dayOffset = days - 1; dayOffset >= 1; dayOffset--) {
    const currentDate = new Date(today);
    currentDate.setUTCDate(currentDate.getUTCDate() - dayOffset);
    if (isWeekday(currentDate)) {
      businessDays.push(currentDate);
    }
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

function createStencilWashDate(
  day: Date,
  type: 'planned' | 'anomalous',
  preferredHour?: number,
): Date {
  const date = new Date(day);
  const availableHours =
    type === 'planned' ? PLANNED_HOURS_UTC : ANOMALOUS_HOURS_UTC;
  const hour =
    preferredHour ?? availableHours[random(0, availableHours.length - 1)];
  
  let maxMinute = 55;
  if (type === 'planned' && hour === 20) {
    maxMinute = 59;
  }
  
  date.setUTCHours(hour, random(5, maxMinute), random(0, 59), 0);
  return date;
}

function generateStencilAnalyticsWashDates(index: number): Date[] {
  const dates: Date[] = [];
  const availableDays = shuffleDates(getLastBusinessDays(ANALYTICS_SEED_DAYS));
  const plannedDayCount = Math.min(
    PLANNED_WASHES_PER_STENCIL,
    availableDays.length - ANOMALOUS_WASHES_PER_STENCIL,
  );
  const plannedDays = availableDays.slice(0, plannedDayCount);

  plannedDays.forEach((day) => {
    dates.push(createStencilWashDate(day, 'planned'));
  });

  if (index % 2 === 0) {
    availableDays
      .slice(
        plannedDayCount,
        plannedDayCount + ANOMALOUS_WASHES_PER_STENCIL,
      )
      .forEach((day) => {
        dates.push(createStencilWashDate(day, 'anomalous'));
      });
  } else {
    shuffleDates(plannedDays)
      .slice(0, MULTIPLE_DAYS_PER_STENCIL)
      .forEach((multipleDay) => {
        const existingWash = dates.find(
          (date) =>
            date.getUTCFullYear() === multipleDay.getUTCFullYear() &&
            date.getUTCMonth() === multipleDay.getUTCMonth() &&
            date.getUTCDate() === multipleDay.getUTCDate(),
        );
        const secondHour = existingWash?.getUTCHours() === 15 ? 20 : 15;
        dates.push(createStencilWashDate(multipleDay, 'planned', secondHour));
      });
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function generateTodayStencilWashes(activeStencils: Stencil[]): StencilWash[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (activeStencils.length === 0) return [];

  const totalWashes = random(TODAY_MIN_WASHES, TODAY_MAX_WASHES);
  const washResults: StencilWash[] = [];

  const plannedPercentage = random(90, 95);
  const anomalousPercentage = random(5, 10);
  const multiplePercentage = Math.max(0, 100 - plannedPercentage - anomalousPercentage);

  const plannedCount = Math.floor((totalWashes * plannedPercentage) / 100);
  const anomalousCount = Math.floor((totalWashes * anomalousPercentage) / 100);
  const multipleCount = Math.min(Math.floor((totalWashes * multiplePercentage) / 100), 2);

  const shuffledStencils = shuffleArray(activeStencils);
  
  let stencilIndex = 0;

  const createWash = (stencil: Stencil, hour: number, minute?: number): StencilWash | null => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    const washDate = new Date(today);
    
    let finalMinute = minute ?? random(5, 55);
    
    if (hour > currentHour || (hour === currentHour && finalMinute > currentMinute)) {
      return null;
    }
    
    if (hour < 11) {
      return null;
    }
    
    if (hour === 20 && finalMinute > 59) {
      finalMinute = 59;
    }
    
    if (hour >= 21) {
      return null;
    }
    
    washDate.setUTCHours(hour, finalMinute, random(0, 59), 0);
    
    const wash = new StencilWash();
    wash.stencilId = stencil.id;
    wash.operator = OPERATORS[random(0, OPERATORS.length - 1)];
    wash.createdAt = washDate;
    return wash;
  };

  let plannedInserted = 0;
  for (let i = 0; i < plannedCount * 2; i++) {
    if (plannedInserted >= plannedCount) break;
    
    const stencil = shuffledStencils[stencilIndex % shuffledStencils.length];
    const hour = random(0, 1) === 0 ? 
      random(15, 16) :
      20;
    
    const wash = createWash(stencil, hour);
    if (wash) {
      washResults.push(wash);
      plannedInserted++;
    }
    stencilIndex++;
  }

  let anomalousInserted = 0;
  for (let i = 0; i < anomalousCount * 2; i++) {
    if (anomalousInserted >= anomalousCount) break;
    
    const stencil = shuffledStencils[stencilIndex % shuffledStencils.length];
    const availableHours = ANOMALOUS_HOURS_UTC.filter(h => h >= 11 && h !== 20);
    if (availableHours.length === 0) break;
    
    const hour = availableHours[random(0, availableHours.length - 1)];
    const wash = createWash(stencil, hour);
    if (wash) {
      washResults.push(wash);
      anomalousInserted++;
    }
    stencilIndex++;
  }

  let multipleInserted = 0;
  for (let i = 0; i < multipleCount * 3; i++) {
    if (multipleInserted >= multipleCount) break;
    
    const stencil = shuffledStencils[stencilIndex % shuffledStencils.length];
    
    const firstHour = random(11, 18);
    const firstWash = createWash(stencil, firstHour);
    if (!firstWash) continue;
    
    let secondHour;
    let attempts = 0;
    do {
      secondHour = random(13, 19);
      attempts++;
    } while ((Math.abs(secondHour - firstHour) < 2 || secondHour === 20) && attempts < 10);
    
    if (Math.abs(secondHour - firstHour) >= 2 && secondHour !== 20) {
      const secondWash = createWash(stencil, secondHour);
      if (secondWash) {
        washResults.push(firstWash);
        washResults.push(secondWash);
        multipleInserted++;
      }
    }
    
    stencilIndex++;
  }

  return washResults;
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
  const plateModel = STENCIL_CODES[random(0, STENCIL_CODES.length - 1)];
  const plateType = STENCIL_TYPES[random(0, STENCIL_TYPES.length - 1)];
  const version = STENCIL_VERSIONS[random(0, STENCIL_VERSIONS.length - 1)];
  const phase = STENCIL_PHASES[random(0, STENCIL_PHASES.length - 1)];
  const manufactureId = MANUFACTURE_IDS[random(0, MANUFACTURE_IDS.length - 1)];
  const country = COUNTRIES[random(0, COUNTRIES.length - 1)];
  const effectiveManufactureId =
    country.toLowerCase() === 'china' ? 'CHINA' : manufactureId;
  const copy = index % 3 === 0 ? String(random(1, 9)) : undefined;
  const thickness = randomFloat(0.05, 0.15, 6);
  const addressing = String(random(1, 100)).padStart(3, '0');
  const lineName = LINE_NAMES[random(0, LINE_NAMES.length - 1)];
  const nonActiveStatuses = [
    WashStatus.VALIDATION,
    WashStatus.OBSOLETE,
    WashStatus.DISCARDED,
  ];
  const status =
    index % NON_ACTIVE_STENCIL_INTERVAL === 0
      ? nonActiveStatuses[index % nonActiveStatuses.length]
      : WashStatus.ACTIVE;
  const createdAt = randomCurrentDate();
  const manufacturedAt = new Date(createdAt);
  manufacturedAt.setUTCMonth(manufacturedAt.getUTCMonth() - random(3, 18));
  const codeSegments = [
    plateModel,
    plateType,
    version ? `V${version}` : null,
    phase,
    effectiveManufactureId,
  ].filter(Boolean);
  const stencilCode = `${codeSegments.join('_')}${copy ? `/${copy}` : ''}`;

  const stencil = new Stencil();
  stencil.stencilCode = stencilCode;
  stencil.plateModel = plateModel;
  stencil.plateType = plateType;
  stencil.version = version || undefined;
  stencil.phase = phase;
  stencil.copy = copy;
  stencil.manufactureId = effectiveManufactureId;
  stencil.country = country;
  stencil.thickness = thickness;
  stencil.addressing = addressing;
  stencil.manufacturedAt = manufacturedAt;
  stencil.serigraphy = StencilApprovalStatus.OK;
  stencil.fiducials =
    index % 11 === 0 ? StencilApprovalStatus.FAIL : StencilApprovalStatus.OK;
  stencil.finishing = StencilApprovalStatus.OK;
  stencil.technicalOpinion =
    index % 11 === 0
      ? StencilTechnicalOpinion.REJECTED
      : StencilTechnicalOpinion.APPROVED;
  stencil.lineName = lineName;
  stencil.status = status;
  stencil.createdAt = createdAt;
  stencil.updatedAt = createdAt;

  return stencil;
}

function generatePlateData(index: number): Partial<Plate> {
  const model = PLATE_MODELS[index % PLATE_MODELS.length];
  const plateType =
    PLATE_TYPES[Math.floor(index / PLATE_MODELS.length) % PLATE_TYPES.length];
  const phases =
    index % 4 === 0 ? PlatePhaseKind.SINGLE_PHASE : PlatePhaseKind.TWO_PHASES;
  const platesPerBlank = phases === PlatePhaseKind.SINGLE_PHASE ? 1 : random(2, 4);
  const plateModel = `${model}_${plateType}`;
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
  plate.model = model;
  plate.plateType = plateType;
  plate.phases = phases;
  plate.platesPerBlank = platesPerBlank;
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
    // 1. SEED DE STENCILS
    // ============================================
    console.log(`\n📦 Generate ${STENCIL_SEED_COUNT} Stencils...`);
    let stencilsInserted = 0;
    let stencilsSkipped = 0;
    let activeStencilsInserted = 0;
    let nonActiveStencilsInserted = 0;
    const createdStencils: Stencil[] = [];
    const activeStencils: Stencil[] = [];

    for (let i = 1; i <= STENCIL_SEED_COUNT; i++) {
      const stencilData = generateStencilData(i);
      const stencilCode = stencilData.stencilCode!;

      const exists = await stencilExists(dataSource, stencilCode);

      if (!exists) {
        const stencil = stencilRepo.create(stencilData);
        const savedStencil = await stencilRepo.save(stencil);
        createdStencils.push(savedStencil);
        if (savedStencil.status === WashStatus.ACTIVE) {
          activeStencilsInserted++;
          activeStencils.push(savedStencil);
        } else {
          nonActiveStencilsInserted++;
        }
        stencilsInserted++;
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
      `   📊 Status: ${activeStencilsInserted} active, ${nonActiveStencilsInserted} non-active`,
    );

    // ============================================
    // 1.1 WASHES FOR STENCILS (analytics-friendly 90-day history)
    // ============================================
    console.log('\n🧼 Generating Washes for Stencils (last 90 days)...');
    let stencilWashesInserted = 0;
    let anomalousProfileCount = 0;
    let multipleProfileCount = 0;

    for (let i = 0; i < createdStencils.length; i++) {
      const stencil = createdStencils[i];
      const washes = generateStencilAnalyticsWashDates(i);

      if (i % 2 === 0) anomalousProfileCount++;
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
      `   📊 Profiles: ${anomalousProfileCount} with rare anomalies, ${multipleProfileCount} with one multiple-wash day`,
    );

    // ============================================
    // 1.2 WASHES FOR STENCILS TODAY (NOVO)
    // ============================================
    console.log(`\n🧼 Generating Today's Stencil Washes (${TODAY_MIN_WASHES}-${TODAY_MAX_WASHES} washes)...`);
    console.log(`   📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`   🕐 Range: 11:00 UTC until current time (${new Date().getUTCHours()}:${String(new Date().getUTCMinutes()).padStart(2, '0')} UTC)`);
    console.log(`   📊 Distribution: 90-95% planned, 5-10% anomalous, 0-2% multiple`);
    
    if (activeStencils.length === 0) {
      console.log('⚠️ No active stencils available for today\'s washes');
    } else {
      const todayWashes = generateTodayStencilWashes(activeStencils);
      let todayWashesInserted = 0;
      let plannedToday = 0;
      let anomalousToday = 0;
      let multipleToday = 0;

      const washesByStencil = new Map<string, Date[]>();
      for (const wash of todayWashes) {
        if (!washesByStencil.has(wash.stencilId)) {
          washesByStencil.set(wash.stencilId, []);
        }
        washesByStencil.get(wash.stencilId)!.push(wash.createdAt);
      }

      for (const wash of todayWashes) {
        const hour = wash.createdAt.getUTCHours();
        const isPlanned = (hour >= 15 && hour <= 16) || hour === 20;
        
        const stencilWashes = washesByStencil.get(wash.stencilId) || [];
        const isMultiple = stencilWashes.length > 1;
        
        if (isMultiple) {
          multipleToday++;
        } else if (isPlanned) {
          plannedToday++;
        } else {
          anomalousToday++;
        }

        await stencilWashRepo.save(wash);
        todayWashesInserted++;
      }

      console.log(`   ✅ Today's Stencil Washes: ${todayWashesInserted} inserted`);
      if (todayWashesInserted > 0) {
        console.log(`   📊 Distribution: ${plannedToday} planned (${Math.round((plannedToday/todayWashesInserted)*100)}%), ${anomalousToday} anomalous (${Math.round((anomalousToday/todayWashesInserted)*100)}%), ${multipleToday} multiple (${Math.round((multipleToday/todayWashesInserted)*100)}%)`);
      }
    }

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
    console.log(`   Stencil Washes (90 days): ${stencilWashesInserted} inserted.`);
    console.log(`   Stencil Washes (Today): ${activeStencils.length > 0 ? 'generated' : 'skipped (no active stencils)'}.`);
    console.log(`   Plates: ${platesInserted} inserted, ${platesSkipped} existing.`);
    console.log(`   Plate Washes: ${plateWashesInserted} inserted.`);
    console.log(`   Total new registers: ${stencilsInserted + platesInserted + stencilWashesInserted + plateWashesInserted}`);

    console.log('\n📈 DATABASE TOTAL:');
    console.log(`   Stencils: ${totalStencils}`);
    console.log(`   Stencil Washes: ${totalStencilWashes}`);
    console.log(`   Plates: ${totalPlates}`);
    console.log(`   Plate Washes: ${totalPlateWashes}`);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    const todayWashesCount = await stencilWashRepo
      .createQueryBuilder('wash')
      .where('wash.createdAt >= :today AND wash.createdAt < :tomorrow', {
        today: today,
        tomorrow: tomorrow,
      })
      .getCount();

    console.log(`\n📊 TODAY'S WASHES: ${todayWashesCount} stencil washes`);

    if (todayWashesCount > 0) {
      const todayWashes = await stencilWashRepo
        .createQueryBuilder('wash')
        .where('wash.createdAt >= :today AND wash.createdAt < :tomorrow', {
          today: today,
          tomorrow: tomorrow,
        })
        .leftJoinAndSelect('wash.stencil', 'stencil')
        .orderBy('wash.createdAt', 'ASC')
        .getMany();

      console.log('\n🔍 Sample of today\'s washes:');
      todayWashes.slice(0, 5).forEach((w) => {
        const hour = w.createdAt.getUTCHours();
        const isPlanned = (hour >= 15 && hour <= 16) || hour === 20;
        console.log(
          `   - ${w.stencil?.stencilCode || 'Unknown'} | ${w.createdAt.toLocaleString()} | ${isPlanned ? 'PLANNED' : 'ANOMALOUS'} | ${w.operator}`,
        );
      });
      
      if (todayWashes.length > 5) {
        console.log(`   ... and ${todayWashes.length - 5} more washes`);
      }

      const after21 = todayWashes.filter(w => w.createdAt.getUTCHours() >= 21);
      if (after21.length > 0) {
        console.log(`\n⚠️ WARNING: ${after21.length} washes found after 21:00 UTC!`);
        after21.forEach(w => {
          console.log(`   - ${w.stencil?.stencilCode} at ${w.createdAt.toLocaleString()}`);
        });
      }
    }

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
