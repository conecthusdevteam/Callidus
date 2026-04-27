// seeds/seed-stencils-plates-sqlite.ts
import { DataSource } from 'typeorm';
import { Stencil, WashStatus } from '../../stencils/entities/stencil.entity';
import { Plate } from '../../plates/entities/plate.entity';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, '../../..', 'db.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
  const date = new Date(now);
  
  date.setHours(0, 0, 0, 0);

  const hoursAgo = random(0, 23);
  const minutesAgo = random(0, 59);
  const secondsAgo = random(0, 59);
  
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
  
  const plate = new Plate();
  plate.plateModel = plateModel;
  plate.serialNumber = serialNumber;
  plate.blankId = blankId;
  plate.shift = shift;
  plate.phase = phase;
  plate.totalWashes = totalWashes;
  plate.operator = operator;
  plate.lineName = lineName;
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
  console.log('🚀 Iniciando seed de Stencils e Plates (SQLite)...');
  console.log(`📁 Banco de dados: ${DB_PATH}`);
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: DB_PATH,
    entities: [Stencil, Plate],
    synchronize: true,
    logging: false, 
  });
  
  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao SQLite');
    
    const stencilRepo = dataSource.getRepository(Stencil);
    const plateRepo = dataSource.getRepository(Plate);
    
    // ============================================
    // 1. SEED DE STENCILS (120 registros)
    // ============================================
    console.log('\n📦 Gerando 120 Stencils...');
    let stencilsInserted = 0;
    let stencilsSkipped = 0;
    
    await dataSource.transaction(async (transactionalEntityManager) => {
      for (let i = 1; i <= 120; i++) {
        const stencilData = generateStencilData(i);
        const stencilCode = stencilData.stencilCode!;
        
        const exists = await stencilExists(dataSource, stencilCode);
        
        if (!exists) {
          const stencil = transactionalEntityManager.create(Stencil, stencilData);
          await transactionalEntityManager.save(stencil);
          stencilsInserted++;
        } else {
          stencilsSkipped++;
        }
        
        if (i % 10 === 0) {
          process.stdout.write(`\r   ✅ Stencils: ${stencilsInserted} inseridos, ${stencilsSkipped} existentes`);
        }
      }
    });
    
    console.log(`\r   ✅ Stencils: ${stencilsInserted} inseridos, ${stencilsSkipped} existentes`);
    
    // ============================================
    // 2. SEED DE PLATES (120 registros)
    // ============================================
    console.log('\n📦 Gerando 120 Plates...');
    let platesInserted = 0;
    let platesSkipped = 0;
    
    await dataSource.transaction(async (transactionalEntityManager) => {
      for (let i = 1; i <= 120; i++) {
        const plateData = generatePlateData(i);
        const serialNumber = plateData.serialNumber!;
        
        const exists = await plateExists(dataSource, serialNumber);
        
        if (!exists) {
          const plate = transactionalEntityManager.create(Plate, plateData);
          await transactionalEntityManager.save(plate);
          platesInserted++;
        } else {
          platesSkipped++;
        }
        
        if (i % 10 === 0) {
          process.stdout.write(`\r   ✅ Plates: ${platesInserted} inseridos, ${platesSkipped} existentes`);
        }
      }
    });
    
    console.log(`\r   ✅ Plates: ${platesInserted} inseridos, ${platesSkipped} existentes`);
    
    // ============================================
    // 3. VERIFICAÇÃO FINAL
    // ============================================
    const totalStencils = await stencilRepo.count();
    const totalPlates = await plateRepo.count();
    
    console.log('\n📊 RESUMO DO SEED:');
    console.log(`   Stencils: ${stencilsInserted} inseridos, ${stencilsSkipped} já existentes`);
    console.log(`   Plates: ${platesInserted} inseridos, ${platesSkipped} já existentes`);
    console.log(`   Total de novos registros: ${stencilsInserted + platesInserted}`);
    
    console.log('\n📈 TOTAL NO BANCO (SQLite):');
    console.log(`   Stencils: ${totalStencils}`);
    console.log(`   Plates: ${totalPlates}`);
    console.log(`   Banco: ${DB_PATH}`);
    
    // Amostra dos dados inseridos
    if (stencilsInserted > 0) {
      const lastStencils = await stencilRepo.find({ take: 3, order: { createdAt: 'DESC' } });
      console.log('\n🔍 Últimos stencils inseridos:');
      lastStencils.forEach(s => {
        console.log(`   - ${s.stencilCode} | ${s.operator} | ${s.createdAt.toLocaleString()}`);
      });
    }
    
    if (platesInserted > 0) {
      const lastPlates = await plateRepo.find({ take: 3, order: { createdAt: 'DESC' } });
      console.log('\n🔍 Últimas plates inseridas:');
      lastPlates.forEach(p => {
        console.log(`   - ${p.serialNumber} | ${p.operator} | ${p.createdAt.toLocaleString()}`);
      });
    }
    
    console.log('\n✅ Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
    if (error instanceof Error) {
        console.error('Detalhe:', error.message);
    } else if (typeof error === 'string') {
        console.error('Detalhe:', error);
    } else {
        console.error('Detalhe: Erro desconhecido');
    }
  } finally {
    await dataSource.destroy();
    console.log('🔌 Conexão com SQLite finalizada');
  }
}

runSeed();