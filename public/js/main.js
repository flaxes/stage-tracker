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

    const projectsPromise = createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: editProjectSelect,
    });

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

    createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: deleteProjectSelect,
    });

    qStrict("button", deleteProjectSection, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const selectedProject = getSelectedOptionValue(deleteProjectSelect);
        if (!selectedProject) return;

        const { value, text } = selectedProject;
        const txt = [
            `Are you sure you want to delete project ID: ${value} "${text}" and all its tasks?`,
            "Write the ID of project to confirm (only number).",
        ].join("\n");

        const isConfirmed = prompt(txt) === value;
        if (!isConfirmed) return;

        request("/projects/delete", "POST", [Number(value)]).then(() => {
            window.location.reload();
        });
    };
}

function activateTaskQuickmenu() {
    const dom = qStrict("#tasks-section");

    const nameInput = qStrict('[name="name"]', dom, HTMLInputElement);
    const projectSelector = qStrict('[name="project"]', dom, HTMLSelectElement);
    const taskDeleteSelector = qStrict('[name="task"]', dom, HTMLSelectElement);

    createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: projectSelector,
    });

    let currentProjectId = 0;
    projectSelector.addEventListener("change", (e) => {
        const project = getSelectedOptionValue(projectSelector);

        if (project) {
            currentProjectId = Number(project.value);
        }
    });

    createRemoteSelector({
        apiPath: "tasks",
        valueKey: "id",
        nameKey: "name",
        dom: taskDeleteSelector,
        sorter: (a, b) => (a.name > b.name ? 1 : -1),
        filter: (item) => item.projectId === currentProjectId,
    });

    qStrict("button.create", dom, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const project = getSelectedOptionValue(projectSelector);
        if (!project || !nameInput.value) return;

        request("/tasks/create", "POST", [{ name: nameInput.value, projectId: Number(project.value) }]).then(() => {
            nameInput.value = "";
            projectSelector.value = "";

            // window.location.reload();
        });
    };

    qStrict("button.delete", dom, HTMLButtonElement).onclick = (e) => {
        e.preventDefault();

        const task = getSelectedOptionValue(taskDeleteSelector);
        if (!task) return;

        const { text, value } = task;
        const txt = [
            `Are you sure you want to delete task ID: ${value} ("${text}") and all its data?`,
            "Enter the task ID to confirm (numbers only).",
        ].join("\n");

        const isConfirmed = prompt(txt) === value;
        if (!isConfirmed) return;

        const taskId = Number(value);

        request("/tasks/delete", "POST", [taskId]).then(() => {
            qStrict(`[value="${taskId}"]`, dom, HTMLOptionElement).remove();
            taskDeleteSelector.value = "";
        });
    };
}

function activateCustomStageTimeQuickmenu() {
    const dom = qStrict("#create-custom-stage-time");

    const dateInput = qStrict('[name="date"]', dom, HTMLInputElement);
    const hoursInput = qStrict('[name="hours"]', dom, HTMLInputElement);
    const taskSelector = qStrict('[name="task"]', dom, HTMLSelectElement);
    const stageSelector = qStrict('[name="stage"]', dom, HTMLSelectElement);

    createRemoteSelector({
        apiPath: "tasks",
        valueKey: "id",
        nameKey: "name",
        dom: taskSelector,
    });

    createRemoteSelector({
        apiPath: "stages",
        valueKey: "id",
        nameKey: "name",
        dom: stageSelector,
    });

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
            const style = getButtonStyleColorsText(item.color || DEFAULT_PROJECT_COLOR);

            return wrapTag("a", item.name, {
                "data-id": item.id,
                class: "project-select",
                href: "#",
                style,
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
    activateTaskQuickmenu();
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
