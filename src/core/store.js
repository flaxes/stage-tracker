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

    create(datas) {
        const now = Date.now();

        for (const data of datas) {
            const id = ++this.data.lastIndex;
            data.id = id;
            data.createdAt = now;

            this.data.data[id] = data;
        }

        this.save();

        return datas;
    }

    update(datas) {
        const now = Date.now();

        for (const data of datas) {
            this.data.data[data.id] = data;
            data.updatedAt = now;
        }

        this.save();

        return datas;
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
