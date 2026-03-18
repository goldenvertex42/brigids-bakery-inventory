const { body, validationResult } = require("express-validator");
const supplierDb = require("../db/supplierQueries");

const validateSupplier = [
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ max: 255 }).withMessage("Name must be under 255 characters."),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email format."),
  body("phone").optional({ checkFalsy: true }).isMobilePhone().withMessage("Invalid phone number."),
];

async function supplierListGet(req, res) {
  const suppliers = await supplierDb.getAllSuppliers();
  res.render("supplierList", { title: "All Suppliers", suppliers });
}

async function supplierDetailGet(req, res) {
  const id = req.params.id;
  try {
    const supplier = await supplierDb.getSupplierById(id);
    res.render("supplierDetails", {
      title: supplier.name + "Details",
      supplier
    });
  } catch (err) {
    next(err);
  }
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
      title: "Update Supplier",
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
        title: "Update Supplier", 
        supplier: supplier, 
        errors: errors.array(),
        formData: req.body
      });
    } catch (err) { next(err); }
  }

  try {
    await supplierDb.updateSupplier(id, name, contact_name, email, phone, address);
    res.redirect(`/suppliers`);
  } catch (err) { next(err); }
}

async function supplierDeletePost(req, res, next) {
  const { admin_password } = req.body;
  const supplierId = req.params.id;

  try {
    const supplier = supplierDb.getSupplierById(supplierId);


    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.render("supplierForm", {
        title: "Update Supplier",
        supplier: supplier,
        error: "Incorrect password! Supplier was not deleted."
      });
    }

    await supplierDb.deleteSupplier(supplierId);

    res.redirect(`/suppliers`);

  } catch (err) {
    next(err);
  }
}

module.exports = {
    validateSupplier,
    supplierListGet,
    supplierDetailGet,
    supplierCreateGet,
    supplierCreatePost,
    supplierUpdateGet,
    supplierUpdatePost,
    supplierDeletePost
}
