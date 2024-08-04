const express = require("express");
const path = require("path");
const app = require("./core/server");
const apiRouter = require("./router");
const updater = require("./core/updater");
const { port, updaterEnabled } = require("../config");
const { isEnvTrue } = require("./core/helpers");

const DEBUG = isEnvTrue("DEBUG");
const IS_ELECTRON = isEnvTrue("ELECTRON");
const IS_BUILT = __dirname.endsWith("app.asar\\src");

async function main() {
    if (updaterEnabled) {
        const isNewVersionAvailable = await updater.checkAvailable();

        if (isNewVersionAvailable) {
            console.log("NEW VERSION AVAILABLE! Downloading...");

            updater.update();

            console.log("UPDATED! Please restart program. Auto-exit in 5 seconds...");

            setTimeout(() => {
                process.exit(0);
            }, 5e3);

            return;
        }
    }

    let publicPath = "../public";
    if (IS_BUILT) {
        publicPath = "../" + publicPath;
        console.log("Running build");
    }

    const fullPublicPath = path.join(__dirname, publicPath);
    app.use(express.static(fullPublicPath));

    app.use("/api", apiRouter);

    app.listen(port, () => {
        console.log(`Backend started http://localhost:${port}\n${fullPublicPath}`);
    });
}

module.exports = main;
