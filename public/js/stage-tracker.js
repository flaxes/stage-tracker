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
        const stagesRes = await request("/stages", "GET");
        const stages = Object.values(stagesRes).map((item) => item.name);

        const { theadColumns, columnDates, columnDays } = this.getTheadColumns(monday);
        const theadHtml = wrapTag("thead", "", {}, [wrapTag("tr", "", {}, theadColumns)]);

        const tbodyRows = [];

        for (const stage of stages) {
            const cells = [wrapTag("th", stage)];

            for (const date of columnDates) {
                cells.push(
                    wrapTag("td", "", { id: `cell_${date}_${stage}`, "data-date": date }, [wrapTag("button", "+")])
                );
            }

            const tr = wrapTag("tr", "", { id: `${columnDates[0]}-${stage}` }, cells);
            tbodyRows.push(tr);
        }

        this.dom.insertAdjacentHTML("beforeend", theadHtml);
        this.dom.insertAdjacentHTML("beforeend", tbodyRows);
    }

    async renderTable(date) {
        let thead = wrapTag("thead", "", {});
    }
}
