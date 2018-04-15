/*jslint es6 */
const sources = require("./config/sources.json");

function getSource(index = null) {
    const result = index == null ? sources : sources[index];
    return result;
}

function getStatus(index = null) {
    const result = index == null ? "all" : "index = " + index;
    return result;
}

module.exports.getSource = getSource;
module.exports.getStatus = getStatus;