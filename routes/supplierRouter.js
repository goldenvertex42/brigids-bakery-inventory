const { Router } = require("express");
const supplierController = require("../controllers/supplierController");
const supplierRouter = Router();

supplierRouter.get("/", supplierController.supplierListGet);
supplierRouter.get("/new", supplierController.supplierCreateGet);
supplierRouter.post("/new", supplierController.validateSupplier, supplierController.supplierCreatePost);
supplierRouter.get("/:id/edit", supplierController.supplierUpdateGet);
supplierRouter.post("/:id/edit", supplierController.validateSupplier, supplierController.supplierUpdatePost);
supplierRouter.get("/:id", supplierController.supplierDetailGet);

module.exports = supplierRouter;
