/*global require*/
/*jslint es6*/

const {exec} = require("child_process");
const moment = require("moment");

const encoders = require("./resources/encoders.json");
const sources = require("./resources/sources.json");

const args = process.argv.slice(2, process.argv.length);

const timeGroup = moment().format("YMMDD-HHmmss");  // Timestamp format matches FFmpeg"s report flag

// TODO Improve flexibility of encoder/decoder utilization
// TODO Determine best method for individual streams to record to same directory.

// Pipe
// const cmd = args.map((arg, i) => {
//     let source = sources.filter((s) => s.id == arg)[0];
//     const encoder = encoders[source.encoder];    
//     return `ffmpeg -report -y ${encoder.preInput} -i "${source.addr}" -map ${i} ${encoder.postInput} "${source.name}-${timeGroup}.${encoder.videoFormat}"`;
// }).join(" | ");

// Map
// TODO Move util (ffmpeg) and global util options to settings
const ffmpeg = ["ffmpeg", "-report", "-y"];
let inputs = [];
let outputs = [];
args.forEach((arg, i) => {
    let source = sources.filter((s) => s.id == arg)[0];
    const encoder = encoders[source.encoder];

    inputs.push(`${encoder.preInput} -i "${source.addr}"`);
    outputs.push(`-map ${i} ${encoder.postInput} "${source.name}-${timeGroup}.${encoder.videoFormat}"`);
});

const cmd = ffmpeg.concat(inputs.concat(outputs)).join(" ");

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("error: " + error);
        // TODO report FAILURE
    } // TODO Report SUCCESS

    console.log(cmd);
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});

// TODO Repair file or gracefully shutdown so file is usable on unexpected error
process.on("SIGINT", () => {
    setTimeout(() => {
        process.exit(0);
    }, 1200);
});