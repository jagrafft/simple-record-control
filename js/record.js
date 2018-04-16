const { exec } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const moment = require('moment');
const encoders = require('./resources/encoders.json');
const sources = require('./resources/sources.json');

const args = process.argv.slice(2, process.argv.length);

// TODO ./recordings to global var or function or ...
const outdir = './recordings/' + moment().format('YMMDD-HHmmss');
if (!existsSync(outdir)) mkdirSync(outdir);

// TODO Improve flexibility of encoder/decoder utilization
let inputs = [];
let outputs = [];

for (i = 0; i < args.length; i++) {
    let source = sources.filter((s) => s.id == args[i])[0];
    let encoder = encoders[source.encoder];
    
    inputs.push(encoder.preInput + ' -i "' + source.addr +'"');
    outputs.push('-map ' + i + ' ' + encoder.postInput + ' "' + outdir + '/' + source.name + '.' + encoder.videoFormat + '"');
}

let ffmpeg = ['ffmpeg','-report', '-y'].concat(inputs.concat(outputs)).join(' ');

console.log(ffmpeg);
// TODO Move util (ffmpeg) to settings
exec(ffmpeg, (error, stdout, stderr) => {
    if (error) {
        console.error('error: ' + error);
        // TODO report FAILURE
    } // TODO else { report SUCCESS }

    console.log(stdout);
    console.error('stderr: ' + stderr);
});

process.on('SIGINT', () => {
    setTimeout(() => {
        process.exit(0);
    }, 800);
});