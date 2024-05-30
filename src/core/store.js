const fs = require("fs");

const STORAGE_DIR = "./storage";

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

class Store {
    constructor(file) {
        this.file = file;
        this.filePath = `${STORAGE_DIR}/${this.file}.json`;

        this.data = fs.existsSync(this.filePath)
            ? JSON.parse(fs.readFileSync(this.filePath, { encoding: "utf-8" }))
            : {
                  data: {},
                  lastIndex: 0,
              };
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

    delete(ids) {
        for (const id of ids) {
            delete this.data.data[id];
        }

        this.save();

        return true;
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }
}

module.exports = Store;
