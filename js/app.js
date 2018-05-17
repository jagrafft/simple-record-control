/*global require*/
/*jslint es6*/

const bodyParser = require("body-parser");
const fs = require("fs");
const https = require("https");
const moment = require("moment");
const pm2 = require("pm2");
const WebSocket = require("ws");

const handlers = require("./utilities/handlers.js");
const html_addons = require("./resources/html_addons.json");
const options = {
    key: fs.readFileSync("./js/resources/certs/demo-key.pem", "utf8"),
    cert: fs.readFileSync("./js/resources/certs/demo-cert.pem", "utf8")
};
const settings = require("./resources/settings.json");

const app = require("express")(options);
const server = https.createServer(options, app);
const wss = new WebSocket.Server({server});

// PUNCH LIST
// TODO Communicate PM2 status via WebSocket.
// TODO Improve custom logger. (Piggyback on WS circuit.)
// TODO Terminate all active processes on shutdown. (and/or crash?)
// TODO Improve JSON preset formats.
// TODO Implement code tests.
// TODO Implement recovery method(s) for unclosed files.
// TODO Merge ffmpegRecordString() and gstRecordString()

if (settings.utility != "ffmpeg" && settings.utility != "gstreamer") {
    console.error(`Supported utilities are FFmpeg ("ffmpeg") and GStreamer ("gstreamer").\nCurrently settings.utility == ${settings.utility}\nPlease edit ./js/resources/settings.json appropriately.\nExiting...`);
    process.exit(0);
}

const baseRecordDirectory = handlers.createDirectory(settings.baseDir);
if (!baseRecordDirectory) {
    console.error(`Problem creating ${baseRecordDirectory}, please investigate. Exiting...`);
    process.exit(0);
}

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        console.log(`(wss) msg = ${msg}`);
    });
    ws.send("w00t");
});

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
        const record = `<div class="block"><form method="post" onsubmit="${handlers.reloadWindow(400)}">${devices}<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>`;

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

            const groups = handlers.groupBy(pm2list, group => group.group);

            const unorderedList = Object.entries(groups).map((p) => {
                const [group, ...procs] = p;
                const procsListItems = procs[0].map((p) => { return `<li><label class="process"><input type="checkbox" class="smooth" name="${p.name}">${p.id} | ${p.name} | ${p.status} | ${p.created.format("HH:mm:ss YYYY-MM-DD")} | ${p.uptime.hours()}h${p.uptime.minutes()}m${p.uptime.seconds()}s | ${p.restarts}</label></li>`; }).join("");
                return `<li><span onclick="const nodes = document.getElementById('${group}');nodes.childNodes.forEach((n) => { const node = n.childNodes[0].childNodes[0]; node.checked = !node.checked; console.log(node.name);});">${group}</span><ul id="${group}">${procsListItems}</ul></li>`;
            }).join("");

            const status = `<div class="block"><form action="/stop" method="post" onsubmit="${handlers.reloadWindow(1800)}"><ul>${unorderedList}</ul><br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>`;

            const instructions = `<div class="block"><h3>Instructions</h3><ul><li>Click on parent (•) label to select children.</li><li><strong>stop</strong> with no checkboxes selected stops all processes.</li></ul></div>`;

            res.send(`<!DOCTYPE html><html><head><title>Simple Record | Controls</title><style>${html_addons.css}</style></head><body>${record}${status}${instructions}<script type="text/javascript">${html_addons.js}</script></body></html>`);
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

server.listen(3000, () => {
    console.log("listening on port 3000...");
    setInterval(() => {
        wss.clients.forEach((client) => {
            client.send(JSON.stringify({ w00t: moment().format("X") }));
        });
    }, 1000);
});