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

async function getProductsWithLowStock() {
  const query = `
    SELECT 
    id, 
    name, 
    quantity_on_hand, 
    remake_level
    FROM products 
    WHERE quantity_on_hand <= remake_level;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getIngredientsWithLowStock() {
  const query = `
    SELECT 
    id, 
    name, 
    quantity_on_hand, 
    reorder_level,
    supplier_id
    FROM ingredients 
    WHERE quantity_on_hand <= reorder_level;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getTopSellingProducts() {
  const query = `
    SELECT p.name, SUM(ABS(t.quantity)) as total_sold
    FROM transactions t
    JOIN products p ON t.product_id = p.id
    WHERE t.type = 'sale'
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getWasteReport() {
  const query = `
    SELECT 
      COALESCE(p.name, i.name) as item_name, 
      SUM(ABS(t.quantity)) as total_wasted
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN ingredients i ON t.ingredient_id = i.id
    WHERE t.type = 'waste'
    GROUP BY p.name, i.name
    ORDER BY total_wasted DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getSupplierPerformance() {
  const query = `
    SELECT 
      s.name, 
      COUNT(t.id) as total_deliveries, 
      SUM(t.quantity) as units_received
    FROM transactions t
    JOIN suppliers s ON t.supplier_id = s.id
    WHERE t.type = 'restock'
    GROUP BY s.id, s.name
    ORDER BY total_deliveries DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  getCategoriesWithLowStockItems,
  getProductsWithLowStock,
  getIngredientsWithLowStock,
  getTopSellingProducts,
  getWasteReport,
  getSupplierPerformance
}