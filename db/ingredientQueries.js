const pool = require("./pool");

async function getAllIngredients() {
  const query = "SELECT id, name, quantity_on_hand, unit FROM ingredients ORDER BY name ASC;";
  const { rows } = await pool.query(query);
  return rows;
}

async function getIngredientsByCategory(categoryId) {
  const { rows } = await pool.query("SELECT * FROM ingredients WHERE category_id = $1", [categoryId]);
  return rows;
}

async function getIngredientById(id) {
  const { rows } = await pool.query("SELECT * FROM ingredients WHERE id = $1", [id]);
  return rows[0];
}

async function getIngredientsBySupplier(supplierId) {
  const query = `
    SELECT i.*, c.name AS category_name
    FROM ingredients i
    JOIN categories c ON i.category_id = c.id
    WHERE i.supplier_id = $1
    ORDER BY i.name ASC;
  `;
  const { rows } = await pool.query(query, [supplierId]);
  return rows;
}


async function insertIngredient(name, category_id, supplier_id, cost_per_unit, unit, reorder_level) {
  const query = `
    INSERT INTO ingredients (name, category_id, supplier_id, cost_per_unit, unit, reorder_level) 
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await pool.query(query, [name, category_id, supplier_id, cost_per_unit, unit, reorder_level]);
}

async function updateIngredient(id, name, category_id, supplier_id, cost_per_unit, unit, reorder_level) {
  const query = `
    UPDATE ingredients 
    SET name = $2, category_id = $3, supplier_id = $4, 
        cost_per_unit = $5, unit = $6, reorder_level = $7
    WHERE id = $1
  `;
  await pool.query(query, [id, name, category_id, supplier_id, cost_per_unit, unit, reorder_level]);
}

async function deleteIngredient(id) {
  await pool.query("DELETE FROM ingredients WHERE id = $1", [id]);
}

module.exports = {
  getAllIngredients,
  getIngredientsByCategory,
  getIngredientsBySupplier,
  getIngredientById,
  insertIngredient,
  updateIngredient,
  deleteIngredient
}