const { Router } = require("express");
const categoryController = require("../controllers/categoryController");
const categoryRouter = Router();

// This matches links like /categories/1
categoryRouter.get("/:id", categoryController.categoryDetailGet);

module.exports = categoryRouter;
