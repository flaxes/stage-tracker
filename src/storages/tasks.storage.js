const Store = require("../core/store");
const taskStageTimesStorage = require("./task-stage-times.storage");

const tasksStorage = new Store("tasks-storage", void 0, {
    TaskStages: { idColumn: "taskId", onDelete: "DELETE", storage: taskStageTimesStorage },
});

module.exports = tasksStorage;
