const { body, validationResult } = require("express-validator");
const supplierDb = require("../db/supplierQueries");

const validateSupplier = [
  body("name").trim().notEmpty().withMessage("Supplier name is required."),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email format."),
  body("phone").optional({ checkFalsy: true }).isMobilePhone().withMessage("Invalid phone number."),
];

async function supplierListGet(req, res) {
  const suppliers = await supplierDb.getAllSuppliers();
  res.render("supplierList", { title: "All Suppliers", suppliers });
}

async function supplierCreateGet(req, res) {
  res.render("supplierForm", { title: "Add New Supplier" });
}

async function supplierCreatePost(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("supplierForm", { title: "Add New Supplier", errors: errors.array(), formData: req.body });
  }
  try {
    const { name, contact_name, email, phone, address } = req.body;
    await supplierDb.insertSupplier(name, contact_name, email, phone, address);
    res.redirect("/suppliers");
  } catch (err) { next(err); }
}

async function supplierUpdateGet(req, res, next) {
  try {
    const supplier = await supplierDb.getSupplierById(req.params.id);

    if (!supplier) return next(new Error("Supplier not found"));

    res.render("supplierForm", {
      title: "Edit Supplier",
      supplier
    })
  } catch (err) {
    next(err);
  }
}

async function supplierUpdatePost(req, res, next) {
  const { name, contact_name, email, phone, address } = req.body;
  const id = req.params.id;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    try {
      const supplier = await supplierDb.getSupplierById(id);
      
      return res.render("supplierForm", { 
        title: "Edit Supplier", 
        supplier: supplier, 
        errors: errors.array(),
        formData: req.body
      });
    } catch (err) { return next(err); }
  }

  try {
    await supplierDb.updateSupplier(id, name, contact_name, email, phone, address);
    res.redirect(`/suppliers`);
  } catch (err) { next(err); }
}

module.exports = {
    validateSupplier,
    supplierListGet,
    supplierCreateGet,
    supplierCreatePost,
    supplierUpdateGet,
    supplierUpdatePost
}
