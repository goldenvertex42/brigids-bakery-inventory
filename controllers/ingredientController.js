const ingredientDb = require("../db/ingredientQueries");
const categoryDb = require("../db/categoryQueries");
const supplierDb = require("../db/supplierQueries");

const { body, validationResult } = require("express-validator");

const validateIngredient = [
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ max: 255 }).withMessage("Name must be under 255 characters."),
  body("supplier_id").isInt({ min: 0 }).withMessage("Supplier ID number must be 0 or higher."),
  body("cost_per_unit").isFloat({ min: 0 }).withMessage("Cost must be a positive number."),
  body("quantity_on_hand").isInt({ min: 0 }).withMessage("Stock cannot be negative."),
  body("reorder_level").isInt({ min: 0 }).withMessage("Reorder level must be 0 or higher."),
];

async function ingredientCreateGet(req, res) {
  const [categories, suppliers] = await Promise.all([
    categoryDb.getIngredientCategories(),
    supplierDb.getAllSuppliers()
  ]);
  res.render("ingredientForm", { title: "Add New Ingredient", categories, suppliers });
}

async function ingredientCreatePost(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [categories, suppliers] = await Promise.all([
      categoryDb.getIngredientCategories(),
      supplierDb.getAllSuppliers()
    ]);
    return res.render("ingredientForm", {
      title: "Error",
      categories,
      suppliers,
      formData: req.body,
      errors: errors.array()
    });
  }
  
  try {
    const { name, category_id, cost_per_unit, quantity_on_hand, unit, reorder_level } = req.body;
    const supplier_id = req.body.supplier_id === "" ? null : req.body.supplier_id;
    await ingredientDb.insertIngredient(name, category_id, supplier_id, cost_per_unit, quantity_on_hand, unit, reorder_level);
    res.redirect(`/categories/${category_id}`);
  } catch (err) {
    next(err);
  }
}

async function ingredientUpdateGet(req, res, next) {
  try {
    const ingredient = await ingredientDb.getIngredientById(req.params.id);
    const categories = await categoryDb.getIngredientCategories();
    const suppliers = await supplierDb.getAllSuppliers();

    if (!ingredient) return next(new Error("Ingredient not found"));

    res.render("ingredientForm", {
      title: "Edit Ingredient",
      ingredient,
      categories,
      suppliers
    })
  } catch (err) {
    next(err);
  }
}

async function ingredientUpdatePost(req, res, next) {
  const { admin_password, name, category_id, cost_per_unit, quantity_on_hand, unit, reorder_level } = req.body;
  const id = req.params.id;
  const supplier_id = req.body.supplier_id === "" ? null : req.body.supplier_id;

  const errors = validationResult(req);
  
  if (!errors.isEmpty() || admin_password !== process.env.ADMIN_PASSWORD) {
    try {
      const ingredient = await ingredientDb.getIngredientById(id);
      const categories = await categoryDb.getIngredientCategories();
      const suppliers = await supplierDb.getAllSuppliers();
      
      return res.render("ingredientForm", { 
        title: "Edit Ingredient", 
        ingredient: ingredient[0], 
        categories,
        suppliers,
        errors: errors.array(),
        passwordError: admin_password !== process.env.ADMIN_PASSWORD ? "Incorrect Admin Password" : null,
        formData: req.body
      });
    } catch (err) { return next(err); }
  }

  try {
    await ingredientDb.updateIngredient(id, name, category_id, supplier_id, cost_per_unit, quantity_on_hand, unit, reorder_level);
    res.redirect(`/categories/${category_id}`);
  } catch (err) { next(err); }
}

async function ingredientDeletePost(req, res, next) {
  const { admin_password } = req.body;
  const ingredientId = req.params.id;

  try {

    const ingredient = await ingredientDb.getIngredientById(ingredientId);

    const categoryId = ingredient.category_id;

    if (admin_password !== process.env.ADMIN_PASSWORD) {
      const categories = await categoryDb.getIngredientCategories();
      const suppliers = await supplierDb.getAllSuppliers();

      return res.render("ingredientForm", {
        title: "Edit Ingredient",
        ingredient: ingredient,
        categories,
        suppliers,
        error: "Incorrect password! Item was not deleted."
      });
    }

    await ingredientDb.deleteIngredient(ingredientId);

    res.redirect(`/categories/${categoryId}`);

  } catch (err) {
    next(err);
  }
}


module.exports = { 
  validateIngredient,
  ingredientCreateGet, 
  ingredientCreatePost,
  ingredientUpdateGet,
  ingredientUpdatePost,
  ingredientDeletePost
 };