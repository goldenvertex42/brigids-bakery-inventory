const pool = require("./pool");

async function insertTransaction(transaction) {
  const { 
    product_id, 
    ingredient_id, 
    supplier_id, 
    type, 
    quantity, 
    description 
  } = transaction;

  const query = `
    INSERT INTO transactions 
    (product_id, ingredient_id, supplier_id, type, quantity, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    product_id || null, 
    ingredient_id || null, 
    supplier_id || null, 
    type, 
    quantity, 
    description
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getAllTransactions() {
  const query = `
    SELECT 
      t.*, 
      p.name AS product_name, 
      i.name AS ingredient_name, 
      s.name AS supplier_name
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN ingredients i ON t.ingredient_id = i.id
    LEFT JOIN suppliers s ON t.supplier_id = s.id
    ORDER BY t.created_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getTransactionsBySupplier(supplierId) {
  const query = `
    SELECT t.*, i.name AS ingredient_name
    FROM transactions t
    JOIN ingredients i ON t.ingredient_id = i.id
    WHERE t.supplier_id = $1 AND t.type = 'restock'
    ORDER BY t.created_at DESC
    LIMIT 10;
  `;
  const { rows } = await pool.query(query, [supplierId]);
  return rows;
}



module.exports = {
  insertTransaction,
  getAllTransactions,
  getTransactionsBySupplier
};