const fs = require("fs");

const STORAGE_DIR = "./storage";

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

/**
 * @typedef {Record<string, { storage: Store; idColumn: string; onDelete: "NULL" | "DELETE" | "NOTHING" }>} StoreChildren
 */

class Store {
    /**
     *
     * @param {string} file
     * @param {object} [defaults]
     * @param {StoreChildren} [children]
     */
    constructor(file, defaults, children) {
        this.file = file;
        this.filePath = `${STORAGE_DIR}/${this.file}.json`;

        this.data = fs.existsSync(this.filePath)
            ? JSON.parse(fs.readFileSync(this.filePath, { encoding: "utf-8" }))
            : defaults || {
                  data: {},
                  lastIndex: 0,
                  manifest: 0,
              };

        /** @private */
        this.children = children;
    }

    getId(id) {
        return this.data.data[id];
    }

    getAll() {
        return this.data.data;
    }

    create(data) {
        const now = Date.now();

        for (const row of data) {
            const id = ++this.data.lastIndex;
            row.id = id;
            row.createdAt = now;

            this.data.data[id] = row;
        }

        this.save();

        return data;
    }

    update(data) {
        const now = Date.now();

        for (const row of data) {
            this.data.data[row.id] = row;
            row.updatedAt = now;
        }

        this.save();

        return data;
    }

    /**
     *
     * @param {number[]} ids
     * @returns
     */
    delete(ids) {
        let deletedCount = 0;

        if (!ids.length) return deletedCount;

        for (const id of ids) {
            if (this.data.data[id]) {
                delete this.data.data[id];
                deletedCount++;
            }
        }

        this.save();

        if (this.children) {
            for (const child of Object.values(this.children)) {
                if (child.onDelete === "NOTHING") continue;

                const childRows = Object.values(child.storage.getAll());

                if (child.onDelete === "DELETE") {
                    const affectedRowsIds = [];

                    for (const childRow of childRows) {
                        if (ids.includes(childRow[child.idColumn])) {
                            affectedRowsIds.push(childRow.id);
                        }
                    }

                    child.storage.delete(affectedRowsIds);
                    continue;
                }

                if (child.onDelete === "NULL") {
                    const toUpdate = [];
                    for (const childRow of childRows) {
                        if (ids.includes(childRow[child.idColumn])) {
                            childRow[child.idColumn] = null;

                            toUpdate.push(childRow);
                        }
                    }

                    child.storage.update(toUpdate);
                }
            }
        }

        return true;
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }
}

module.exports = Store;
