const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

function initDatabase() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0.0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, sku, quantity, price, description)
      VALUES (@name, @category, @sku, @quantity, @price, @description)
    `);

    const products = [
      { name: 'Wireless Keyboard', category: 'Electronics', sku: 'ELEC-001', quantity: 45, price: 49.99, description: 'Compact wireless keyboard with long battery life' },
      { name: 'USB-C Hub', category: 'Electronics', sku: 'ELEC-002', quantity: 30, price: 34.99, description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader' },
      { name: 'Noise Cancelling Headphones', category: 'Electronics', sku: 'ELEC-003', quantity: 20, price: 129.99, description: 'Over-ear headphones with active noise cancellation' },
      { name: 'Laptop Stand', category: 'Office', sku: 'OFFC-001', quantity: 60, price: 29.99, description: 'Adjustable aluminum laptop stand for better ergonomics' },
      { name: 'Ergonomic Mouse', category: 'Electronics', sku: 'ELEC-004', quantity: 55, price: 39.99, description: 'Vertical ergonomic mouse to reduce wrist strain' },
      { name: 'Desk Organizer', category: 'Office', sku: 'OFFC-002', quantity: 80, price: 19.99, description: 'Multi-compartment bamboo desk organizer' },
      { name: 'Monitor Light Bar', category: 'Electronics', sku: 'ELEC-005', quantity: 25, price: 44.99, description: 'LED monitor light bar with adjustable color temperature' },
      { name: 'Mechanical Pencils Set', category: 'Stationery', sku: 'STAT-001', quantity: 120, price: 12.99, description: 'Pack of 6 mechanical pencils with extra lead refills' },
      { name: 'Sticky Notes Bulk Pack', category: 'Stationery', sku: 'STAT-002', quantity: 200, price: 8.99, description: 'Assorted color sticky notes, 12 pads included' },
      { name: 'Cable Management Kit', category: 'Electronics', sku: 'ELEC-006', quantity: 40, price: 15.99, description: 'Velcro cable ties and clips for organized cables' },
      { name: 'Standing Desk Mat', category: 'Office', sku: 'OFFC-003', quantity: 35, price: 54.99, description: 'Anti-fatigue mat for standing desks, ergonomic design' },
      { name: 'Blue Light Glasses', category: 'Accessories', sku: 'ACCSS-001', quantity: 70, price: 24.99, description: 'Blue light blocking glasses to reduce eye strain' },
      { name: 'Whiteboard Markers Set', category: 'Stationery', sku: 'STAT-003', quantity: 150, price: 9.99, description: 'Dry-erase markers in 8 colors with eraser' },
      { name: 'Webcam HD 1080p', category: 'Electronics', sku: 'ELEC-007', quantity: 18, price: 69.99, description: 'Full HD webcam with built-in microphone and auto-focus' },
      { name: 'Wireless Charger Pad', category: 'Electronics', sku: 'ELEC-008', quantity: 50, price: 22.99, description: '15W fast wireless charging pad, Qi compatible' },
      { name: 'File Cabinet', category: 'Furniture', sku: 'FURN-001', quantity: 10, price: 149.99, description: '3-drawer metal file cabinet with lock' },
      { name: 'Printer Paper A4', category: 'Stationery', sku: 'STAT-004', quantity: 500, price: 6.99, description: 'A4 80gsm premium printer paper, 500 sheets per ream' },
      { name: 'Bookshelf Organizer', category: 'Furniture', sku: 'FURN-002', quantity: 15, price: 89.99, description: '5-tier wooden bookshelf for home or office use' },
      { name: 'Name Badge Holders', category: 'Accessories', sku: 'ACCSS-002', quantity: 250, price: 4.99, description: 'Clear plastic name badge holders with lanyards, 50-pack' },
      { name: 'Desk Lamp LED', category: 'Electronics', sku: 'ELEC-009', quantity: 38, price: 32.99, description: 'Touch-control LED desk lamp with USB charging port' }
    ];

    const insertMany = db.transaction((products) => {
      for (const product of products) {
        insert.run(product);
      }
    });

    insertMany(products);
  }

  return db;
}

module.exports = { initDatabase };
