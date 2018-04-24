/*global require*/
/*jslint es6*/

const {exec} = require("child_process");
const moment = require("moment");
const handlers = require("./handlers.js");

const ts = moment().format("YMMDD-HHmmss");
const cmd = process.argv[2].replace(/__TS__/g, ts);
const name = process.argv[3];

// maxBuffer = 128MiB = (128 * 1024 * 1024)bytes = 134217728bytes
handlers.recordEvent({path: `./logs/${name}-events.csv`, ts: moment().format("x"), label: cmd});
exec(cmd, { maxBuffer: 134217728 }, (error, stdout, stderr) => {
    if (error) {
        console.error(error);
    }

    console.log(cmd);
    console.log(stdout);
    console.error(stderr);
});
// TODO Implement messaging

// TODO Repair file/gracefully shutdown/.. => file is usable on unexpected error
process.on("SIGINT", () => {
    handlers.recordEvent({path: `./logs/${name}-events.csv`, ts: moment().format("x"), label: "SIGINT"});
    setTimeout(() => {
        process.exit(0);
    }, 1200);
});