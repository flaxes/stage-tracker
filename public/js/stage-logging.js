class StageLogging {
    /**
     *
     * @param {string} selector
     * @param {number} projectId
     */
    constructor(selector, projectId) {
        this.dom = qStrict(selector);
        this.projectId = projectId;

        this.txt = "";
    }

    async render() {
        const [stageTimes, tasks, stages] = await Promise.all([
            requestCached("task-stage-times", "GET"),
            requestCached("tasks", "GET"),
            requestCached("stages", "GET"),
        ]);

        const timesArray = Object.values(stageTimes).sort((a, b) => a.dateTs - b.dateTs);

        this.dom.insertAdjacentHTML(
            "beforeend",
            wrapTag("div", "", { class: "copy-button-container" }, [
                wrapTag("button", "copy", { class: "copy-button" }),
            ])
        );

        const elements = [];

        let lastWeek;
        let lastDate;

        for (const row of timesArray) {
            const task = tasks[row.taskId];
            const stage = stages[row.stageId];

            if (!task || !stage || task.projectId !== this.projectId) {
                continue;
            }

            // this.txt += `${row.date} ${task.name} ${row.stage} ${row.hours}h\n`;

            if (!lastDate || lastDate !== row.date) {
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

            this.txt += `${task.name} ${stage.name} ${row.hours}h\n`;

            elements.push(
                wrapTag("div", "", { class: "row" }, [
                    // wrapTag("div", row.date, { class: "stage-date" }),
                    wrapTag("span", task.name, { class: "task-name" }),
                    wrapTag("span", stage.name, { class: "stage-name" }),
                    wrapTag("span", row.hours + "h", { class: "hours" }),
                ])
            );
        }

        qStrict("button.copy-button", this.dom).onclick = () => {
            copyToClipboard(this.txt);
        };

        this.dom.insertAdjacentHTML("beforeend", elements.join(""));
    }
}
