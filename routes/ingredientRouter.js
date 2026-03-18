const { Router } = require("express");
const ingredientController = require("../controllers/ingredientController");
const ingredientRouter = Router();

// Important: Put '/new' BEFORE '/:id' so Express doesn't think 'new' is an ID
ingredientRouter.get("/new", ingredientController.ingredientCreateGet);
ingredientRouter.post("/new", ingredientController.ingredientCreatePost);
ingredientRouter.get("/:id/edit", ingredientController.ingredientUpdateGet);
ingredientRouter.post("/:id/edit", ingredientController.ingredientUpdatePost);
ingredientRouter.post("/:id/delete", ingredientController.ingredientDeletePost);

module.exports = ingredientRouter;