const express = require("express");
const app = express();
const indexRouter = require("./routes/indexRouter.js");
const path = require("node:path");
const inventoryDb = require("./db/inventoryQueries.js");
const categoryDb = require("./db/categoryQueries.js")
const categoryRouter = require("./routes/categoryRouter.js");
const productRouter = require("./routes/productRouter.js");
const ingredientRouter = require("./routes/ingredientRouter.js");
const supplierRouter = require("./routes/supplierRouter.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

// Global middleware to populate sidebar categories
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