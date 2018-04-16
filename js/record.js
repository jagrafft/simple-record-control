const { exec } = require('child_process');
const moment = require('moment');

const encoders = require('./resources/encoders.json');
const sources = require('./resources/sources.json');

// TODO Improve flexibility of encoder/decoder utilization
const name = process.argv[2];
const args = process.argv.slice(3, process.argv.length);

// TODO Move util (ffmpeg) to settings
let ffmpeg = ['ffmpeg','-report', '-y'];
let inputs = [];
let outputs = [];
const timeGroup = moment().format("YMMDD-HHmmss");  // Timestamp format matches FFmpeg's report flag

for (let i = 0; i < args.length; i++) {
    let source = sources.filter((s) => s.id == args[i])[0];
    let encoder = encoders[source.encoder];

    inputs.push(encoder.preInput + ' -i "' + source.addr + '"');
    outputs.push('-map ' + i + ' ' + encoder.postInput + ' "' + source.name + '-' + timeGroup + '.' + encoder.videoFormat + '"');
}

const cmd = ffmpeg.concat(inputs.concat(outputs)).join(' ');

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error('error: ' + error);
        // TODO report FAILURE
    } // TODO Report SUCCESS
    
    console.log(stdout);
    console.error('stderr: ' + stderr);
});

// TODO Repair file or gracefully shutdown so file is usable on unexpected error

process.on('SIGINT', () => {
    setTimeout(() => {
        process.exit(0);
    }, 1200);
});