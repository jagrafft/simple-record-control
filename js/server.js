const app = require('express')();
const bodyParser = require('body-parser');
const moment = require('moment');
const pm2 = require('pm2');

const handlers = require('./handlers');
const min = require('./resources/css.json');
const settings = require('./resources/settings.json');

const baseRecordDirectory = handlers.createDirectory(settings.general.baseDir);
if (!baseRecordDirectory) {
    console.log('Problem creating "' + baseRecordDirectory + '", please investigate. Exiting...');
    process.exit(0);
}

app.use(bodyParser.urlencoded({ extended: true }));

const formReload = 'onsubmit="setTimeout(function(){window.location.reload();},10)"';

app.get('/', (req, res) => {
    pm2.connect((error) => {
        if (error) {
            console.error('error: ' + error);
            res.send('<!DOCTYPE html><html><head><title>Simple Record | Error</title></head><body><h1>PM2 Connection Error</h1></body></html>')
            return pm2.disconnect();            
        }

        const devices = handlers.getSource().map((s) => {
            return '<label class="device"><input type="checkbox" class="smooth" name="' + s.id + '">' + s.name + '</label>';
        }).join("");
        
        // TODO Indicate SUCCESS/FAILURE on page
        const record = '<div class="block"><form method="post" ' + formReload + '>' + devices + '<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>';
        
        // TODO Implement fail strategy
        pm2.list((error, processDescriptionList) => {
            // TODO Build PM2 list
            const pm2list = '';
            const status  = '<div class="block"><form action="/stop" method="post" ' + formReload + '>' + pm2list + '<br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>';
            
            res.send('<!DOCTYPE html><html><head><title>Simple Record | Controls</title><style>' + min.css + '</style></head><body>' + record + status + '</body></html>');
            return pm2.disconnect();
        });
    });
});

app.post('/', (req, res) => {
    let deviceIds = [];
    for (let key in req.body) {
        deviceIds.push(key);
    }

    if (deviceIds.length > 0) {
        const now = moment();
        const dir = settings.general.baseDir + '/' + now.format('YMMDD-HHmmss');
        const dirAvailable = handlers.createDirectory(dir);

        if (dirAvailable) {
            pm2.connect((error) => {
                if (error) {
                    console.error(error);
                    return pm2.disconnect();
                }

                const name = handlers.uuid();
                console.log("starting " + name);
                
                pm2.start({
                    script: './js/record.js', 
                    name: name,
                    cwd: dir,
                    restartDelay: 500,
                    args: [name].concat(deviceIds)
                },
                // TODO Wait for success/failure response
                // 2. if OK =>
                // res.status(202);
                // res.send('{ "status" : "recording" }'); ??
                // else =>
                // res.status(500);
                // ... ?
                (error, app) => {
                    if (error) console.error(error);
                    return pm2.disconnect();
                });
            });
        } else {
            console.error('Cannot create directory "' + dir + '"');
        }
    } else {
        console.log('empty request');
    }
});

// TODO stop selected && stop all via PM2
app.post('/stop', (req, res) => {
    // pm2.connect((error) => {
        // console.log('stopping ' + proc);
        // pm2.stop(proc, (error) => {
            // if (error) console.error(error);
            // pm2.disconnect();
        // });
    // });
    res.send("STOP");
});

app.listen(3000, () => console.log('listening on port 3000...'));