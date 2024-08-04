const isEnvTrue = (key) => {
    return ["1", "true", "y"].includes(process.env[key] || "");
};

module.exports = { isEnvTrue };
