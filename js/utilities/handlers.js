/*global require*/
/*jslint es6*/

const { existsSync, mkdirSync, appendFileSync } = require("fs");
const ffmpeg = require("../resources/presets/ffmpeg.json");
const gstreamer = require("../resources/presets/gstreamer.json");
const settings = require("../resources/settings.json");
const sources = require("../resources/sources.json");

function createDirectory(dir) {
    if (existsSync(dir)) {
        return true;
    } else {
        mkdirSync(dir);
        return existsSync(dir) ? true : false;
    }
}

function ffmpegRecordString(source) {
    const preset = ffmpeg[source.encoder];
    const cmd = `FFREPORT=file="./logs/__GROUP__-ffmpeg-${source.name}-__TS__.log":level=40 ffmpeg -y ${preset.preInput} -i "${source.addr}" ${preset.postInput} "__GROUP__-${source.name}-__TS__.${preset.extension}"`;
    return cmd;
}

function getSource(src = null) {
    const result = src == null ? sources : sources[String(src)];
    return result;
}

function groupBy(list, fn) {
    let groups = {};
    list.forEach((item) => {
        let group = fn(item);
        groups[group] = groups[group] || [];
        groups[group].push(item);
    });
    return groups;
}

function gstRecordString(source) {
    return `NOT YET IMPLEMENTED`;
}

function mkRecordString(id) {
    const source = getSource(id);
    const result = (settings.utility == "ffmpeg") ? ffmpegRecordString(source) : gstRecordString(source);
    return result;

}

function recordEvent(obj) {
    appendFileSync(obj.path, `${obj.ts},"${obj.label.replace(/"/g,"'")}"\n`, (error) => {
        if (error) console.error(error);
    });
}

function reloadWindow(n) {
    return `setTimeout(function(){window.location.reload();},${n})`;
}

function uuid() {
    // https://gist.github.com/LeverOne/1308368
    for(b=a="";a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):"-");
    return b;
}

module.exports.createDirectory = createDirectory;
module.exports.getSource = getSource;
module.exports.groupBy = groupBy;
module.exports.mkRecordString = mkRecordString;
module.exports.recordEvent = recordEvent;
module.exports.reloadWindow = reloadWindow;
module.exports.uuid = uuid;