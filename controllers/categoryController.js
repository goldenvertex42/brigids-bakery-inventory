// controllers/categoryController.js
const categoryDb = require("../db/categoryQueries");
const productDb = require("../db/productQueries");
const ingredientDb = require("../db/ingredientQueries");


async function categoryDetailGet(req, res, next) {
  const { id } = req.params;

  try {
    // 1. Get the category to find its type
    const category = await categoryDb.getCategoryById(id);

    if (!category) {
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }

    // 2. Switch logic based on category_type
    let items;
    if (category.category_type === 'product') {
      items = await productDb.getProductsByCategory(id);
    } else {
      items = await ingredientDb.getIngredientsByCategory(id);
    }

    // 3. Render the view with the correct items
    res.render("categoryDetails", { 
      title: category.name, 
      category, 
      items 
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { categoryDetailGet };
