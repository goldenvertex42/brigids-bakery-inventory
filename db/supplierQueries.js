const pool = require("./pool");

async function getAllSuppliers() {
  const { rows } = await pool.query("SELECT * FROM suppliers ORDER BY name ASC");
  return rows;
}

async function getSupplierById(id) {
  const { rows } = await pool.query("SELECT * FROM suppliers WHERE id = $1", [id]);
  return rows[0];
}

async function insertSupplier(name, contact_name, email, phone, address) {
  await pool.query(
    "INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5)",
    [name, contact_name, email, phone, address]
  );
}

async function updateSupplier(id, name, contact_name, email, phone, address) {
  await pool.query(
    "UPDATE suppliers SET name=$2, contact_name=$3, email=$4, phone=$5, address=$6 WHERE id=$1",
    [id, name, contact_name, email, phone, address]
  );
}

async function deleteSupplier(id) {
  // Remember: our schema has ON DELETE SET NULL for ingredients
  await pool.query("DELETE FROM suppliers WHERE id = $1", [id]);
}

module.exports = {
    getAllSuppliers,
    getSupplierById,
    insertSupplier,
    updateSupplier,
    deleteSupplier,
}