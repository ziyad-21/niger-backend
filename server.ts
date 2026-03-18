import express from 'express';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// File upload setup for database restore
const upload = multer({ dest: 'uploads/' });

// SQLite Connection
let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDb() {
  try {
    db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
    console.log('Connected to SQLite database');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        nameAr TEXT NOT NULL,
        nameFr TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        maxQuantity REAL DEFAULT 0,
        unit TEXT,
        price REAL DEFAULT 0,
        minLevel REAL DEFAULT 0,
        lastUpdated TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        nameAr TEXT NOT NULL,
        nameFr TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        maxQuantity REAL DEFAULT 0,
        unit TEXT,
        minLevel REAL DEFAULT 0,
        supplier TEXT,
        price REAL DEFAULT 0,
        lastUpdated TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customerName TEXT,
        customerId TEXT,
        date TEXT,
        status TEXT,
        totalAmount REAL,
        items TEXT,
        expectedDeliveryDate TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        roleAr TEXT,
        roleFr TEXT,
        salary REAL DEFAULT 0,
        lastPaymentDate TEXT,
        advanceTaken REAL DEFAULT 0,
        password TEXT,
        allowedEntity TEXT,
        loginCount INTEGER DEFAULT 0,
        loginHistory TEXT
      )
    `);

    // Add default admin user if not exists
    const existingStaff = await db.all('SELECT * FROM staff WHERE id = ?', ['admin-1']);
    console.log(`Checking for admin user... Found: ${existingStaff.length}`);
    if (existingStaff.length === 0) {
      await db.run(`
        INSERT INTO staff (id, name, roleAr, roleFr, salary, password, allowedEntity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin-1', 'زياد سليمان', 'مدير النظام', 'Admin', 0, '123', 'MASTER']);
      console.log('Default admin user created successfully');
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        type TEXT,
        category TEXT,
        description TEXT,
        amount REAL,
        date TEXT,
        entityId TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS gold_transactions (
        id TEXT PRIMARY KEY,
        date TEXT,
        description TEXT,
        amountRiyal REAL,
        goldWeight REAL,
        karat REAL,
        exchangeRate REAL,
        type TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT,
        time TEXT,
        location TEXT,
        notes TEXT,
        tasks TEXT,
        isFinished INTEGER DEFAULT 0,
        summary TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS farm_data (
        id TEXT PRIMARY KEY,
        type TEXT,
        date TEXT,
        item TEXT,
        quantity REAL,
        unit TEXT,
        unitPrice REAL,
        totalPrice REAL,
        notes TEXT,
        season TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS bank_partners (
        id TEXT PRIMARY KEY,
        partner_name TEXT,
        capital_amount REAL,
        deposit_date TEXT,
        withdrawals REAL,
        notes TEXT
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// API Endpoints
const entities = [
  'customers', 'products', 'materials', 'orders', 'staff', 
  'expenses', 'gold_transactions', 'appointments', 'farm_data', 'bank_partners'
];

// Database Management Endpoints
app.get('/api/database/stats', async (req, res) => {
  try {
    const stats: Record<string, number> = {};
    for (const entity of entities) {
      const result = await db.get(`SELECT COUNT(*) as count FROM ${entity}`);
      stats[entity] = result.count;
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/database/backup', (req, res) => {
  const file = path.join(__dirname, 'database.sqlite');
  res.download(file, `backup_${new Date().toISOString().split('T')[0]}.sqlite`);
});

app.post('/api/database/restore', upload.single('database'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    // Close existing connection
    await db.close();
    
    // Replace database file
    const dbPath = path.join(__dirname, 'database.sqlite');
    fs.copyFileSync(req.file.path, dbPath);
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    
    // Reinitialize connection
    await initDb();
    
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

entities.forEach(entity => {
  // GET all
  app.get(`/api/${entity}`, async (req, res) => {
    try {
      const rows = await db.all(`SELECT * FROM ${entity}`);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST (Upsert)
  app.post(`/api/${entity}`, async (req, res) => {
    try {
      const data = req.body;
      const keys = Object.keys(data);
      const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
      
      const placeholders = keys.map(() => '?').join(', ');
      const updates = keys.map(k => `${k} = excluded.${k}`).join(', ');

      const sql = `INSERT INTO ${entity} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
      await db.run(sql, values);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // DELETE
  app.delete(`/api/${entity}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.run(`DELETE FROM ${entity} WHERE id = ?`, [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
});

// Special endpoint for bulk save (e.g. when setting state)
app.post('/api/bulk/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });

    await db.exec('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const keys = Object.keys(item);
        const values = Object.values(item).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
        const placeholders = keys.map(() => '?').join(', ');
        const updates = keys.map(k => `${k} = excluded.${k}`).join(', ');
        const sql = `INSERT INTO ${entity} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
        await db.run(sql, values);
      }
      await db.exec('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
