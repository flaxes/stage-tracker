// @ts-check
if (!moment) var moment = require("./lib/moment");

function activateCreateStageForm() {
    const dom = qStrict("#create-stage-section");

    const nameInput = qStrict('[name="name"]', dom, HTMLInputElement);

    // @ts-ignore
    qStrict("button", dom, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        request("/stages/create", "POST", [{ name: nameInput.value }]).then(() => {
            nameInput.value = "";
        });
    };
}

function activateCreateProjectForm() {
    const dom = qStrict("#create-project-section");

    const nameInput = qStrict('[name="name"]', dom, HTMLInputElement);

    qStrict("button", dom, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        request("/projects/create", "POST", [{ name: nameInput.value }]).then(() => {
            nameInput.value = "";
        });
    };
}

function activateCreateTaskForm() {
    const dom = qStrict("#create-task-section");

    const nameInput = qStrict('[name="name"]', dom, HTMLInputElement);
    const projectSelector = qStrict('[name="project"]', dom, HTMLSelectElement);

    createRemoteSelector(projectSelector, "projects", "id", "name");

    qStrict("button", dom, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const project = getSelectedOptionValue(projectSelector);
        if (!project || !nameInput.value) return;

        request("/tasks/create", "POST", [{ name: nameInput.value, projectId: Number(project.value) }]).then(() => {
            nameInput.value = "";
            projectSelector.value = "";

            // window.location.reload();
        });
    };
}

function activateCustomStageTimeForm() {
    const dom = qStrict("#create-custom-stage-time");

    const dateInput = qStrict('[name="date"]', dom, HTMLInputElement);
    const hoursInput = qStrict('[name="hours"]', dom, HTMLInputElement);
    const taskSelector = qStrict('[name="task"]', dom, HTMLSelectElement);
    const stageSelector = qStrict('[name="stage"]', dom, HTMLSelectElement);

    createRemoteSelector(taskSelector, "tasks", "id", "name");
    createRemoteSelector(stageSelector, "stages", "id", "name");

    const quickMenuDom = qStrict("#quick-menu-button", document, HTMLButtonElement);
    quickMenuDom.onclick = () => {
        qStrict("#quick-menu").classList.toggle("d-none");
    };

    qStrict("button", dom).onclick = (e) => {
        e.preventDefault();
        if (!dateInput.value) return;

        const taskSelectorValue = getSelectedOptionValue(taskSelector);
        const stageSelectorValue = getSelectedOptionValue(stageSelector);

        if (!taskSelectorValue || !stageSelectorValue) return;

        const data = {
            date: dateInput.value,
            dateTs: Number((new Date(dateInput.value).getTime() / 1000).toFixed(0)),
            // task: taskSelectorValue.text,
            taskId: Number(taskSelectorValue.value),
            stageId: Number(stageSelector.value),
            hours: Number(hoursInput.value),
        };

        checkObjectForEmpty(data, true);

        request("/task-stage-times/create", "POST", [data])
            .then(() => {
                // dateInput.value = "";
                taskSelector.value = "";
                stageSelector.value = "";
                hoursInput.value = "";
            })
            .catch((err) => {
                console.error(err);
                alert(err.message);
            });
    };
}

async function render() {
    const searchWeek = qStrict("#search-week", document, HTMLInputElement);
    const projectsBar = qStrict("#projects");
    const upperSection = qStrict("#upper-section");
    const lowerSection = qStrict("#lower-section");

    const currentWeek = SEARCH.get("week") || moment().format(WEEK_FORMAT);

    const projects = await requestCached("projects", "GET");

    let projectId = Number(SEARCH.get("project"));

    if (!projects[projectId]) {
        // console.log("no project");
        const projectsVals = Object.values(projects);

        if (projectsVals.length) {
            projectId = Number(projectsVals[0].id);

            if (projectId) {
                return refreshWithNewSearch("project", projectId);
            }
        }
    }

    const onProjectClick = (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        refreshWithNewSearch("project", id);
    };

    const html = Object.values(projects)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((item) => {
            return wrapTag("a", item.name, { "data-id": item.id, class: "project-select", href: "#" });
        })
        .join("");

    projectsBar.insertAdjacentHTML("beforeend", html);
    projectsBar.querySelectorAll("a").forEach((item) => (item.onclick = onProjectClick));

    const m = moment(currentWeek);

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

    qStrict(".search-prev").onclick = changeWeek(-1);
    qStrict(".search-next").onclick = changeWeek(1);

    activateCreateStageForm();
    activateCreateProjectForm();
    activateCreateTaskForm();
    activateCustomStageTimeForm();

    if (!projectId) return;
    const stageTracker = new StageTracker("#week-table", projectId);
    const stageLogging = new StageLogging("#stage-logging", projectId);
    const taskStats = new TaskStats("#task-stats-table", projectId);
    const stageHistory = new StageHistory("#stage-history", projectId);

    createElementHideButton(upperSection, "upper_section_hidden", qStrict(".hide-upper-section"));
    createElementHideButton(lowerSection, "lower_section_hidden", qStrict(".hide-lower-section"));

    stageTracker.render(currentWeek);
    stageLogging.render();
    taskStats.render();
    stageHistory.render();
}

render();
