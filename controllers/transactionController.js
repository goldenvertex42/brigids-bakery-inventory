const { body, validationResult } = require("express-validator");
const transactionDb = require("../db/transactionQueries");
const productDb = require("../db/productQueries");
const ingredientDb = require("../db/ingredientQueries");
const supplierDb = require("../db/supplierQueries");

const validateTransaction = [
  body("type")
    .isIn(['sale', 'restock', 'waste', 'adjustment'])
    .withMessage("Invalid transaction type"),
  
  body("quantity")
    .isNumeric()
    .notEmpty()
    .withMessage("Quantity must be a number"),

  // Optional IDs: Validates only if a value is actually sent
  body("product_id")
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage("Product ID must be an integer"),

  body("ingredient_id")
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage("Ingredient ID must be an integer"),

  body("supplier_id")
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage("Supplier ID must be an integer"),

  // Custom Logic: Ensure at least ONE item (Product or Ingredient) is selected
  body().custom((value, { req }) => {
    if (!req.body.product_id && !req.body.ingredient_id) {
      throw new Error("You must select either a Product or an Ingredient");
    }
    return true;
  }),
];

async function transactionCreateGet(req, res, next) {
  try {
    // Fetch all needed data in parallel
    const [products, ingredients, suppliers] = await Promise.all([
      productDb.getAllProducts(),
      ingredientDb.getAllIngredients(),
      supplierDb.getActiveSuppliers()
    ]);

    res.render("transactionForm", {
      title: "New Transaction",
      products,
      ingredients,
      suppliers,
      errors: [] // Initialize empty errors for your partial
    });
  } catch (err) {
    next(err);
  }
}

async function transactionCreatePost(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Re-render form with errors
    return res.render("transactionForm", {
      errors: errors.array(),
      formData: req.body
    });
  }
  
  try {
    // If 'sale', ensure quantity is negative; if 'restock', positive
    const formattedQuantity = (req.body.type === 'sale' || req.body.type === 'waste') 
      ? -Math.abs(req.body.quantity) 
      : Math.abs(req.body.quantity);

    const transactionData = {
      ...req.body,
      quantity: formattedQuantity
    };

    await transactionDb.insertTransaction(transactionData);
    
    // Redirect back to history or show success
    res.redirect("/transactions");
  } catch (err) {
    // Check for the specific Postgres 'Check Constraint' error code
    if (err.code === '23514') {
      return res.status(400).render("transactionForm", {
        error: "Insufficient stock! You cannot sell more than what is on hand.",
        formData: req.body // Keep the user's input in the form
      });
    }

    // Pass unexpected errors to your global error handler
    next(err);
  }
}

async function displayAllTransactions(req, res, next) {
  try {
    const transactions = await transactionDb.getAllTransactions();
    
    // We render the 'index' or 'history' view and pass the data
    res.render("transactions", { 
      title: "Transaction History", 
      transactions: transactions 
    });
  } catch (err) {
    // If the database connection fails, pass it to your global error handler
    next(err);
  }
}

module.exports = {
  validateTransaction,
  transactionCreateGet,
  transactionCreatePost,
  displayAllTransactions
}