const { Router } = require("express");
const productController = require("../controllers/productController");
const productRouter = Router();

// Important: Put '/new' BEFORE '/:id' so Express doesn't think 'new' is an ID
productRouter.get("/new", productController.productCreateGet);
productRouter.post("/new", productController.productCreatePost);
productRouter.get("/:id/edit", productController.productUpdateGet);
productRouter.post("/:id/edit", productController.productUpdatePost);

module.exports = productRouter;