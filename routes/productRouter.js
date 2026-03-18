const { Router } = require("express");
const productController = require("../controllers/productController");
const productRouter = Router();

// Important: Put '/new' BEFORE '/:id' so Express doesn't think 'new' is an ID
productRouter.get("/new", productController.productCreateGet);
productRouter.post("/new", productController.validateProduct, productController.productCreatePost);
productRouter.get("/:id/edit", productController.productUpdateGet);
productRouter.post("/:id/edit", productController.validateProduct, productController.productUpdatePost);
productRouter.post("/:id/delete", productController.productDeletePost);

module.exports = productRouter;