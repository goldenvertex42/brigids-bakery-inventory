const { Router } = require("express");
const transactionController = require("../controllers/transactionController");
const transactionRouter = Router();

transactionRouter.get("/", transactionController.displayAllTransactions);
transactionRouter.get("/new", transactionController.transactionCreateGet);
transactionRouter.post("/new", transactionController.validateTransaction, transactionController.transactionCreatePost);

module.exports = transactionRouter;