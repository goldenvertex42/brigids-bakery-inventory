const pool = require("./pool");

async function getIngredientsByCategory(categoryId) {
  const { rows } = await pool.query("SELECT * FROM ingredients WHERE category_id = $1", [categoryId]);
  return rows;
}

async function getIngredientById(id) {
  const { rows } = await pool.query("SELECT * FROM ingredients WHERE id = $1", [id]);
  return rows[0];
}

async function insertIngredient(name, category_id, supplier_id, cost_per_unit, quantity, unit, reorder_level) {
  const query = `
    INSERT INTO ingredients (name, category_id, supplier_id, cost_per_unit, quantity, unit, reorder_level) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  await pool.query(query, [name, category_id, supplier_id, cost_per_unit, quantity, unit, reorder_level]);
}

async function updateIngredient(id, name, category_id, supplier_id, cost_per_unit, quantity, unit, reorder_level) {
  const query = `
    UPDATE ingredients 
    SET name = $2, category_id = $3, supplier_id = $4, 
        cost_per_unit = $5, quantity_on_hand = $6, unit = $7, reorder_level = $8
    WHERE id = $1
  `;
  await pool.query(query, [id, name, category_id, supplier_id, cost_per_unit, quantity, unit, reorder_level]);
}

async function deleteIngredient(id) {
  await pool.query("DELETE FROM ingredients WHERE id = $1", [id]);
}

module.exports = {
  getIngredientsByCategory,
  getIngredientById,
  insertIngredient,
  updateIngredient,
  deleteIngredient
}