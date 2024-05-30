class TaskStats {
    constructor(selector) {
        this.selector = selector;

        /** @type {HTMLTableElement} */
        this.dom = q(selector);
    }

    async render() {
        const stages = await requestCached("stages");

        const stageColumns = Object.values(stages);

        const theadItems = [wrapTag("th", "Task"), ...stageColumns.map((item) => wrapTag("th", item.name))];

        theadItems.push(wrapTag("th", "Total"));
        const thead = wrapTag("thead", "", {}, theadItems);

        this.dom.insertAdjacentHTML("afterbegin", thead);

        const tasks = await requestCached("tasks");
        const taskTimes = Object.values(await requestCached("task-stage-times"));

        const taskGroups = {};

        for (const taskTime of taskTimes) {
            if (!taskGroups[taskTime.taskId]) {
                taskGroups[taskTime.taskId] = {
                    total: 0,
                };
            }

            const taskTimeTotal = taskGroups[taskTime.taskId];

            if (!taskTimeTotal[taskTime.stage]) {
                taskTimeTotal[taskTime.stage] = 0;
            }

            taskTimeTotal[taskTime.stage] += taskTime.hours;
            taskTimeTotal.total += taskTime.hours;
        }

        const tbodyRows = [];
        for (const [id, taskTimeTotal] of Object.entries(taskGroups)) {
            console.log(taskTimeTotal, stageColumns);
            const columnsValues = stageColumns.map((stage) => taskTimeTotal[stage.name]);

            console.log(columnsValues);

            const data = [tasks[id].name, ...columnsValues, taskTimeTotal.total].map((item) => wrapTag("td", item));

            tbodyRows.push(wrapTag("tr", "", {}, data));
        }

        const tbody = wrapTag("tbody", "", {}, tbodyRows);
        this.dom.insertAdjacentHTML("beforeend", tbody);
    }
}
