const express = require("express");
const app = express();
const indexRouter = require("./routes/indexRouter.js");
const path = require("node:path");
const db = require("./db/queries");
const categoryRouter = require("./routes/categoryRouter.js");
const productRouter = require("./routes/productRouter.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

// Global middleware to populate sidebar categories
app.use(async (req, res, next) => {
  try {
    const [categories, alertIds] = await Promise.all([
        db.getSidebarCategories(),
        db.getCategoriesWithLowStockItems()
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});