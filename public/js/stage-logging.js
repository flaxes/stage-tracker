class StageLogging {
    /**
     *
     * @param {string} selector
     * @param {number} projectId
     */
    constructor(selector, projectId) {
        this.dom = qStrict(selector);
        /** @type {HTMLDivElement | null} */
        this.domLogs = null;

        this.projectId = projectId;

        this.txt = "";

        this.isReversedLogs = true;
    }

    async renderLogs() {
        if (!this.domLogs) return console.error("No dom logs!");

        this.domLogs.innerHTML = "";
        this.txt = "";

        const [stageTimes, tasks, stages, projects] = await Promise.all([
            requestCached("task-stage-times", "GET"),
            requestCached("tasks", "GET"),
            requestCached("stages", "GET"),
            requestCached("projects", "GET"),
        ]);

        const sortBy = this.isReversedLogs ? (a, b) => b - a : (a, b) => a - b;
        const timesArray = Object.values(stageTimes).sort((a, b) => sortBy(a.dateTs, b.dateTs));

        const elements = [];

        let lastWeek;
        let lastDate;

        const allowedProjects = [];
        qqStrict("input.project-checkbox-input", this.dom, HTMLInputElement).forEach((item) => {
            if (item.checked) {
                /** @type {HTMLDivElement} */ // @ts-ignore
                const parent = item.parentElement;

                allowedProjects.push(Number(parent.dataset.projectId));
            }
        });

        for (const row of timesArray) {
            const task = tasks[row.taskId];
            if (!task) continue;

            const stage = stages[row.stageId];
            const project = projects[task.projectId];

            if (!stage || !project) {
                continue;
            }

            const projectId = project.id;
            if (!allowedProjects.includes(projectId)) {
                continue;
            }

            if (!lastDate || lastDate !== row.date) {
                /* if (task.projectId !== this.projectId) {
                    continue;
                } */

                // this.txt += `${row.date} ${task.name} ${row.stage} ${row.hours}h\n`;

                lastDate = row.date;
                const m = moment(lastDate);
                const currentWeek = `${m.year()}-${m.isoWeek()}`;
                const localDate = m.toDate().toLocaleDateString();

                if (!lastWeek) {
                    lastWeek = currentWeek;
                } else if (currentWeek !== lastWeek) {
                    lastWeek = currentWeek;
                    elements.push(wrapTag("div", "WEEK", { class: "stage-week" }));
                }

                elements.push(wrapTag("div", localDate, { class: "stage-date" }));

                if (this.txt) this.txt += "\n";
                this.txt += `${localDate}\n`;
            }

            this.txt += `${project.name} ${task.name} ${stage.name} ${row.hours}h\n`;

            const projectStyles = getButtonStyleColorsText(project.color || DEFAULT_PROJECT_COLOR);
            const projectCapsule = wrapTag("span", project.name, { class: "project-name", style: projectStyles });

            elements.push(
                wrapTag("div", "", { class: "row", "data-project-id": projectId }, [
                    // wrapTag("div", row.date, { class: "stage-date" }),
                    projectCapsule,
                    wrapTag("span", task.name, { class: "task-name" }),
                    wrapTag("span", stage.name, { class: "stage-name" }),
                    wrapTag("span", row.hours + "h", { class: "hours" }),
                ])
            );
        }

        this.domLogs.insertAdjacentHTML("beforeend", elements.join(""));
        this.domLogs.scroll(0, 0);
    }

    async render() {
        const [projects] = await Promise.all([requestCached("projects", "GET")]);

        const projectValues = Object.values(projects);
        const projectCheckboxes = projectValues
            .map((item) => {
                const style = getButtonStyleColorsText(item.color || DEFAULT_PROJECT_COLOR);
                const checkbox = wrapTag("input", "", {
                    class: "project-checkbox-input",
                    type: "checkbox",
                });

                const projectName = wrapTag("span", item.name, { class: "project-checkbox-name" });

                const html = wrapTag(
                    "span",
                    "",
                    { class: "project-checkbox-container unselectable", style, "data-project-id": item.id },
                    [checkbox, projectName]
                );

                return html;
            })
            .join("");

        qStrict(".project-checkboxes", this.dom, HTMLDivElement).insertAdjacentHTML("beforeend", projectCheckboxes);

        qqStrict(".project-checkbox-container", this.dom, HTMLSpanElement).forEach((container) => {
            const checkbox = qStrict("input", container, HTMLInputElement);
            checkbox.checked = true;

            container.onclick = (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }

                this.renderLogs();

                /* qqStrict(`[data-project-id="${container.dataset.projectId}"`, this.dom).forEach((item) => {
                    item.toggleAttribute("hidden");
                }); */
            };
        });

        const parent = this.dom.parentElement;

        if (!parent) {
            throw new Error("Not Initialized yet!");
        }

        qStrict("button.copy-logging-button", parent).onclick = () => {
            copyToClipboard(this.txt);
        };

        const dataHtml = wrapTag("div", "", { class: "stage-logging-data" });
        this.dom.insertAdjacentHTML("beforeend", dataHtml);

        this.domLogs = qStrict(".stage-logging-data", this.dom, HTMLDivElement);

        return this.renderLogs();
    }
}
