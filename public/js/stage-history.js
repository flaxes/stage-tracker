// @ts-check

class StageHistory {
    constructor(selector, projectId) {
        this.projectId = projectId;
        this.dom = qStrict(selector);
    }

    /**
     *
     * @param {string | number} taskId
     * @returns
     */
    async renderTimes(taskId) {
        if (!taskId) return;
        if (typeof taskId === "string") {
            taskId = Number(taskId);
        }

        const allTaskTimes = await requestCached("task-stage-times", "GET");

        for (const id in allTaskTimes) {
            const taskTime = allTaskTimes[id];
            if (taskTime.taskId !== taskId) continue;
        }
    }

    async render() {
        const [stages] = await Promise.all([requestCached("stages"), requestCached("task-stage-times", "GET")]);
        const stagesArray = Object.values(stages);

        //tasksArray.sort((a,b) => a.id - b.id);

        const theadItems = [
            wrapTag("th", "Stage"),
            wrapTag("th", "", {}, [wrapTag("div", "Task"), wrapTag("select", "", { class: "task-select" })]),
        ];

        const thead = wrapTag("thead", "", {}, theadItems);
        const tbodyRows = [];

        this.dom.insertAdjacentHTML("afterbegin", thead);

        for (const stage of stagesArray) {
            const el = wrapTag("tr", "", { "data-id": stage.id }, [wrapTag("td", stage.name)]);

            tbodyRows.push(el);
        }

        const tbody = wrapTag("tbody", "", {}, tbodyRows);
        this.dom.insertAdjacentHTML("beforeend", tbody);

        const taskSelect = qStrict(".task-select", this.dom, HTMLSelectElement);

        const renderTasks = async (e) => {
            const tasks = await requestCached("tasks", "GET");
            const lastSel = taskSelect.options[taskSelect.selectedIndex];

            while (taskSelect.options.length) {
                taskSelect.options.remove(0);
            }

            if (lastSel) {
                lastSel.hidden = true;
                taskSelect.appendChild(lastSel);
            }

            const arr = [];

            Object.values(tasks).forEach((task) => {
                if (task.projectId !== this.projectId) return;

                arr.push({ id: task.id, name: task.name.toLowerCase() });
            });

            arr.sort((a, b) => (a.name > b.name ? 1 : -1));

            for (const { id } of arr) {
                const task = tasks[id];
                // if (task.projectId !== this.projectId) continue;

                const el = document.createElement("option");

                el.textContent = task.name;
                el.value = task.id;

                taskSelect.appendChild(el);
            }
        };

        taskSelect.onfocus = renderTasks;
        taskSelect.onchange = (_e) => this.renderTimes(taskSelect.value);

        await renderTasks();
        this.renderTimes(taskSelect.value);
    }
}
