/*global require*/
/*jslint es6*/

const app = require("express")();
const bodyParser = require("body-parser");
const moment = require("moment");
const pm2 = require("pm2");

const handlers = require("./utilities/handlers.js");
const min = require("./resources/css.json");
const settings = require("./resources/settings.json");

// PUNCH LIST
// TODO Implement websockets for communcation with client.
// TODO Implement message passing between processes.
// TODO Terminate all active processes on shutdown.
// TODO Improve flexibility of encoder/decoder utilization.
// TODO Determine method for individual streams to record to same directory.
// TODO Supports FFmpeg and GStreamer.
// TODO Supports audio.

if (settings.utility != "ffmpeg" || settings.utility != "gstreamer") {
    console.error(`Supported utilities are FFmpeg ("ffmpeg") and GStreamer ("gstreamer").\nCurrently settings.utility == ${settings.utility}\nPlease edit ./js/resources/settings.json appropriately.\nExiting...`);
    process.exit(0);
}

const baseRecordDirectory = handlers.createDirectory(settings.baseDir);
if (!baseRecordDirectory) {
    console.error(`Problem creating ${baseRecordDirectory}, please investigate. Exiting...`);
    process.exit(0);
}

app.use(bodyParser.urlencoded({ extended: true }));

function reloadWindow(n) { return `setTimeout(function(){window.location.reload();},${n})`; }

app.get("/", (req, res) => {
    pm2.connect((error) => {
        if (error) {
            console.error(error);
            res.send(`<!DOCTYPE html><html><head><title>Simple Record | Error</title></head><body><h1>PM2 Connection Error</h1></body></html>`);
            return pm2.disconnect();
        }

        const devices = handlers.getSource().map((s) => {
            return `<label class="device"><input type="checkbox" class="smooth" name="${s.id}">${s.name}</label>`;
        }).join("");

        // TODO Indicate SUCCESS/FAILURE on page
        const record = `<div class="block"><form method="post" onsubmit="${reloadWindow(250)}">${devices}<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>`;

        // TODO Implement fail strategy
        pm2.list((error, processDescriptionList) => {
            const now = moment();
            const pm2list = processDescriptionList.map((p) => {
                const created = moment(p.pm2_env.created_at);
                const uptime = moment.duration(now.diff(created));
                return `<tr><td><label class="process"><input type="checkbox" class="smooth" name="${p.name}"></label></td><td>${p.pm_id}</td><td>${p.name}</td><td>${p.pm2_env.status}</td><td>${created.format("HH:mm:ss YYYY-MM-DD")}</td><td>${uptime.hours()}h${uptime.minutes()}m${uptime.seconds()}s</td><td>${p.pm2_env.restart_time}</td></tr>`;
            }).join("");

            const status  = `<div class="block"><form action="/stop" method="post" onsubmit="${reloadWindow(1600)}"><table><tr><th></th><th>id</th><th>name</th><th>status</th><th>created</th><th>uptime</th><th>restarts</th></tr>${pm2list}</table><br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>`;

            res.send(`<!DOCTYPE html><html><head><title>Simple Record | Controls</title><style>${min.css}</style></head><body>${record}${status}</body></html>`);
            return pm2.disconnect();
        });
    });
});

app.post("/", (req, res) => {
    const deviceIds = Object.keys(req.body);

    if (deviceIds.length > 0) {
        const now = moment();
        const dir = `${settings.baseDir}/${now.format("YMMDD-HHmmss")}`;
        const baseDirAvailable = handlers.createDirectory(settings.baseDir);
        const dirAvailable = handlers.createDirectory(dir);

        if (baseDirAvailable && dirAvailable) {
            pm2.connect((error) => {
                if (error) {
                    console.error(error);
                    return pm2.disconnect();
                }

                const name = handlers.uuid();
                console.log(`starting ${name}`);

                pm2.start({
                    name: name,
                    script: `./js/${settings.utility}.js`,
                    args: deviceIds,
                    cwd: dir,
                    output: `./${name}-out.log`,
                    error: `./${name}-error.log`,
                    minUptime: 500,
                    restartDelay: 500
                },
                (error) => {
                    if (error) console.error(error);
                    return pm2.disconnect();
                });
            });
        } else {
            console.error(`Cannot create base directory OR "${dir}", please investigate.`);
        }
    } else {
        console.log("Empty request");
    }
});

app.post("/stop", (req, res) => {
    pm2.connect((error) => {
        if (error) {
            console.error(error);
            return pm2.disconnect();
        }

        let procs = Object.keys(req.body);
        if (procs.length == 0) procs = ["all"];

        procs.forEach((p) => {
            pm2.delete(p, (error) => {
                if (error) console.error(error);
                console.log(`deleting ${p} ...`);
                return pm2.disconnect();
            });
        });
    });
    // res.send('STOPPED');
});

app.listen(3000, () => console.log("listening on port 3000..."));