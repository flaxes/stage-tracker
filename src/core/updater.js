// @ts-check

const fs = require("fs");
const { spawnSync } = require("child_process");
const got = require("got-cjs").default;

const UPDATE_URL = "https://raw.githubusercontent.com/flaxes/stage-tracker/master/version";
const logger = console;

class Updater {
    #version;
    #available;
    constructor() {
        this.#version = Number(fs.readFileSync("./version").toString().replace(/\r/g, "").split("\n")[0]);
    }

    getVersion() {
        return { version: this.#version, available: this.#available };
    }

    async checkAvailable() {
        this.#available = await got.get(UPDATE_URL, { resolveBodyOnly: true, responseType: "text" }).catch((err) => {
            logger.error("UPDATER", err);

            return "";
        });

        this.#available = Number(this.#available.split("\n")[0]);

        return this.#available > this.#version;
    }

    update() {
        spawnSync("start", ["cmd.exe", "/c", "UPDATE.bat"], {
            windowsHide: false,
            cwd: "./",
            // stdio: "ignore",
            shell: "cmd",
        });
    }
}

const updater = new Updater();

module.exports = updater;
