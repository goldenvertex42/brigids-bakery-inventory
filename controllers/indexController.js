const inventoryDb = require("../db/inventoryQueries");

async function dashboardCreateGet(req, res) {
  try {
    const [topSellers, wasteReport, lowStockProducts, lowStockIngredients] = await Promise.all([
      inventoryDb.getTopSellingProducts(),
      inventoryDb.getWasteReport(),
      inventoryDb.getProductsWithLowStock(),
      inventoryDb.getIngredientsWithLowStock()
    ]);

    res.render("index", {
      topSellers,
      wasteReport,
      lowStockProducts,
      lowStockIngredients,
      title: "Bakery Management Dashboard"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboardCreateGet
}