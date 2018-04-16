/*jslint es6 */
const { exec } = require('child_process');
const encoders = require('./resources/encoders.json');
const sources = require('./resources/sources.json');

const args = process.argv.slice(2, process.argv.length);

// TODO Improve flexibility of encoder/decoder utilization
let inputs = [];
let outputs = [];

for (let i = 0; i < args.length; i++) {
    let source = sources.filter((s) => s.id == args[i])[0];
    let encoder = encoders[source.encoder];
    
    inputs.push(encoder.preInput + ' -i "' + source.addr +'"');
    outputs.push('-map ' + i + ' ' + encoder.postInput + ' "' + source.name + '.' + encoder.videoFormat + '"');
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