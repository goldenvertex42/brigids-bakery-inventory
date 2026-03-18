const pool = require("./pool");

async function getSidebarCategories() {
  const { rows } = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
  return rows;
}

async function getCategoryById(id) {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0];
}

async function insertCategory(name, description, category_type) {
  const query = `
    INSERT INTO categories (name, description, category_type) 
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  const result = await pool.query(query, [name, description, category_type]);
  return result.rows[0].id;
}

async function updateCategory(id, name, description, category_type) {
  const query = `
    UPDATE categories 
    SET name = $2, description = $3, category_type = $4
    WHERE id = $1
  `;
  await pool.query(query, [id, name, description, category_type]);
}

async function deleteCategory(id) {
  await pool.query("DELETE FROM categories WHERE id = $1", [id]);
}

async function getProductCategories() {
    const { rows } = await pool.query("SELECT * FROM categories WHERE category_type = 'product' ORDER BY name ASC");
    return rows;
}
async function getIngredientCategories() {
    const { rows } = await pool.query("SELECT * FROM categories WHERE category_type = 'ingredient' ORDER BY name ASC");
    return rows;
}

module.exports = {
  getSidebarCategories,
  getCategoryById,
  insertCategory,
  updateCategory,
  deleteCategory,
  getProductCategories,
  getIngredientCategories
}