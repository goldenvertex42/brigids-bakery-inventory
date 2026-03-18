const pool = require("./pool");

async function getProductsByCategory(categoryId) {
  const { rows } = await pool.query("SELECT * FROM products WHERE category_id = $1", [categoryId]);
  return rows;
}

async function getProductById(id) {
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  return rows[0];
}

async function insertProduct(name, description, category_id, price, quantity, unit, remake_level, image_url) {
  const query = `
    INSERT INTO products (name, description, category_id, price, unit, quantity_on_hand, remake_level, image_url) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  await pool.query(query, [name, description, category_id, price, quantity, unit, remake_level, image_url]);
}

async function updateProduct(id, name, description, category_id, price, quantity, unit, remake_level, image_url) {
  const query = `
    UPDATE products 
    SET name = $2, description = $3, category_id = $4, price = $5, 
        quantity_on_hand = $6, unit = $7, remake_level = $8, image_url = $9
    WHERE id = $1
  `;
  await pool.query(query, [id, name, description, category_id, price, quantity, unit, remake_level, image_url]);
}

async function deleteProduct(id) {
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
}

module.exports = {
  getProductsByCategory,
  getProductById,
  insertProduct,
  updateProduct,
  deleteProduct
}