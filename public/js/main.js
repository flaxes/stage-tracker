// @ts-check
if (!moment) var moment = require("../lib/moment");
vex.defaultOptions.className = "vex-theme-default";

function setTheme(theme) {
    // @ts-ignore
    document.getElementById("theme-style").href = `/css/theme-${theme}.css`;
}

async function render() {
    setTheme(ENV.theme || "default");

    qStrict("#refresh-page", void 0, HTMLButtonElement).onclick = () => window.location.reload();

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
