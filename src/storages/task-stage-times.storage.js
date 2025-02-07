const Store = require("../core/store");
const stagesStorage = require("./stages.storage");
const tasksStorage = require("./tasks.storage");

const taskStageTimesStorage = new Store("task-stage-times-storage");

let manifest = taskStageTimesStorage.data.manifest || 0;

if (manifest < 1) {
    const data = taskStageTimesStorage.getAll();
    const stages = Object.values(stagesStorage.getAll());
    const tasks = Object.values(tasksStorage.getAll());

    for (const id in data) {
        const row = data[id];

        if (!row.taskId) {
            const task = tasks.find((item) => (item.name = row.task));
            row.taskId = task.id;
        }

        row.taskId = Number(row.taskId);
        delete row.task;

        const stage = stages.find((item) => item.name === row.stage);

        row.stageId = stage ? stage.id : 0;
        delete row.stage;
    }

    manifest = 1;
}

if (manifest !== taskStageTimesStorage.data.manifest) {
    console.log("taskStageTimesStorage manifest updated to", manifest);

    taskStageTimesStorage.data.manifest = manifest;
    taskStageTimesStorage.save();
}

module.exports = taskStageTimesStorage;
