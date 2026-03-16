const db = require("../db/queries");

async function productCreateGet(req, res) {
  const categories = await db.getProductCategories(); 
  res.render("productForm", { 
    title: "Add New Product", 
    categories 
  });
}

async function productCreatePost(req, res, next) {
  const { name, description, category_id, price, unit, quantity_on_hand, remake_level, image_url } = req.body;
  try {
    await db.insertProduct(name, description, category_id, price, unit, quantity_on_hand, remake_level, image_url);
    res.redirect(`/categories/${category_id}`);
  } catch (err) {
    next(err);
  }
}

async function productUpdateGet(req, res, next) {
  try {
    const product = await db.getProductById(req.params.id);
    const categories = await db.getProductCategories();

    if (!product) return next(new Error("Product not found"));

    res.render("productForm", {
      title: "Edit Product",
      product,
      categories
    })
  } catch (err) {
    next(err);
  }
}

async function productUpdatePost(req, res, next) {
  const { name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url } = req.body;
  try {
    await db.updateProduct(req.params.id, name, description, category_id, price, quantity_on_hand, unit, remake_level, image_url);
    res.redirect(`/categories/${category_id}`);
  } catch (err) { next(err); }
}

module.exports = { 
  productCreateGet, 
  productCreatePost,
  productUpdateGet,
  productUpdatePost
 };