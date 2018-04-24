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
// TODO Add support for nesting (group -> processes) to client interface.
// TODO Allow closure of process groups. (In addition to "all" and individually (by name).)
// TODO Terminate all active processes on shutdown.
// TODO Supports FFmpeg and GStreamer.
// TODO Improve FFmpeg JSON preset format.
// TODO Create GStreamer JSON preset format.
// TODO Implement recovery method(s) for unclosed files.
// TODO Implement websockets for communcation with client. (together with messaging)
// TODO Implement PM2 messaging. (together with WS)

if (settings.utility != "ffmpeg" && settings.utility != "gstreamer") {
    console.error(`Supported utilities are FFmpeg ("ffmpeg") and GStreamer ("gstreamer").\nCurrently settings.utility == ${settings.utility}\nPlease edit ./js/resources/settings.json appropriately.\nExiting...`);
    process.exit(0);
}

const baseRecordDirectory = handlers.createDirectory(settings.baseDir);
if (!baseRecordDirectory) {
    console.error(`Problem creating ${baseRecordDirectory}, please investigate. Exiting...`);
    process.exit(0);
}

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    pm2.connect((error) => {
        if (error) {
            console.error(error);
            res.send(`<!DOCTYPE html><html><head><title>Simple Record | Error</title></head><body><h1>PM2 Connection Error</h1></body></html>`);
            return pm2.disconnect();
        }

        const devices = Object.entries(handlers.getSource()).map((obj) => {
            const source = obj[1];
            return `<label class="device"><input type="checkbox" class="smooth" name="${obj[0]}">${source.name}</label>`;
        }).join("");

        // TODO Indicate SUCCESS/FAILURE on page
        const record = `<div class="block"><form method="post" onsubmit="${handlers.reloadWindow(250)}">${devices}<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>`;

        // TODO Implement fail strategy
        pm2.list((error, processDescriptionList) => {
            const now = moment();

            const pm2list = processDescriptionList.map((p) => {
                const created = moment(p.pm2_env.created_at);
                const uptime = moment.duration(now.diff(created));
                return {
                    id: p.pm_id,
                    group: p.name.split("_")[0],
                    name: p.name,
                    status: p.pm2_env.status,
                    created: created,
                    uptime: uptime,
                    restarts: p.pm2_env.restart_time
                };
            });

            // const groups = handlers.groupBy(pm2list, group => group.group);
            // console.log(`groups = ${JSON.stringify(groups)}`);

            const tableElements = pm2list.map((p) =>{
                return `<tr><td><label class="process"><input type="checkbox" class="smooth" name="${p.name}"></label></td><td>${p.group}</td><td>${p.id}</td><td>${p.name}</td><td>${p.status}</td><td>${p.created.format("HH:mm:ss YYYY-MM-DD")}</td><td>${p.uptime.hours()}h${p.uptime.minutes()}m${p.uptime.seconds()}s</td><td>${p.restarts}</td></tr>`;
            }).join("");

            const status = `<div class="block"><form action="/stop" method="post" onsubmit="${handlers.reloadWindow(1600)}"><table><tr><th></th><th>group</th><th>id</th><th>name</th><th>status</th><th>created</th><th>uptime</th><th>restarts</th></tr>${tableElements}</table><br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>`;

            res.send(`<!DOCTYPE html><html><head><title>Simple Record | Controls</title><style>${min.css}</style></head><body>${record}${status}</body></html>`);
            return pm2.disconnect();
        });
    });
});

app.post("/", (req, res) => {
    const deviceIds = Object.keys(req.body);

    if (deviceIds.length > 0) {
        const now = moment();
        const group = handlers.uuid();
        const dir = `${settings.baseDir}/${group}_${now.format("YMMDD-HHmmss")}`;
        
        const baseDirAvailable = handlers.createDirectory(settings.baseDir);
        const dirAvailable = handlers.createDirectory(dir);
        const logDirAvailable = handlers.createDirectory(`${dir}/logs`);

        if (baseDirAvailable && dirAvailable && logDirAvailable) {
            pm2.connect((error) => {
                if (error) {
                    console.error(error);
                    return pm2.disconnect();
                }
                
                deviceIds.forEach((id) => {
                    const name = `${group}_${id}`;
                    const str = handlers.mkRecordString(id);
                    const cmd = str.replace(/__GROUP__/g, name);
                    
                    handlers.recordEvent({path: `${dir}/logs/${name}-events.csv`, ts: moment().format("x"), label: "pm2.start"});
                    console.log((`starting ${name}`))
                    pm2.start({
                        name: name,
                        script: `./js/utilities/record.js`,
                        args: [cmd, name],
                        cwd: dir,
                        output: `./logs/${name}-out.log`,
                        error: `./logs/${name}-error.log`,
                        minUptime: 500,
                        restartDelay: 500
                    },
                    (error) => {
                        if (error) console.error(error);
                        return pm2.disconnect();
                    });
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
            // handlers.recordEvent({path: `${dir}/logs/${name}-events.csv`, ts: moment().format("x"), label: "pm2.delete called"});
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