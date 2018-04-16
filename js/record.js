/*jslint es6 */
const { exec } = require('child_process');
const pmx = require('pmx');
const encoders = require('./resources/encoders.json');
const sources = require('./resources/sources.json');

// TODO Implement naming scheme for failover (restarts)
// TODO Improve flexibility of encoder/decoder utilization
const name = process.argv[2];
const args = process.argv.slice(3, process.argv.length);
const probe = pmx.probe();

// TODO Move util (ffmpeg) to settings
let ffmpeg = ['ffmpeg','-report', '-y'];
let inputs = [];
let outputs = [];

// Create execution counter
// Stores total number of attempted executions
let counter = probe.counter({ name: name });
console.log("counter = " + JSON.stringify(counter._count));

for (let i = 0; i < args.length; i++) {
    let source = sources.filter((s) => s.id == args[i])[0];
    let encoder = encoders[source.encoder];
    const restart = JSON.stringify(counter._count);
    
    inputs.push(encoder.preInput + ' -i "' + source.addr + '"');
    outputs.push('-map ' + i + ' ' + encoder.postInput + ' "' + restart + '-' + source.name + '.' + encoder.videoFormat + '"');
}

const cmd = ffmpeg.concat(inputs.concat(outputs)).join(' ');
console.log(cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error('error: ' + error);
        // TODO report FAILURE
    } // TODO Report SUCCESS
    
    console.log(stdout);
    console.error('stderr: ' + stderr);
});

// Increment execution counter
counter.inc();
console.log("counter = " + JSON.stringify(counter._count));

process.on('SIGINT', () => {
    setTimeout(() => {
        process.exit(0);
    }, 800);
});