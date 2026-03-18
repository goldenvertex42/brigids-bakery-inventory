// controllers/categoryController.js
const categoryDb = require("../db/categoryQueries");
const productDb = require("../db/productQueries");
const ingredientDb = require("../db/ingredientQueries");
const categoryTypes = ["product", "ingredient"];

const { body, validationResult } = require("express-validator");

const validateCategory = [
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ max: 255 }).withMessage("Name must be under 255 characters."),
  body("description").trim().escape(),
  body('category_type')
    .exists().withMessage('Category type is required')
    .isString().withMessage('Category type must be a string')
    .trim()
    .isIn(['product', 'ingredient']).withMessage('Category type must be either "product" or "ingredient"'),
];

async function categoryCreateGet(req, res) {
  res.render("categoryForm", { 
    title: "Add New Category",
    categoryTypes
  });
}

async function categoryCreatePost(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render("categoryForm", { 
    title: "Add New Category",
    categoryTypes,
    formData: req.body,
    errors: errors.array()
  });
  }
  
  try {
    const { name, description, category_type } = req.body;
    const newCategoryId = await categoryDb.insertCategory(name, description, category_type);
    res.redirect(`/categories/${newCategoryId}`);
  } catch (err) {
    next(err);
  }
}

async function categoryUpdateGet(req, res, next) {
  try {
    const category = await categoryDb.getCategoryById(req.params.id);
    
    if (!category) return next(new Error("Category not found"));

    res.render("categoryForm", { 
      title: "Update Category",
      category,
      categoryTypes
    });
  } catch (err) {
    next(err);
  }
}

async function categoryUpdatePost(req, res, next) {
  const { admin_password, name, description, category_type } = req.body;
  const id = req.params.id;

  const errors = validationResult(req);
  
  if (!errors.isEmpty() || admin_password !== process.env.ADMIN_PASSWORD) {
    try {
      const category = categoryDb.getCategoryById(id);
      
      return res.render("categoryForm", { 
        title: "Update Category", 
        category: category,
        errors: errors.array(),
        passwordError: admin_password !== process.env.ADMIN_PASSWORD ? "Incorrect Admin Password" : null,
        formData: req.body
      });
    } catch (err) { return next(err); }
  }

  try {
    await categoryDb.updateCategory(id, name, description, category_type);
    res.redirect(`/categories/${id}`);
  } catch (err) { next(err); }
}

async function categoryDeletePost(req, res, next) {
  const { admin_password } = req.body;
  const categoryId = req.params.id;

  try {
    const category = categoryDb.getCategoryById(categoryId);


    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.render("categoryForm", {
        title: "Update Category",
        category: category,
        error: "Incorrect password! Item was not deleted."
      });
    }

    await categoryDb.deleteCategory(categoryId);

    res.redirect(`/categories/${categoryId}`);

  } catch (err) {
    next(err);
  }
}

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

module.exports = { 
  validateCategory,
  categoryCreateGet,
  categoryCreatePost,
  categoryUpdateGet,
  categoryUpdatePost,
  categoryDeletePost,
  categoryDetailGet
};
