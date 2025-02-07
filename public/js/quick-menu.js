/**
 *
 * @param {Record<number, object>} projects
 */
function activateProjectSelectionQuickMenu(projects) {
    const onProjectClick = (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        refreshWithNewSearch("project", id);
    };

    const projectsBar = qStrict("#projects");
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
                vexAlert(err.message);
            });
    };
}

/**
 *
 * @param {HTMLElement[]} [domsForColoring]
 */
function activateProjectQuickmenu(domsForColoring = []) {
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

        request("/projects/update", "POST", update).then(() => {
            const projectButton = qStrict(`#projects [data-id="${projectId}"]`);
            projectButton.textContent = update.name;

            for (const dom of domsForColoring) {
                dom.style.borderColor = update.color;
            }

            projectButton.setAttribute("style", getButtonStyleColorsText(update.color));
        });
    };
}

function activateTaskQuickmenu() {
    const dom = qStrict("#tasks-section");

    const nameInput = qStrict('[name="name"]', dom, HTMLInputElement);
    const projectSelector = qStrict('[name="project"]', dom, HTMLSelectElement);

    nameInput.disabled = true;

    createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: projectSelector,
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
}

function activeDeleteSection() {
    const deleteSection = qStrict("#delete-section");
    const deleteProjectSection = qStrict("#delete-project-section", deleteSection, HTMLDivElement);
    const deleteProjectSelect = qStrict('[name="project"]', deleteProjectSection, HTMLSelectElement);

    // Project delete
    createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: deleteProjectSelect,
    });

    qStrict("button.delete", deleteProjectSection, HTMLButtonElement).onclick = async (e) => {
        e.preventDefault();

        const selectedProject = getSelectedOptionValue(deleteProjectSelect);
        if (!selectedProject) return;

        const { value, text } = selectedProject;
        const txt = [
            `Are you sure you want to delete project ID: ${value} "${text}" and all its tasks?`,
            "Write the ID of project to confirm (only number).",
        ].join("\n");

        const isConfirmed = (await vexPrompt(txt)) === value;
        if (!isConfirmed) return;

        request("/projects/delete", "POST", [Number(value)]).then(() => {
            window.location.reload();
        });
    };

    // Task delete
    const taskDeleteSection = qStrict(".delete-task-section", deleteSection, HTMLDivElement);
    const taskProjectSelector = qStrict('[name="project"]', taskDeleteSection, HTMLSelectElement);
    const taskDeleteSelector = qStrict('[name="task"]', taskDeleteSection, HTMLSelectElement);

    taskDeleteSelector.disabled = true;

    createRemoteSelector({
        apiPath: "projects",
        valueKey: "id",
        nameKey: "name",
        dom: taskProjectSelector,
    });

    let currentProjectId = 0;

    taskProjectSelector.addEventListener("change", (e) => {
        const project = getSelectedOptionValue(taskProjectSelector);

        if (project) {
            currentProjectId = Number(project.value);

            taskDeleteSelector.disabled = false;
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

    qStrict("button.delete", taskDeleteSection, HTMLButtonElement).onclick = async (e) => {
        e.preventDefault();

        const task = getSelectedOptionValue(taskDeleteSelector);
        if (!task) return;

        const { text, value } = task;
        const txt = [
            `Are you sure you want to delete task ID: ${value} ("${text}") and all its data?`,
            "Enter the task ID to confirm (numbers only).",
        ].join("\n");

        const isConfirmed = (await vexPrompt(txt)) === value;
        if (!isConfirmed) return;

        const taskId = Number(value);

        request("/tasks/delete", "POST", [taskId]).then(() => {
            qStrict(`[value="${taskId}"]`, taskDeleteSelector, HTMLOptionElement).remove();

            taskDeleteSelector.value = "";
        });
    };
}

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
