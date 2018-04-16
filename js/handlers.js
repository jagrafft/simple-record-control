/*jslint es6 */
const { existsSync, mkdirSync } = require('fs');
const sources = require("./resources/sources.json");

function createDirectory(dir) {
    if (existsSync(dir)) {
        return true;
    } else {
        mkdirSync(dir);
        return existsSync(dir) ? true : false;
    }
}

function getSource(index = null) {
    const result = index == null ? sources : sources[index];
    return result;
}

function getStatus(index = null) {
    const result = index == null ? "all" : "index = " + index;
    return result;
}

function uuid() {
    // https://gist.github.com/LeverOne/1308368
    for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');
    return b;
}

module.exports.createDirectory = createDirectory;
module.exports.getSource = getSource;
module.exports.getStatus = getStatus;
module.exports.uuid = uuid;