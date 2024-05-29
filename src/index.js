const express = require("express");
const app = require("./core/server");
const apiRouter = require("./router");

async function main() {
    app.use(express.static("public"));

    app.use("/api", apiRouter);

    app.listen(3000, () => {
        console.log("Server started http://localhost:3000");
    });
}

main().catch((err) => console.error("FATAL", err));
