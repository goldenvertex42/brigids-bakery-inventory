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

-- 5. Seed Initial Categories (Optional but helpful)
INSERT INTO categories (name, description, category_type) VALUES 
('Bread', 'Freshly baked loaves', 'product'),
('Pastries', 'Sweet treats and croissants', 'product'),
('Bulk Goods', 'Raw baking materials', 'ingredient')
ON CONFLICT (name) DO NOTHING;
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