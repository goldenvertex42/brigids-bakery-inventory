const inventoryDb = require("../db/inventoryQueries");

async function dashboardCreateGet(req, res) {
  const lowStockProducts = await inventoryDb.getProductsWithLowStock();
  const lowStockIngredients = await inventoryDb.getIngredientsWithLowStock();
  console.log(lowStockProducts);
  res.render("index", { 
    title: "Dashboard",
    lowStockProducts,
    lowStockIngredients
  });
}

module.exports = {
  dashboardCreateGet
}