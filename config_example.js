module.exports = {
    port: 3000,
    // Only for non-built version of app! WIP
    updaterEnabled: false,

    browserEnv: {
        stageTracker: {
            // Will ignore "isHidden" and reveals task if data available
            isStageDataAlwaysVisible: false,
            // Moves "+" button on top of cell
            addNewOnTop: false,
        },
    },
};
