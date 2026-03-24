const express = require("express");
const app = express();
const indexRouter = require("./routes/indexRouter.js");
const path = require("node:path");
const inventoryDb = require("./db/inventoryQueries.js");
const categoryDb = require("./db/categoryQueries.js");
const productDb = require("./db/productQueries.js");
const ingredientDb = require("./db/ingredientQueries.js");
const categoryRouter = require("./routes/categoryRouter.js");
const productRouter = require("./routes/productRouter.js");
const ingredientRouter = require("./routes/ingredientRouter.js");
const supplierRouter = require("./routes/supplierRouter.js");
const transactionRouter = require("./routes/transactionRouter.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

// Global middleware to populate sidebar categories and track the current active page
app.use(async (req, res, next) => {
  try {
    const [categories, alertIds] = await Promise.all([
        categoryDb.getSidebarCategories(),
        inventoryDb.getCategoriesWithLowStockItems()
    ]);
    // Attached to res.locals so it's available in ALL templates
    res.locals.sidebarCategories = categories.map(cat => ({
        ...cat,
        hasAlert: alertIds.includes(cat.id)
    }));
     
    const path = req.path;

    // Identify main sections
    if (path === '/') res.locals.activePage = 'dashboard';
    else if (path.startsWith('/suppliers')) res.locals.activePage = 'suppliers';
    else if (path.startsWith('/transactions')) res.locals.activePage = 'transactions';

    // Identify specific category ID from URL
    const categoryMatch = path.match(/\/categories\/(\d+)/);
    res.locals.currentCategoryId = categoryMatch ? categoryMatch[1] : null;

    // Identify specific category ID of an item being edited
    if (path.includes('/edit')) {
    const productMatch = path.match(/\/products\/(\d+)/);
    const ingredientMatch = path.match(/\/ingredients\/(\d+)/);
    
    if (productMatch) {
        const product = await productDb.getProductById(productMatch[1]);
        if (product) res.locals.currentCategoryId = product.category_id;
    } else if (ingredientMatch) {
        const ingredient = await ingredientDb.getIngredientById(ingredientMatch[1]);
        if (ingredient) res.locals.currentCategoryId = ingredient.category_id;
    }
  }

    next();
  } catch (err) {
    next(err); // Pass errors to your Express error handler
  }
});

app.use("/", indexRouter);
app.use("/categories", categoryRouter);
app.use("/products", productRouter);
app.use("/ingredients", ingredientRouter);
app.use("/suppliers", supplierRouter);
app.use("/transactions", transactionRouter);

const PORT = 3000;
app.listen(PORT, (error) => {
  // This is important!
  // Without this, any startup errors will silently fail
  // instead of giving you a helpful error message.
  if (error) {
    throw error;
  }
  console.log(`Bakery Inventory Management App - listening on PORT ${PORT}!`);
});

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err); // This "pushes" the 404 into your global error handler
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).render("error-page", { 
    title: "Error",
    errors: [{ msg: message }] // Wrapping in an array to match your partial's logic
  });
});