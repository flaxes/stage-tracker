const Store = require("../core/store");

const stageDefaults = {
    data: {
        1: {
            name: "RES",
            id: 1,
            createdAt: 1722436316646,
        },
        2: {
            name: "BnW",
            id: 2,
            createdAt: 1717024854481,
        },
        3: {
            name: "Color",
            id: 3,
            createdAt: 1717024853409,
        },
        4: {
            name: "Render",
            id: 4,
            createdAt: 1717024855270,
        },
        5: {
            name: "PSD",
            id: 5,
            createdAt: 1722436329811,
        },
    },
    lastIndex: 5,
};

const stagesStorage = new Store("stages-storage", stageDefaults);

module.exports = stagesStorage;
