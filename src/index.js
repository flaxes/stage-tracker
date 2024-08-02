const express = require("express");
const app = require("./core/server");
const apiRouter = require("./router");
const updater = require("./core/updater");

const DEBUG = ["1", "true", "y"].includes(process.env.DEBUG || "");

async function main() {
    const isNewVersionAvailable = await updater.checkAvailable();

    if (isNewVersionAvailable) {
        console.log("NEW VERSION AVAILABLE! Downloading...");

        await updater.update();

        console.log("UPDATED! Please restart program. Auto-exit in 5 seconds...");

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
