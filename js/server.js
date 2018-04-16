/*jslint es6 */

const app = require('express')();
const bodyParser = require('body-parser');
const moment = require('moment');
const pm2 = require('pm2');
const handlers = require('./handlers');
const min = require('./resources/css.json');

const recordDir = handlers.checkRecordDir();
const formReload = 'onsubmit="setTimeout(function(){window.location.reload();},10)"';

if (!recordDir) {
    console.log('Problem creating ./recordings, please investigate. Exiting...');
    process.exit(0);
}

// TODO Replace with PM2 list
let processes = {};

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const devices = handlers.getSource().map((s) => {
        return '<label class="device"><input type="checkbox" class="smooth" name="' + s.id + '">' + s.name + '</label>';
    }).join("");
    
    // TODO Refresh page on SUCCESS
    const record = '<div class="block"><form method="post" ' + formReload + '>' + devices + '<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>';
    
    // const pm2list = handlers.getStatus().map((s) => {
        // ...
    // }).join("");
    const pm2list = '';

    const status  = '<div class="block"><form action="/stop" method="post" ' + formReload + '>' + pm2list + '<br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>';
    
    res.send('<html><head><title>Simple Record | Controls</title><style>' + min.css + '</style></head><body>' + record + status + '</body></html>');
});

app.post("/", (req, res) => {
    let deviceIds = [];
    for (let key in req.body) {
        deviceIds.push(key);
    }
    
    if (deviceIds.length > 0) {
        pm2.connect((error) => {
            if (error) {
                console.error(error);
                return pm2.disconnect();
            }

            const now = moment();
            let name = handlers.uuid();
            console.log("starting " + name);

            pm2.start({
                script: './js/record.js', 
                name: name,
                args: deviceIds
            },
            // TODO Wait for success/failure response
            (error, app) => {
                if (error) {
                    console.error(error);
                } else {
                    processes[name] = { 
                        time: now.format("X"),
                        sources: deviceIds,
                        lastChecked: now,
                        status: "online"
                    };
                }

                return pm2.disconnect();
            });
        });
        // 2. if OK =>
        res.status(202);
        // res.send('{ "status" : "recording" }'); ??
        // else =>
        // res.status(500);
        // ... ?
    } else {
        console.log("empty request");
    }
});

// TODO stop selected && stop all
// STOPS ALL ACTIVE processes
app.post("/stop", (req, res) => {
    for (proc in processes) {
        console.log("stopping " + proc);
        pm2.stop(proc, (error) => {
            if (error) console.error(error);
        });
    }
    processes = {};
    // res.send("STOP");
});

app.listen(3000, () => console.log("listening on port 3000..."));