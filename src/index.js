const express = require("express");
const app = require("./core/server");
const apiRouter = require("./router");
const updater = require("./core/updater");

async function main() {
    const version = updater.getVersion();
    if (version.version !== version.available) {
        await updater.update();

        console.log("UPDATED! Please restart program.");

        setTimeout(() => {
            process.exit(0);
        }, 5e3);

        return;
    }

    app.use(express.static("public"));

    app.use("/api", apiRouter);

    app.listen(3000, () => {
        console.log("Server started http://localhost:3000");
    });
}

main().catch((err) => console.error("FATAL", err));
