const { Router } = require("express");

function storageRouter(storage) {
    const router = Router();

    router.get("/", (req, res) => {
        res.json(storage.getAll());
    });

    router.post("/create", (req, res) => {
        res.json(storage.create(req.body));
    });

    router.post("/update", (req, res) => {
        res.json(storage.update(req.body));
    });

    router.post("/delete", (req, res) => {
        res.json(storage.delete(req.body.ids));
    });

    return router;
}

module.exports = storageRouter;
