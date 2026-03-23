const pool = require("./pool");

async function getActiveSuppliers() {
  const query = "SELECT * FROM suppliers WHERE is_active = true ORDER BY name ASC";
  const { rows } = await pool.query(query);
  return rows;
}

async function getSupplierById(id) {
  const { rows } = await pool.query("SELECT * FROM suppliers WHERE id = $1", [id]);
  return rows[0];
}

async function insertSupplier(name, contact_name, email, phone, address) {
  const query = `
    INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5)
  `;
  
  await pool.query(query, [name, contact_name, email, phone, address]);
}

async function updateSupplier(id, name, contact_name, email, phone, address) {
  await pool.query(
    "UPDATE suppliers SET name=$2, contact_name=$3, email=$4, phone=$5, address=$6 WHERE id=$1",
    [id, name, contact_name, email, phone, address]
  );
}

async function updateActiveStatus(id, status) {
  const query = `
    UPDATE suppliers 
    SET is_active = $1 
    WHERE id = $2 
    RETURNING *;
  `;
  
  const values = [status, id];

  try {
    const { rows } = await pool.query(query, values);
    return rows[0]; // Returns the updated supplier record
  } catch (err) {
    throw err;
  }
}

module.exports = {
    getActiveSuppliers,
    getSupplierById,
    insertSupplier,
    updateSupplier,
    updateActiveStatus
}