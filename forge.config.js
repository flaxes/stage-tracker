/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
    packagerConfig: {
        asar: true,
        ignore: [
            "^/\\.gitignore$",
            "^/\\.vscode$",
            "^/backend\\.js$",
            "^/config_example\\.js$",
            "^/INSTALL\\.bat$",
            "^/jsconfig\\.json$",
            "^/package-lock\\.json$",
            "^/RUN\\.bat$",
            "^/run\\.js$",
            "^/storage$",
            "^/public$",
            "^/test\\.js$",
            "^/types$",
            "^/.*\\.ts$",
            "^/.*\\.md$",
            "^/.*/LICENSE$",
        ],
        extraResource: ["./public"],        
    },
    rebuildConfig: {},
    makers: [
        // Add your makers here
    ],
    plugins: [
        // Add your plugins here
    ],
};
