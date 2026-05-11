import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Stencil, WashStatus } from '../../stencils/entities/stencil.entity';
import { Plate } from '../../plates/entities/plate.entity';

config();

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min: number, max: number, decimals: number = 6) => {
  const valor = Math.random() * (max - min) + min;
  return parseFloat(valor.toFixed(decimals));
};

const COUNTRIES = ['Brasil', 'China', 'Alemanha', 'EUA', 'Japão', 'Coreia', 'México', 'Vietnã'];
const OPERATORS = ['João Silva', 'Maria Santos', 'Carlos Souza', 'Ana Oliveira', 'Pedro Costa', 'Lucia Ferreira', 'Roberto Almeida', 'Fernanda Lima'];
const LINE_NAMES = ['Manaus', 'Manacapuru', 'Borba', 'Tefé', 'Coari', 'Manicoré'];
const STENCIL_CODES = ['SMB-100', 'SMB-200', 'SMC-300', 'SMD-400', 'SME-500', 'SMF-600', 'SMG-700', 'SMH-800'];
const MANUFACTURE_IDS = ['MNF-001', 'MNF-002', 'MNF-003', 'MNF-004', 'MNF-005', 'MNF-006'];
const PLATE_MODELS = ['PCB-1000', 'PCB-2000', 'PCB-3000', 'PCB-4000', 'PCB-5000', 'PCB-6000'];

const STATUSES = [WashStatus.ACTIVE, WashStatus.INACTIVE];

function randomDate(): Date {
  const now = new Date();
  const currentHour = now.getHours();
  const maxHour = Math.min(currentHour, 21);

  if (maxHour < 11) {
    throw new Error('Current create seeds before 7:00 AM');
  }

  const hoursAgo = random(11, maxHour);

  let minutesAgo = 0;
  let secondsAgo = 0;

  if (hoursAgo === currentHour && currentHour <= 21) {
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    minutesAgo = random(0, currentMinutes);
    secondsAgo = random(0, minutesAgo === currentMinutes ? currentSeconds : 59);
  } else {
    minutesAgo = random(0, 59);
    secondsAgo = random(0, 59);
  }

  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setHours(hoursAgo, minutesAgo, secondsAgo);

  return date;
}

function generateStencilData(index: number): Partial<Stencil> {
  const stencilCodeBase = STENCIL_CODES[random(0, STENCIL_CODES.length - 1)];
  const manufactureId = MANUFACTURE_IDS[random(0, MANUFACTURE_IDS.length - 1)];
  const country = COUNTRIES[random(0, COUNTRIES.length - 1)];
  const thickness = randomFloat(0.05, 0.15, 6);
  const addressing = random(1, 100);
  const totalWashes = random(0, 500);
  const operator = OPERATORS[random(0, OPERATORS.length - 1)];
  const lineName = LINE_NAMES[random(0, LINE_NAMES.length - 1)];
  const status = STATUSES[random(0, STATUSES.length - 1)];
  
  const stencil = new Stencil();
  stencil.stencilCode = `${stencilCodeBase}-${String(index).padStart(4, '0')}`;
  stencil.manufactureId = manufactureId;
  stencil.country = country;
  stencil.thickness = thickness;
  stencil.addressing = addressing;
  stencil.totalWashes = totalWashes;
  stencil.operator = operator;
  stencil.lineName = lineName;
  stencil.status = status;
  stencil.createdAt = randomDate();
  stencil.updatedAt = stencil.createdAt;
  
  return stencil;
}

function generatePlateData(index: number): Partial<Plate> {
  const plateModel = PLATE_MODELS[random(0, PLATE_MODELS.length - 1)];
  const serialNumber = `${plateModel}-${String(index).padStart(6, '0')}`;
  const blankId = `BLANK-${random(1000, 9999)}`;
  const shift = random(1, 3);
  const phase = random(1, 4);
  const totalWashes = random(0, 300);
  const operator = OPERATORS[random(0, OPERATORS.length - 1)];
  const lineName = LINE_NAMES[random(0, LINE_NAMES.length - 1)];
  const plateManufacturerId = MANUFACTURE_IDS[random(0, MANUFACTURE_IDS.length - 1)];
  const country = COUNTRIES[random(0, COUNTRIES.length - 1)];
  const thickness = randomFloat(0.05, 0.15, 2);
  const addressing = String(random(1, 100)).padStart(3, '0');
  
  const plate = new Plate();
  plate.plateModel = plateModel;
  plate.serialNumber = serialNumber;
  plate.blankId = blankId;
  plate.shift = shift;
  plate.phase = phase;
  plate.totalWashes = totalWashes;
  plate.operator = operator;
  plate.lineName = lineName;
  plate.plateManufacturerId = plateManufacturerId;
  plate.country = country;
  plate.thickness = thickness;
  plate.addressing = addressing;
  plate.createdAt = randomDate();
  plate.updatedAt = plate.createdAt;
  
  return plate;
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

async function runSeed() {
  console.log('🚀 Initializing seed of Stencils and Plates (SQL Server)...');
  console.log(`📊 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`💾 Database: ${process.env.DB_DATABASE}`);
  
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'smt_stencil',
    entities: [Stencil, Plate],
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
    const plateRepo = dataSource.getRepository(Plate);
    
    // ============================================
    // 1. SEED DE STENCILS (35 registers)
    // ============================================
    console.log('\n📦 Generate 35 Stencils...');
    let stencilsInserted = 0;
    let stencilsSkipped = 0;
    
    for (let i = 1; i <= 35; i++) {
      const stencilData = generateStencilData(i);
      const stencilCode = stencilData.stencilCode!;
      
      const exists = await stencilExists(dataSource, stencilCode);
      
      if (!exists) {
        const stencil = stencilRepo.create(stencilData);
        await stencilRepo.save(stencil);
        stencilsInserted++;
      } else {
        stencilsSkipped++;
      }
      
      if (i % 10 === 0) {
        console.log(`   ✅ Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing`);
      }
    }
    
    console.log(`   ✅ Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing`);
    
    // ============================================
    // 2. SEED DE PLATES (35 registers)
    // ============================================
    console.log('\n📦 Generate 35 Plates...');
    let platesInserted = 0;
    let platesSkipped = 0;
    
    for (let i = 1; i <= 35; i++) {
      const plateData = generatePlateData(i);
      const serialNumber = plateData.serialNumber!;
      
      const exists = await plateExists(dataSource, serialNumber);
      
      if (!exists) {
        const plate = plateRepo.create(plateData);
        await plateRepo.save(plate);
        platesInserted++;
      } else {
        platesSkipped++;
      }
      
      if (i % 10 === 0) {
        console.log(`   ✅ Plates: ${platesInserted} inserted, ${platesSkipped} existing`);
      }
    }
    
    console.log(`   ✅ Plates: ${platesInserted} inserted, ${platesSkipped} existing`);
    
    // ============================================
    // 3. FINAL VERIFICATION
    // ============================================
    const totalStencils = await stencilRepo.count();
    const totalPlates = await plateRepo.count();
    
    console.log('\n📊 SEED RESUME:');
    console.log(`   Stencils: ${stencilsInserted} inserted, ${stencilsSkipped} existing.`);
    console.log(`   Plates: ${platesInserted} inserted, ${platesSkipped} existing.`);
    console.log(`   New registers total: ${stencilsInserted + platesInserted}`);
    
    console.log('\n📈 DATABASE TOTAL:');
    console.log(`   Stencils: ${totalStencils}`);
    console.log(`   Plates: ${totalPlates}`);
    
    // Amostra dos dados inseridos
    if (stencilsInserted > 0) {
      const lastStencils = await stencilRepo.find({ take: 3, order: { createdAt: 'DESC' } });
      console.log('\n🔍 Last stencils inserted:');
      lastStencils.forEach(s => {
        console.log(`   - ${s.stencilCode} | ${s.operator} | ${s.createdAt.toLocaleString()}`);
      });
    }
    
    if (platesInserted > 0) {
      const lastPlates = await plateRepo.find({ take: 3, order: { createdAt: 'DESC' } });
      console.log('\n🔍 Latest plates inserted:');
      lastPlates.forEach(p => {
        console.log(`   - ${p.serialNumber} | ${p.operator} | ${p.createdAt.toLocaleString()}`);
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