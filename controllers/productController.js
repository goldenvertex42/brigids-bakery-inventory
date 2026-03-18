const productDb = require("../db/productQueries");
const categoryDb = require("../db/categoryQueries");

const { body, validationResult } = require("express-validator");

const validateProduct = [
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ max: 255 }).withMessage("Name must be under 255 characters."),
  body("description").trim().escape(), // Sanitization: prevents XSS
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("quantity_on_hand").isInt({ min: 0 }).withMessage("Stock cannot be negative."),
  body("remake_level").isInt({ min: 0 }).withMessage("Remake level must be 0 or higher."),
];

async function productCreateGet(req, res) {
  const categories = await categoryDb.getProductCategories(); 
  res.render("productForm", { 
    title: "Add New Product", 
    categories 
  });
}

async function productCreatePost(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const categories = await categoryDb.getProductCategories();
    return res.render("productForm", {
      title: "Add New Product",
      categories,
      errors: errors.array(), // Pass errors to the view
      formData: req.body // Pass back the data so the form stays filled
    });
  }
  
  try {
    const { name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url } = req.body;
    await productDb.insertProduct(name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url);
    res.redirect(`/categories/${category_id}`);
  } catch (err) {
    next(err);
  }
}

async function productUpdateGet(req, res, next) {
  try {
    const product = await productDb.getProductById(req.params.id);
    const categories = await categoryDb.getProductCategories();

    if (!product) return next(new Error("Product not found"));

    res.render("productForm", {
      title: "Update Product",
      product,
      categories
    })
  } catch (err) {
    next(err);
  }
}

async function productUpdatePost(req, res, next) {
  const { admin_password, name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url } = req.body;
  const id = req.params.id;

  const errors = validationResult(req);

  if (!errors.isEmpty() || admin_password !== process.env.ADMIN_PASSWORD) {
    try {
      const product = await productDb.getProductById(id);
      const categories = await categoryDb.getProductCategories();
      
      return res.render("productForm", { 
        title: "Update Product", 
        product: product, 
        categories,
        errors: errors.array(),
        passwordError: admin_password !== process.env.ADMIN_PASSWORD ? "Incorrect Admin Password" : null,
        formData: req.body
      });
    } catch (err) { return next(err); }
  }

  try {
    await productDb.updateProduct(id, name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url);
    res.redirect(`/categories/${category_id}`);
  } catch (err) { next(err); }
}

async function productDeletePost(req, res, next) {
  const { admin_password } = req.body;
  const productId = req.params.id;

  try {

    const product = await productDb.getProductById(productId);

    const categoryId = product.category_id;

    if (admin_password !== process.env.ADMIN_PASSWORD) {
      const categories = await categoryDb.getProductCategories();
      return res.render("productForm", {
        title: "Update Product",
        product: product,
        categories,
        error: "Incorrect password! Item was not deleted."
      });
    }

    await productDb.deleteProduct(productId);

    res.redirect(`/categories/${categoryId}`);

  } catch (err) {
    next(err);
  }
}


module.exports = { 
  validateProduct,
  productCreateGet, 
  productCreatePost,
  productUpdateGet,
  productUpdatePost,
  productDeletePost
 };