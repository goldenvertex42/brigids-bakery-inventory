const pool = require("./pool");

async function getCategoriesWithLowStockItems() {
  const query = `
    SELECT DISTINCT category_id FROM (
      SELECT category_id FROM products WHERE quantity_on_hand <= remake_level
      UNION ALL
      SELECT category_id FROM ingredients WHERE quantity_on_hand <= reorder_level
    ) AS alerts
  `;
  const { rows } = await pool.query(query);
  // Return an array of IDs: [1, 3, 5]
  return rows.map(row => row.category_id);
}

module.exports = {
  getCategoriesWithLowStockItems
}