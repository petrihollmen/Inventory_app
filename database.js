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
      { name: 'Beneteau Oceanis 46.1', category: 'Boats', sku: 'BOAT-001', quantity: 4, price: 189900.00, description: '46 ft cruising yacht with 3-cabin layout, furling mainsail and bow thruster. Ideal for blue-water passages.' },
      { name: 'Jeanneau Sun Odyssey 49', category: 'Boats', sku: 'BOAT-002', quantity: 3, price: 229500.00, description: '49 ft performance cruiser with twin-wheel steering, lifting keel option and spacious cockpit.' },
      { name: 'Bavaria C50', category: 'Boats', sku: 'BOAT-003', quantity: 2, price: 259000.00, description: '50 ft luxury cruising yacht offering 5 cabins, carbon rig and premium Lewmar deck hardware.' },
      { name: 'Hallberg-Rassy 48 MkII', category: 'Boats', sku: 'BOAT-004', quantity: 2, price: 495000.00, description: '48 ft Swedish-built offshore cruiser renowned for seaworthiness, quality finish and centre-cockpit design.' },
      { name: 'Mainsail – Standard', category: 'Sails', sku: 'SAIL-001', quantity: 15, price: 1299.00, description: 'Dacron mainsail suitable for cruising boats up to 35 ft.' },
      { name: 'Furling Genoa Jib', category: 'Sails', sku: 'SAIL-002', quantity: 10, price: 899.00, description: 'High-performance furling jib with UV-resistant leech tape.' },
      { name: 'Asymmetric Spinnaker', category: 'Sails', sku: 'SAIL-003', quantity: 7, price: 1699.00, description: 'Nylon asymmetric spinnaker for downwind speed. Vibrant colour options.' },
      { name: 'Storm Jib', category: 'Sails', sku: 'SAIL-004', quantity: 9, price: 549.00, description: 'Heavy-weather storm jib, ISO 9650 compliant. 4 oz laminate cloth.' },
      { name: 'Standing Rigging Set', category: 'Rigging', sku: 'RIG-001', quantity: 5, price: 1150.00, description: 'Full stainless steel standing rigging set for 30–35 ft keelboats.' },
      { name: 'Running Rigging Kit', category: 'Rigging', sku: 'RIG-002', quantity: 11, price: 499.00, description: 'Complete running rigging kit with halyards, sheets and control lines.' },
      { name: 'Stainless Shackles Pack', category: 'Rigging', sku: 'RIG-003', quantity: 60, price: 34.99, description: 'Marine-grade stainless steel snap shackles, pack of 10.' },
      { name: 'Roller Furling System', category: 'Rigging', sku: 'RIG-004', quantity: 8, price: 679.00, description: 'Aluminium foil roller furling system, fits forestays up to 15 m.' },
      { name: 'Adult Life Jacket (ISO)', category: 'Safety', sku: 'SAFE-001', quantity: 40, price: 129.99, description: '150 N ISO 12402-3 approved inflatable life jacket. Auto/manual inflate.' },
      { name: 'Child Life Jacket', category: 'Safety', sku: 'SAFE-002', quantity: 25, price: 79.99, description: 'Buoyancy aid for children 15–30 kg. CE certified, bright orange.' },
      { name: 'Safety Harness & Tether', category: 'Safety', sku: 'SAFE-003', quantity: 18, price: 89.99, description: 'Offshore safety harness with 2 m double-clip tether. EN ISO 12401.' },
      { name: 'Marine VHF Radio', category: 'Navigation', sku: 'NAV-001', quantity: 14, price: 219.00, description: 'Waterproof floating VHF radio, 6 W output, DSC channel 70.' },
      { name: 'GPS Chart Plotter', category: 'Navigation', sku: 'NAV-002', quantity: 6, price: 849.00, description: '7-inch touchscreen GPS chart plotter with pre-loaded coastal charts.' },
      { name: 'Marine Compass', category: 'Navigation', sku: 'NAV-003', quantity: 20, price: 149.00, description: 'Flush-mount binnacle compass, compensated, high-visibility card.' },
      { name: 'Antifouling Paint (5 L)', category: 'Maintenance', sku: 'MAINT-001', quantity: 30, price: 89.99, description: 'Self-polishing copper antifouling paint for GRP and steel hulls.' },
      { name: 'Boat Fender Set', category: 'Accessories', sku: 'ACC-001', quantity: 35, price: 59.99, description: 'Set of 4 inflatable PVC fenders with adjustable mooring lines.' }
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
