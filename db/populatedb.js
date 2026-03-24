const { Client } = require("pg");

// 1. All Tables
const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('product', 'ingredient'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  is_active BOOLEAN DEFAULT true,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
  unit VARCHAR(50) DEFAULT 'piece',
  remake_level INTEGER DEFAULT 5,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL CHECK (cost_per_unit >= 0),
  quantity_on_hand DECIMAL(10, 2) DEFAULT 0 CHECK (quantity_on_hand >= 0),
  unit VARCHAR(50) NOT NULL,
  reorder_level DECIMAL(10, 2) DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'restock', 'waste', 'adjustment')),
  quantity DECIMAL NOT NULL, 
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// 2. Trigger Logic (Kept separate so semicolons don't conflict)
const TRIGGERS = `
-- 1. Create the Logic Function
  CREATE OR REPLACE FUNCTION handle_transaction_logic()
  RETURNS TRIGGER AS $$
  BEGIN
      -- If it's an Ingredient transaction and supplier_id is missing, auto-fill it
      IF NEW.ingredient_id IS NOT NULL AND NEW.supplier_id IS NULL THEN
          SELECT supplier_id INTO NEW.supplier_id 
          FROM ingredients 
          WHERE id = NEW.ingredient_id;
      END IF;

      -- Return the modified NEW row to be inserted
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- 2. Create the BEFORE INSERT Trigger for auto-filling data
  DROP TRIGGER IF EXISTS before_transaction_insert ON transactions;
  CREATE TRIGGER before_transaction_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION handle_transaction_logic();

  -- 3. Create the AFTER INSERT Trigger for updating stock levels
  CREATE OR REPLACE FUNCTION update_stock_level()
  RETURNS TRIGGER AS $$
  BEGIN
      IF NEW.product_id IS NOT NULL THEN
          UPDATE products SET quantity_on_hand = quantity_on_hand + NEW.quantity WHERE id = NEW.product_id;
      END IF;
      IF NEW.ingredient_id IS NOT NULL THEN
          UPDATE ingredients SET quantity_on_hand = quantity_on_hand + NEW.quantity WHERE id = NEW.ingredient_id;
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS after_transaction_insert ON transactions;
  CREATE TRIGGER after_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_stock_level();
`;

// 3. Initial Base Data
const SEED_BASE = `
INSERT INTO categories (name, description, category_type) VALUES 
('Bread', 'Freshly baked loaves', 'product'),
('Bulk Goods', 'Raw baking materials', 'ingredient')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES 
('Grain Co', 'John Miller', 'jmiller@grainco.com', '555-555-5555', '123 Grain Co Drive, Smalltown, LA'),
('Clark Farms', 'Paul Clark', 'pclark@clarkfarms.com', '444-444-4444', '123 Clark Farm Lane, Smalltown, LA')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, category_id, price) VALUES 
('Sourdough Loaf', (SELECT id FROM categories WHERE name = 'Bread'), 5.50),
('Pesto Loaf', (SELECT id FROM categories WHERE name = 'Bread'), 7.50)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category_id, supplier_id, cost_per_unit, unit) VALUES 
('Bread Flour', (SELECT id FROM categories WHERE name = 'Bulk Goods'), (SELECT id FROM suppliers WHERE name = 'Grain Co'), 0.80, 'kg'),
('Eggs', (SELECT id FROM categories WHERE name = 'Bulk Goods'), (SELECT id FROM suppliers WHERE name = 'Clark Farms'), 2.89, 'dozen'),
('Milk', (SELECT id FROM categories WHERE name = 'Bulk Goods'), (SELECT id FROM suppliers WHERE name = 'Clark Farms'), 3.29, 'gallon')
ON CONFLICT (name) DO NOTHING;
`;

// 4. Initial Transactions
const SEED_TRANSACTIONS = `
INSERT INTO transactions (ingredient_id, supplier_id, type, quantity, description) VALUES 
((SELECT id FROM ingredients WHERE name = 'Bread Flour'), (SELECT id FROM suppliers WHERE name = 'Grain Co'), 'restock', 100, 'Initial delivery from Grain Co'),
((SELECT id FROM ingredients WHERE name = 'Eggs'), (SELECT id FROM suppliers WHERE name = 'Clark Farms'), 'restock', 5, 'Initial delivery from Clark Farms'),
((SELECT id FROM ingredients WHERE name = 'Milk'), (SELECT id FROM suppliers WHERE name = 'Clark Farms'), 'restock', 10, 'Initial delivery from Clark Farms');

INSERT INTO transactions (product_id, type, quantity, description) VALUES 
((SELECT id FROM products WHERE name = 'Sourdough Loaf'), 'restock', 20, 'Morning bake'),
((SELECT id FROM products WHERE name = 'Pesto Loaf'), 'restock', 20, 'Morning bake'),
((SELECT id FROM products WHERE name = 'Sourdough Loaf'), 'sale', -5, 'Sold at market');
`;

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL;
  const client = new Client({ connectionString: connectionString });
  await client.connect();
  const res = await client.query("SELECT current_database(), current_user, inet_server_addr(), inet_server_port();");
  console.log("Connected to:", res.rows[0]);
  const blocks = [
    { name: "Schema", sql: SCHEMA },
    { name: "Triggers", sql: TRIGGERS },
    { name: "Base Data", sql: SEED_BASE },
    { name: "Transactions", sql: SEED_TRANSACTIONS }
  ];

  try {
    console.log("Starting seed...");
    await client.query('BEGIN');

    for (const block of blocks) {
      console.log(`  Running block: ${block.name}...`);
      await client.query(block.sql);
    }

    await client.query('COMMIT');
    console.log("✅ Database populated successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error during seeding:");
    console.error(err.message);
  } finally {
    await client.end();
    console.log("Done.");
  }
}

main();
