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

        const timesArray = Object.values(stageTimes).sort((a, b) => a.dateTs - b.dateTs);

        const elements = [];

        let lastWeek;
        let lastDate;

        const allowedProjects = [];
        qqStrict("input.project-checkbox-input", this.dom, HTMLInputElement).forEach((item) => {
            if (item.checked) {
                /** @type {HTMLDivElement>} */ // @ts-ignore
                const parent = item.parentElement;

                allowedProjects.push(Number(parent.dataset.projectId));
            }
        });

        for (const row of timesArray) {
            const task = tasks[row.taskId];
            const stage = stages[row.stageId];
            const project = projects[task.projectId];

            if (!task || !stage || !project) {
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
    }

    async render() {
        const [projects] = await Promise.all([requestCached("projects", "GET")]);

        this.dom.insertAdjacentHTML(
            "beforeend",
            wrapTag("div", "", { class: "copy-button-container" }, [
                wrapTag("button", "copy", { class: "copy-button" }),
            ])
        );

        const projectValues = Object.values(projects);
        const projectCheckboxes = wrapTag(
            "div",
            "",
            { class: "project-checkboxes" },
            projectValues.map((item) => {
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
        );

        this.dom.insertAdjacentHTML("beforeend", projectCheckboxes);
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

        qStrict("button.copy-button", this.dom).onclick = () => {
            copyToClipboard(this.txt);
        };

        const dataHtml = wrapTag("div", "", { class: "stage-logging-data" });
        this.dom.insertAdjacentHTML("beforeend", dataHtml);

        this.domLogs = qStrict(".stage-logging-data", this.dom, HTMLDivElement);

        return this.renderLogs();
    }
}
