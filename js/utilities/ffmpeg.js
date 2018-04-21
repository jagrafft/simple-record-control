/*global require*/
/*jslint es6*/

const {exec} = require("child_process");
const moment = require("moment");

const presets = require("../resources/presets/ffmpeg.json");
const sources = require("../resources/sources.json");

const args = process.argv.slice(2, process.argv.length);

const timeGroup = moment().format("YMMDD-HHmmss");  // Timestamp format matches FFmpeg's `-report`

// Pipe
// const cmd = args.map((arg, i) => {
//     let source = sources.filter((s) => s.id == arg)[0];
//     const preset = presets[source.preset];    
//     return `ffmpeg -report -y ${preset.preInput} -i "${source.addr}" -map ${i} ${preset.postInput} "${source.name}-${timeGroup}.${preset.videoFormat}"`;
// }).join(" | ");

// Map
const ffmpeg = ["ffmpeg", "-report", "-y"];
let inputs = [];
let outputs = [];
args.forEach((arg, i) => {
    let source = sources.filter((s) => s.id == arg)[0];
    const preset = presets[source.preset];

    inputs.push(`${preset.preInput} -i "${source.addr}"`);
    outputs.push(`-map ${i} ${preset.postInput} "${source.name}-${timeGroup}.${preset.videoFormat}"`);
});

const cmd = ffmpeg.concat(inputs.concat(outputs)).join(" ");

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        // TODO report FAILURE
    } // TODO Report SUCCESS

    console.log(cmd);
    console.log(stdout);
    console.error(stderr);
});

// TODO Repair file/gracefully shutdown/.. => file is usable on unexpected error
process.on("SIGINT", () => {
    setTimeout(() => {
        process.exit(0);
    }, 1200);
});