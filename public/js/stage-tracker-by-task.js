if (!moment) var moment = require('./lib/moment');

class StageTracker {
    /**
     *
     * @param {string} selector
     * @param {number} projectId
     */
    constructor(selector, projectId) {
        this.selector = selector;
        /** @type {HTMLTableElement} */
        this.dom = qStrict(selector);

        this.days = [];
        this.stages = [];
        this.projectId = projectId;
    }

    /**
     *
     * @param {import('moment-timezone').Moment} monday
     * @returns
     */
    getTheadColumns(monday) {
        const columnDays = [];
        const columnDates = [];

        const theadColumns = [wrapTag("th", "#")];

        for (let i = 0; i < 7; i++) {
            const dayName = WEEKDAY[monday.get("day")];
            const date = monday.format(DATE_ISO_FORMAT);

            theadColumns.push(
                wrapTag("th", "", { class: "tooltip" }, [
                    wrapTag("span", monday.toDate().toLocaleDateString(), { class: "tooltip-text tooltip-top" }),
                    wrapTag("div", dayName),
                ])
            );
            columnDays.push(dayName);
            columnDates.push(date);
            monday.add(1, "day");
        }

        return { theadColumns, columnDays, columnDates };
    }

    async render(currentWeek) {
        const monday = moment(currentWeek, WEEK_FORMAT);

        const [data, tasks] = await Promise.all([
            requestCached("task-stage-times", "GET"),
            requestCached("tasks", "GET"),
        ]);

        const tasksArray = Object.values(tasks).sort((a, b) => {
            return a.name > b.name ? 1 : -1;
        });

        const { theadColumns, columnDates } = this.getTheadColumns(monday);
        const theadHtml = wrapTag("thead", "", {}, [wrapTag("tr", "", {}, theadColumns)]);

        const tbodyRows = [];

        for (const task of tasksArray) {
            if (task.projectId !== this.projectId) continue;

            const cells = [wrapTag("th", task.name, { class: "task-name" })];

            for (const date of columnDates) {
                cells.push(
                    wrapTag("td", "", { id: `cell_${date}_${task.id}`, "data-date": date, "data-task-id": task.id }, [
                        wrapTag("button", "+", { class: "create-button" }),
                    ])
                );
            }

            const tr = wrapTag(
                "tr",
                "",
                { id: `row_${task.id}`, class: `row${task.isHidden ? " d-none" : ""}` },
                cells
            );

            tbodyRows.push(tr);
        }

        this.dom.insertAdjacentHTML("beforeend", theadHtml);
        this.dom.insertAdjacentHTML("beforeend", wrapTag("tbody", "", {}, tbodyRows));

        this.dom.querySelectorAll(".create-button").forEach((button) => {
            const { date, taskId } = button.parentElement.dataset;
            button.onclick = (_e) => {
                this.createCell({ date, taskId } /* , button.parentElement */);
            };
        });

        for (const row of Object.values(data)) {
            this.createCell(row);
        }
    }

    /**
     *
     * @param {object} row
     * @param {HTMLElement} [el]
     * @returns
     */
    createCell(row, el) {
        if (!el) {
            el = this.dom.querySelector(`#cell_${row.date}_${row.taskId}`);
        }

        if (!el) {
            return;
        }

        const div = document.createElement("div");
        el.append(div);
        div.className = "cell";

        el.parentElement.classList.remove("d-none");

        if (row.id) {
            div.dataset.id = row.id;
        }

        div.innerHTML = [
            wrapTag("select", "", { name: "stage" }),

            wrapTag("input", "", { type: "number", min: "0", name: "hours" }),
            wrapTag("button", "X", { class: "delete-button" }),
        ].join("");

        const stageSelector = div.querySelector('[name="stage"]');
        if (row.stage) {
            stageSelector.insertAdjacentHTML("afterbegin", wrapTag("option", row.stage, { value: row.stage }));
            stageSelector.value = row.stage;
        }

        createRemoteSelector(stageSelector, "stages", "name", "name");

        const hoursInput = div.querySelector('[name="hours"]');
        if (row.hours) hoursInput.value = row.hours;

        const deleteButton = div.querySelector("button");

        const saveAction = () => {
            const stageSelectorValue = getSelectedOptionValue(stageSelector);

            const data = {
                date: row.date,
                dateTs: Number((new Date(row.date).getTime() / 1000).toFixed(0)),
                stage: stageSelectorValue.value,
                // task: taskSelectorValue.text,
                taskId: row.taskId,
                hours: Number(hoursInput.value),
                id: Number(div.dataset.id),
            };

            const errorKey = checkObjectForEmpty(data, true);
            if (errorKey && errorKey !== "id") {
                // console.warn(`"${errorKey}" is empty`);
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
        stageSelector.addEventListener("change", saveAction);

        // button.onclick = save;
    }
}
