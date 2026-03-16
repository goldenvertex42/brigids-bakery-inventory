const { Router } = require("express");
const indexRouter = Router();

indexRouter.get("/", (req, res) => {
    res.render("index", {title: "Brigid's Bakery Inventory Management"});
});

module.exports = indexRouter;