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
        const [stageTimes, tasks] = await Promise.all([
            requestCached("task-stage-times", "GET"),
            requestCached("tasks", "GET"),
        ]);

        const timesArray = Object.values(stageTimes).sort((a, b) => a.dateTs - b.dateTs);

        this.dom.insertAdjacentHTML("beforeend", wrapTag("button", "copy"));

        const elements = [];

        let lastWeek;
        let lastDate;

        for (const row of timesArray) {
            const task = tasks[row.taskId];

            if (!task || task.projectId !== this.projectId) {
                continue;
            }

            // this.txt += `${row.date} ${task.name} ${row.stage} ${row.hours}h\n`;

            if (!lastDate || lastDate !== row.date) {
                lastDate = row.date;
                elements.push(wrapTag("div", lastDate, { class: "stage-date" }));
            }

            elements.push(
                wrapTag("div", "", { class: "row" }, [
                    // wrapTag("div", row.date, { class: "stage-date" }),
                    wrapTag("span", task.name, { class: "task-name" }),
                    wrapTag("span", row.stage, { class: "stage-name" }),
                    wrapTag("span", row.hours + "h", { class: "hours" }),
                ])
            );
        }

        qStrict("button", this.dom).onclick = () => {
            copyToClipboard(this.txt);
        };

        this.dom.insertAdjacentHTML("beforeend", elements.join(""));
    }
}
