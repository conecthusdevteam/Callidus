const sql = require('mssql');
const { spawn } = require('child_process');

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: 30000,
};

async function waitForDatabase() {
  console.log('⏳ Waiting for SQL Server...');
  
  for (let i = 1; i <= 30; i++) {
    try {
      const pool = await sql.connect(config);
      await pool.request().query('SELECT 1');
      await pool.close();
      console.log('✅ SQL Server is ready!');
      
      const dbName = process.env.DB_DATABASE;
      const masterPool = await sql.connect({ ...config, database: 'master' });
      await masterPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
        CREATE DATABASE [${dbName}]
      `);
      await masterPool.close();
      console.log(`✅ Database '${dbName}' ready!`);
      
      console.log('🚀 Starting NestJS application...');
      
      const app = spawn('node', ['dist/main'], { 
        stdio: 'inherit'
      });
      
      app.on('close', (code) => {
        process.exit(code);
      });
      
      return;
    } catch (err) {
      console.log(`Attempt ${i}/30: ${err.message.substring(0, 60)}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.error('❌ Timeout waiting for SQL Server');
  process.exit(1);
}

waitForDatabase();