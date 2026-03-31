const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const db = initDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);

// GET all products (with optional search/category filter)
app.get('/api/products', (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (search || category) {
      const conditions = [];
      if (search) {
        conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term);
      }
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET a single product by id
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(`GET /api/products/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// GET all unique categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all();
    res.json(categories.map(c => c.category));
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// POST create a new product
app.post('/api/products', (req, res) => {
  try {
    const { name, category, sku, quantity, price, description } = req.body;

    if (!name || !category || !sku) {
      return res.status(400).json({ error: 'Name, category and SKU are required' });
    }
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const result = db.prepare(`
      INSERT INTO products (name, category, sku, quantity, price, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), category.trim(), sku.trim().toUpperCase(), Number(quantity), Number(price), description ? description.trim() : '');

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update a product
app.put('/api/products/:id', (req, res) => {
  try {
    const { name, category, sku, quantity, price, description } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!name || !category || !sku) {
      return res.status(400).json({ error: 'Name, category and SKU are required' });
    }
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, sku = ?, quantity = ?, price = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name.trim(), category.trim(), sku.trim().toUpperCase(), Number(quantity), Number(price), description ? description.trim() : '', id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    console.error(`PUT /api/products/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH update only quantity
app.patch('/api/products/:id/quantity', (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity === undefined || Number(quantity) < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }

    db.prepare(`
      UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(Number(quantity), id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error(`PATCH /api/products/${req.params.id}/quantity error:`, err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// DELETE a product
app.delete('/api/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(`DELETE /api/products/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(PORT, () => {
  console.log(`Inventory app running at http://localhost:${PORT}`);
});

module.exports = app;
