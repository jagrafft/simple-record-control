/*global require*/
/*jslint es6*/

const {exec} = require("child_process");
const moment = require("moment");

const encoders = require("../resources/presets/gstreamer.json");
const sources = require("../resources/sources.json");