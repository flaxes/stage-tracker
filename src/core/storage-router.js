const { Router } = require("express");
const Store = require("./store");

/**
 * 
 * @param {Store} storage 
 * @returns 
 */
function storageRouter(storage) {
    const router = Router();

    router.get("/", (req, res) => {
        res.json(storage.getAll());
    });

    router.post("/create", (req, res) => {
        res.json(storage.create(Array.isArray(req.body) ? req.body : [req.body]));
    });

    router.post("/update", (req, res) => {
        res.json(storage.update(Array.isArray(req.body) ? req.body : [req.body]));
    });

    router.post("/delete", (req, res) => {
        res.json(storage.delete(Array.isArray(req.body) ? req.body : req.body.ids));
    });

    return router;
}

module.exports = storageRouter;
