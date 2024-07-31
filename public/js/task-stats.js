class TaskStats {
    constructor(selector) {
        this.selector = selector;

        /** @type {HTMLTableElement} */
        this.dom = q(selector);
    }

    async render() {
        const stages = await requestCached("stages");
        const tasks = await requestCached("tasks");
        const taskTimes = Object.values(await requestCached("task-stage-times"));

        const tasksArray = Object.values(tasks);
        //tasksArray.sort((a,b) => a.id - b.id);

        const stagesArray = Object.values(stages);

        const theadItems = [wrapTag("th", "Task"), ...stagesArray.map((item) => wrapTag("th", item.name))];

        theadItems.push(wrapTag("th", "Total"));
        const thead = wrapTag("thead", "", {}, theadItems);

        this.dom.insertAdjacentHTML("afterbegin", thead);

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

        // Take "tasks" instead of "taskGroups" due rows order by task creation

        for (const task of tasksArray.reverse()) {
            const taskTimeTotal = taskGroups[task.id];
            if (!taskTimeTotal) continue;

            const columnsValues = stagesArray.map((stage) => taskTimeTotal[stage.name] || 0);
            const data = [...columnsValues, taskTimeTotal.total].map((item) => wrapTag("td", item));

            data.unshift(wrapTag("td", "", {}, [wrapTag("input", "", { value: task.name, class: "stat-name" })]));

            tbodyRows.push(wrapTag("tr", "", { "data-id": task.id }, data));
        }

        const tbody = wrapTag("tbody", "", {}, tbodyRows);
        this.dom.insertAdjacentHTML("beforeend", tbody);
        this.dom.querySelectorAll("input.stat-name").forEach((input) => {
            input.onchange = (e) => {
                const id = getParent(e.target, 2).dataset.id;
                const task = tasks[id];

                if (!task) {
                    alert("Not found task!");
                    return;
                }
                task.name = input.value;

                request("tasks/update", "POST", [task]);
            };
        });
    }
}
