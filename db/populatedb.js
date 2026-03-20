const { Client } = require("pg");

const SQL = `
-- 1. Categories Table (The foundation)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('product', 'ingredient'))
);

-- 2. Suppliers Table (Source for ingredients)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT
);

-- 3. Products Table (Finished goods for sale)
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

-- 4. Ingredients Table (Raw materials to be reordered)
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL CHECK (cost_per_unit >= 0),
  quantity_on_hand DECIMAL(10, 2) DEFAULT 0 CHECK (quantity_on_hand >= 0),
  unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'lbs', 'liters'
  reorder_level DECIMAL(10, 2) DEFAULT 10.0
);

-- 5. Transactions Table
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

-- 6. Trigger Function for Auto-Inventory Updates
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a Product transaction
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products 
        SET quantity_on_hand = quantity_on_hand + NEW.quantity 
        WHERE id = NEW.product_id;
    END IF;

    -- If it's an Ingredient transaction
    IF NEW.ingredient_id IS NOT NULL THEN
        UPDATE ingredients 
        SET quantity_on_hand = quantity_on_hand + NEW.quantity 
        WHERE id = NEW.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. The Trigger
DROP TRIGGER IF EXISTS after_transaction_insert ON transactions;
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION update_stock_level();

-- 8. Seed Initial Data
INSERT INTO categories (name, description, category_type) VALUES 
('Bread', 'Freshly baked loaves', 'product'),
('Bulk Goods', 'Raw baking materials', 'ingredient')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES 
('Grain Co', 'John Miller, 'jmiller@grainco.com', '555-555-5555', '123 Grain Co Drive, Smalltown, Louisiana 11111'),
('Clark Farms', 'Paul Clark, 'pclark@clarkfarms.com', '444-444-4444', '123 Clark Farm Lane, Smalltown, Louisiana 11111')
ON CONFLICT (name) DO NOTHING;

-- Seed a Product (Starts at 0)
INSERT INTO products (name, category_id, price) VALUES 
('Sourdough Loaf', 1, 5.50),
('Pesto Loaf', 1, 7.50) 
ON CONFLICT (name) DO NOTHING;

-- Seed an Ingredient (Starts at 0)
INSERT INTO ingredients (name, category_id, supplier_id, cost_per_unit, unit) VALUES 
('Bread Flour', 2, 1, 0.80, 'kg'),
('Eggs', 2, 2, 2.89, 'dozen'),
('Milk', 2, 2, 3.29, 'gallon') 
ON CONFLICT (name) DO NOTHING;

-- 9. Seed Transactions (This will automatically update the quantities above!)
INSERT INTO transactions (ingredient_id, supplier_id, type, quantity, description)
VALUES (1, 1, 'restock', 100, 'Initial bulk bread flour delivery from Grain Co');

INSERT INTO transactions (ingredient_id, supplier_id, type, quantity, description) VALUES 
(
  (SELECT id FROM ingredients WHERE name = 'Eggs'),
  (SELECT id FROM suppliers WHERE name = 'Clark Farms'), 
  'restock', 5, 'Initial bulk delivery from Clark Farms'
),
(
  (SELECT id FROM ingredients WHERE name = 'Milk'),
  (SELECT id FROM suppliers WHERE name = 'Clark Farms'),
  2, 'restock', 10, 'Initial bulk delivery from Clark Farms'
);

INSERT INTO transactions (product_id, type, quantity, description) VALUES 
(
  (SELECT id FROM products WHERE name = 'Sourdough Loaf'), 'restock', 20, 'Morning bake'
),
(
  (SELECT id FROM products WHERE name = 'Pesto Loaf), 'restock', 20, 'Morning bake'
);

INSERT INTO transactions (product_id, type, quantity, description)
VALUES (1, 'sale', -5, 'Sold 5 loaves at morning market');
`;

async function main() {
  console.log("seeding...");
  const client = new Client({
    connectionString: "postgresql://<role_name>:<role_password>@localhost:5432/top_users",
  });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("done");
}

main();