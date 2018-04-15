/*jslint es6 */
const sources = require("./config/sources.json");

function getSource(index = null) {
    const result = index == null ? sources : sources[index];
    return result;
}

module.exports.getSource = getSource;