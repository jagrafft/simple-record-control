const exec = require("exec");

const settings = require("./resources/settings.json");
const sources = require("./resources/sources.json");

process.on('SIGINT', function() {
    // stop ffmpeg procs "gracefully"
});