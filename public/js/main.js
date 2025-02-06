// @ts-check
if (!moment) var moment = require("./lib/moment");

function activateCreateStageQuickmenu() {
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

function activateProjectQuickmenu() {
    const createProjectSection = qStrict("#create-project-section");

    const newProjectInput = qStrict('[name="name"]', createProjectSection, HTMLInputElement);

    qStrict("button", createProjectSection, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        request("/projects/create", "POST", [{ name: newProjectInput.value }]).then(() => {
            newProjectInput.value = "";
        });
    };

    const editProjectSection = qStrict("#edit-project-section");
    const editProjectSelect = qStrict('[name="project"]', editProjectSection, HTMLSelectElement);
    const editProjectName = qStrict('[name="name"]', editProjectSection, HTMLInputElement);
    const editProjectColor = qStrict('[name="color"]', editProjectSection, HTMLInputElement);

    const projectsPromise = createRemoteSelector(editProjectSelect, "projects", "id", "name");

    editProjectSelect.addEventListener("change", async (e) => {
        const selectedProject = getSelectedOptionValue(editProjectSelect);
        if (!selectedProject) return;

        const projectId = Number(selectedProject.value);
        if (!projectId) return;

        const project = (await projectsPromise)[projectId];

        editProjectName.value = project.name;
        editProjectColor.value = project.color || DEFAULT_PROJECT_COLOR;
    });

    qStrict("button", editProjectSection, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const selectedProject = getSelectedOptionValue(editProjectSelect);
        if (!selectedProject) return;

        const projectId = Number(selectedProject.value);
        if (!projectId) return;

        const update = {
            id: projectId,
            name: editProjectName.value,
            color: editProjectColor.value,
        };

        request("/projects/update", "POST", update);
    };

    const deleteProjectSection = qStrict("#delete-project-section");
    const deleteProjectSelect = qStrict('[name="project"]', deleteProjectSection, HTMLSelectElement);

    createRemoteSelector(deleteProjectSelect, "projects", "id", "name");

    qStrict("button", deleteProjectSection, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const selectedProject = getSelectedOptionValue(deleteProjectSelect);
        if (!selectedProject) return;
        const txt = `You want to delete "${selectedProject.text}" project. Are you sure?`;
        const isConfirmed = confirm(txt);
        if (!isConfirmed) return;

        request("/projects/delete", "POST", [Number(selectedProject.value)]).then(() => {
            window.location.reload();
        });
    };
}

function activateCreateTaskQuickmenu() {
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

function activateCustomStageTimeQuickmenu() {
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

function setTheme(theme) {
    // @ts-ignore
    document.getElementById("theme-style").href = `/css/theme-${theme}.css`;
}

async function render() {
    setTheme(ENV.theme);

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
            const { backgroundColor, color } = getButtonStyleColors(item.color || DEFAULT_PROJECT_COLOR);

            return wrapTag("a", item.name, {
                "data-id": item.id,
                class: "project-select",
                href: "#",
                style: `background-color: ${backgroundColor}; color:${color}`,
            });
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

    activateCreateStageQuickmenu();
    activateProjectQuickmenu();
    activateCreateTaskQuickmenu();
    activateCustomStageTimeQuickmenu();

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
