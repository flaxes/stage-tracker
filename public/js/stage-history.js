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

        const [allTaskTimes, stages] = await Promise.all([
            requestCached("task-stage-times", "GET"),
            requestCached("stages", "GET"),
        ]);

        const stageGroups = {};
        for (const stageId in stages) {
            stageGroups[stageId] = [];
        }

        for (const id in allTaskTimes) {
            const taskTime = allTaskTimes[id];
            if (taskTime.taskId !== taskId) continue;

            const m = moment(taskTime.date);
            const localDate = m.toDate().toLocaleDateString();

            stageGroups[taskTime.stageId].push(
                wrapTag("span", "", { class: "tooltip" }, [
                    wrapTag("span", localDate, { class: "tooltip-text tooltip-top" }),
                    wrapTag("div", taskTime.hours),
                ])
            );
        }

        
        let tooltipMargin;
        const onMouseOver = (e) => {
            const text = e.currentTarget.children[0];
            const parent = e.currentTarget.parentElement;

            if (!tooltipMargin && tooltipMargin !== 0) {
                console.log(123);
                tooltipMargin = Number(getComputedStyle(text)["margin-left"].slice(0, -2));
            }

            if (parent.scrollLeft) {
                text.style["margin-left"] = -parent.scrollLeft + tooltipMargin + "px";
            }
        };

        for (const stageId in stageGroups) {
            const stageTimes = stageGroups[stageId];

            const stageDom = qStrict(`tr[data-id="${stageId}"]`, this.dom);

            stageDom.innerHTML = wrapTag("tr", "", { "data-id": stageId }, [
                wrapTag("th", stages[stageId].name),
                wrapTag("td", "", {}, [wrapTag("div", "", { class: "times" }, stageTimes)]),
            ]);

            stageDom.querySelectorAll(".tooltip").forEach((item) => {
                item.onmouseover = onMouseOver;
            });
        }
    }

    async render() {
        const [stages] = await Promise.all([requestCached("stages"), requestCached("task-stage-times", "GET")]);
        const stagesArray = Object.values(stages);

        //tasksArray.sort((a,b) => a.id - b.id);

        const theadItems = [
            wrapTag("th", "Stage", { class: "stage-column" }),
            wrapTag("th", "", { class: "hours-column" }, [
                wrapTag("div", "Task"),
                wrapTag("select", "", { class: "task-select" }),
            ]),
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
