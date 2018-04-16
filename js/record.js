const { exec } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const moment = require('moment');
const encoders = require('./resources/encoders.json');
const sources = require('./resources/sources.json');

const args = process.argv.slice(2, process.argv.length);

// TODO ./recordings to global var or function or ...
const outdir = './recordings/' + moment().format('Y-MM-DD_HH.mm.ss');
if (!existsSync(outdir)) mkdirSync(outdir);

// TODO Improve flexibility of encoder/decoder utilization
let inputs = [];
let outputs = [];

for (i = 0; i < args.length; i++) {
    let source = sources.filter((s) => s.id == args[i])[0];
    let encoder = encoders[source.encoder];
    
    console.log("args[" + i + "] = " + args[i]);
    console.log("source " + JSON.stringify(source));
    
    inputs.push(encoder.preInput + ' -i "' + source.addr +'"');
    outputs.push('-map ' + i + ' ' + encoder.postInput + ' "' + outdir + '/' + source.name + '.' + encoder.videoFormat + '"');
}

// TODO Move util to settings
let cmd = ["ffmpeg", "-y"].concat(inputs.concat(outputs)).join(" ");

console.log(cmd);
exec(cmd);

process.on('SIGINT', function() {
    // Timeout to allow clean shutdown of multiple recording proccesses.
    setTimeout(function() {
        process.exit(0);
    }, 800);
});