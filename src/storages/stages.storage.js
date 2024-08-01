const Store = require("../core/store");

const stageDefaults = {
    data: {
        1: {
            name: "Research",
            id: 1,
            createdAt: 1717020000000,
        },
        2: {
            name: "BnW",
            id: 2,
            createdAt: 1717020000000,
        },
        3: {
            name: "Color",
            id: 3,
            createdAt: 1717020000000,
        },
        4: {
            name: "Render",
            id: 4,
            createdAt: 1717020000000,
        },
        5: {
            name: "PSD_prep",
            id: 5,
            createdAt: 1717020000000,
        },
    },
    lastIndex: 5,
};

const stagesStorage = new Store("stages-storage", stageDefaults);

module.exports = stagesStorage;
