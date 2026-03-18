const { Router } = require("express");
const categoryController = require("../controllers/categoryController");
const categoryRouter = Router();

categoryRouter.get("/new", categoryController.categoryCreateGet);
categoryRouter.post("/new", categoryController.validateCategory, categoryController.categoryCreatePost);
categoryRouter.get("/:id/edit", categoryController.categoryUpdateGet);
categoryRouter.post("/:id/edit", categoryController.validateCategory, categoryController.categoryUpdatePost);
categoryRouter.post("/:id/delete", categoryController.categoryDeletePost);
categoryRouter.get("/:id", categoryController.categoryDetailGet);

module.exports = categoryRouter;
