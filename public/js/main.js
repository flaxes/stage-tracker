function activateCreateStageForm() {
    const dom = q("#create-stage-section");

    const nameInput = dom.querySelector('[name="name"]');
    dom.querySelector("button").onclick = (e) => {
        e.preventDefault();

        request("/stages/create", "POST", [{ name: nameInput.value }]).then(() => {
            nameInput.value = "";
        });
    };
}

function activateCreateTaskForm() {
    const dom = q("#create-task-section");

    const nameInput = dom.querySelector('[name="name"]');
    dom.querySelector("button").onclick = (e) => {
        e.preventDefault();

        request("/tasks/create", "POST", [{ name: nameInput.value }]).then(() => {
            nameInput.value = "";
        });
    };
}

function activateCustomStageTimeForm() {
    const dom = q("#create-custom-stage-time");

    const dateInput = dom.querySelector('[name="date"]');
    const taskSelector = dom.querySelector('[name="task"]');
    const stageSelector = dom.querySelector('[name="stage"]');
    const hoursInput = dom.querySelector('[name="hours"]');

    createRemoteSelector(taskSelector, "tasks", "name", "name");
    createRemoteSelector(stageSelector, "stages", "name", "name");

    dom.querySelector("button").onclick = (e) => {
        e.preventDefault();

        const data = {
            dateInput: dateInput.value,
            task: getSelectedOptionValue(taskSelector),
            stage: getSelectedOptionValue(stageSelector),
            hours: Number(hoursInput.value),
        };

        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                console.warn(`"${key}" is "${value}". skip`);

                return;
            }
        }

        console.log(data);

        request("/task-stage-times/create", "POST", [data])
            .then(() => {
                taskSelector.value = "";
                stageSelector.value = "";
                hoursInput.value = 0;
            })
            .catch((err) => {
                console.error(err);
                alert(err.message);
            });
    };
}

function render() {
    const currentWeek = SEARCH.get("week") || moment().format(WEEK_FORMAT);

    const m = moment(currentWeek);

    const searchWeek = q("#search-week");
    const doSearch = () => {
        const val = searchWeek.value;

        refreshWithNewSearch("week", val);
    };

    searchWeek.value = currentWeek;

    // q(".tracker-search-action").onclick = doSearch;
    searchWeek.onchange = doSearch;

    const changeWeek = (num) => () => {
        m.add({ week: num });

        searchWeek.value = m.format(WEEK_FORMAT);
        doSearch();
    };

    q(".search-prev").onclick = changeWeek(-1);
    q(".search-next").onclick = changeWeek(1);

    activateCreateStageForm();
    activateCreateTaskForm();
    activateCustomStageTimeForm();
}

render();
