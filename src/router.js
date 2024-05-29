const { Router } = require("express");
const tasksStorage = require("./storages/tasks.storage");
const stagesStorage = require("./storages/stages.storage");
const storageRouter = require("./core/storage-router");
const taskStageTimesStorage = require("./storages/task-stage-times.storage");

const apiRouter = Router();

apiRouter.use("/tasks", storageRouter(tasksStorage));

apiRouter.use("/stages", storageRouter(stagesStorage));

apiRouter.use("/task-stage-times", storageRouter(taskStageTimesStorage));

module.exports = apiRouter;
