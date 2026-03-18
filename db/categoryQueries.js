const pool = require("./pool");

async function getSidebarCategories() {
  const { rows } = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
  return rows;
}

async function getCategoryById(id) {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0];
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
  getProductCategories,
  getIngredientCategories
}