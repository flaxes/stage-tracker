class TaskStats {
    /**
     *
     * @param {string} selector
     * @param {number} projectId
     */
    constructor(selector, projectId) {
        this.selector = selector;

        /** @type {HTMLTableElement} */
        this.dom = q(selector);

        this.projectId = projectId;
    }

    async render() {
        const [stages, tasks, taskTimesObj] = await Promise.all([
            requestCached("stages"),
            requestCached("tasks"),
            requestCached("task-stage-times"),
        ]);

        const taskTimes = Object.values(taskTimesObj);

        const tasksArray = Object.values(tasks).sort((a, b) => (a.name > b.name ? 1 : -1));
        //tasksArray.sort((a,b) => a.id - b.id);

        const stagesArray = Object.values(stages);

        const theadItems = [wrapTag("th", "Task"), ...stagesArray.map((item) => wrapTag("th", item.name))];

        theadItems.push(wrapTag("th", "Total"));
        const thead = wrapTag("thead", "", {}, theadItems);
        const taskGroups = {};
        const tbodyRows = [];

        let total = 0;
        let totalProject = 0;

        this.dom.insertAdjacentHTML("afterbegin", thead);

        // Take "tasks" instead of "taskGroups" due rows order by task creation
        const getHideButton = (isHidden) => {
            const style = isHidden ? visibleHiddenText.hidden : visibleHiddenText.visible;

            const btn = wrapTag("button", style.txt, { class: style.elClass });

            return btn;
        };

        for (const taskTime of taskTimes) {
            total += taskTime.hours;

            if (tasks[taskTime.taskId].projectId !== this.projectId) {
                continue;
            }

            if (!taskGroups[taskTime.taskId]) {
                taskGroups[taskTime.taskId] = {
                    total: 0,
                };
            }

            const taskTimeTotal = taskGroups[taskTime.taskId];

            if (!taskTimeTotal[taskTime.stageId]) {
                taskTimeTotal[taskTime.stageId] = 0;
            }

            taskTimeTotal[taskTime.stageId] += taskTime.hours;
            taskTimeTotal.total += taskTime.hours;

            totalProject += taskTime.hours;
        }

        for (const task of tasksArray) {
            if (task.projectId !== this.projectId) continue;

            const taskTimeTotal = taskGroups[task.id] || { total: 0 };
            // if (!taskTimeTotal) continue;

            const columnsValues = stagesArray.map((stage) => taskTimeTotal[stage.id] || 0);
            const data = [...columnsValues, taskTimeTotal.total].map((item) => wrapTag("td", item));

            data.unshift(wrapTag("td", "", {}, [wrapTag("input", "", { value: task.name, class: "task-name" })]));
            data.push(wrapTag("td", "", { class: "hide-button" }, [getHideButton(task.isHidden)]));

            tbodyRows.push(wrapTag("tr", "", { "data-id": task.id }, data));
        }

        const tbody = wrapTag("tbody", "", {}, tbodyRows);
        this.dom.insertAdjacentHTML("beforeend", tbody);

        const totalH2 = q("#task-stats-total");

        if (totalH2) {
            totalH2.textContent = `Overall: ${total}h | Project total: ${totalProject}h`;
        }

        this.dom.querySelectorAll("input.task-name").forEach((input) => {
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
        this.dom.querySelectorAll(".hide-button button").forEach((button) => {
            button.onclick = (e) => {
                const id = getParent(e.target, 2).dataset.id;

                const task = tasks[id];

                if (!task) {
                    alert("Not found task!");
                    return;
                }
                task.isHidden = !task.isHidden;

                const style = task.isHidden ? visibleHiddenText.hidden : visibleHiddenText.visible;

                button.textContent = style.txt;
                button.className = style.elClass;

                request("tasks/update", "POST", [task]);
            };
        });
    }
}
