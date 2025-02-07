const Store = require("../core/store");
const tasksStorage = require("./tasks.storage");

const projectsStorage = new Store("projects-storage", void 0, {
    Tasks: {
        storage: tasksStorage,
        idColumn: "projectId",
        onDelete: "DELETE",
    },
});

module.exports = projectsStorage;
