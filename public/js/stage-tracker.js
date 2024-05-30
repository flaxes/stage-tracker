class StageTracker {
    constructor(selector) {
        this.selector = selector;
        /** @type {HTMLTableElement} */
        this.dom = q(selector);

        this.days = [];
        this.stages = [];
    }

    getTheadColumns(monday) {
        const columnDays = [];
        const columnDates = [];

        const theadColumns = [wrapTag("th", "#")];

        for (let i = 0; i < 7; i++) {
            const dayName = WEEKDAY[monday.get("day")];

            theadColumns.push(wrapTag("th", dayName));
            columnDays.push(dayName);
            columnDates.push(monday.format(DATE_ISO_FORMAT));
            monday.add(1, "day");
        }

        /* const theadColumns = [wrapTag("th", "#"), wrapTag("th", monday.format(DATE_FORMAT))];

        for (let i = 0; i < 6; i++) {
            const dayName = monday.add(1, "d").format(DATE_FORMAT);

            theadColumns.push(wrapTag("th", dayName));
        } */

        return { theadColumns, columnDays, columnDates };
    }

    async render(currentWeek) {
        const monday = moment(currentWeek, WEEK_FORMAT);
        const stagesRes = await requestCached("stages", "GET");
        const stages = Object.values(stagesRes).map((item) => item.name);

        const { theadColumns, columnDates } = this.getTheadColumns(monday);
        const theadHtml = wrapTag("thead", "", {}, [wrapTag("tr", "", {}, theadColumns)]);

        const tbodyRows = [];

        for (const stage of stages) {
            const cells = [wrapTag("th", stage)];

            for (const date of columnDates) {
                cells.push(
                    wrapTag("td", "", { id: `cell_${date}_${stage}`, "data-date": date, "data-stage": stage }, [
                        wrapTag("button", "+", { class: "create-button" }),
                    ])
                );
            }

            const tr = wrapTag("tr", "", { id: `${columnDates[0]}-${stage}` }, cells);
            tbodyRows.push(tr);
        }

        this.dom.insertAdjacentHTML("beforeend", theadHtml);
        this.dom.insertAdjacentHTML("beforeend", tbodyRows);

        this.dom.querySelectorAll(".create-button").forEach((button) => {
            const { date, stage } = button.parentElement.dataset;
            button.onclick = (e) => {
                this.createCell({ date, stage } /* , button.parentElement */);
            };
        });

        const data = await requestCached("task-stage-times", "GET");

        for (const row of Object.values(data)) {
            this.createCell(row);
        }
    }

    createCell(row, el) {
        if (!el) {
            el = this.dom.querySelector(`#cell_${row.date}_${row.stage}`);
        }

        if (!el) {
            return;
        }

        const div = document.createElement("div");
        el.append(div);

        if (row.id) {
            div.dataset.id = row.id;
        }

        div.innerHTML = [
            wrapTag("select", "", { name: "task" }),
            wrapTag("input", "", { type: "number", min: "0", name: "hours" }),
            wrapTag("button", "X", { class: "delete-button" }),
        ].join("");

        const taskSelector = div.querySelector('[name="task"]');
        if (row.task) {
            taskSelector.insertAdjacentHTML("afterbegin", wrapTag("option", row.task, { value: row.task }));
            taskSelector.value = row.task;
        }

        createRemoteSelector(taskSelector, "tasks", "id", "name");

        const hoursInput = div.querySelector('[name="hours"]');
        if (row.hours) hoursInput.value = row.hours;

        const deleteButton = div.querySelector("button");

        const saveAction = () => {
            const taskSelectorValue = getSelectedOptionValue(taskSelector);

            const data = {
                date: row.date,
                stage: row.stage,
                task: taskSelectorValue.text,
                taskId: Number(taskSelectorValue.value),
                hours: Number(hoursInput.value),
                id: Number(div.dataset.id),
            };

            const errorKey = checkObjectForEmpty(data, true);
            if (errorKey && errorKey !== "id") {
                console.warn(`"${errorKey}" is empty`);
                return;
            }

            const requestPath = data.id ? "update" : "create";

            request(`task-stage-times/${requestPath}`, "POST", data)
                .then((data) => {
                    div.dataset.id = data[0].id;
                })
                .catch((err) => {
                    console.error(err);
                    alert(err.message);
                });

            // button.remove();
        };

        const deleteAction = async () => {
            const answer = confirm("Are you sure?");
            if (!answer) return;

            const id = Number(div.dataset.id);

            if (id) {
                await request("task-stage-times/delete", "POST", [id]);
            }

            div.remove();
        };

        deleteButton.onclick = deleteAction;

        hoursInput.addEventListener("change", saveAction);
        taskSelector.addEventListener("change", saveAction);

        // button.onclick = save;
    }
}
