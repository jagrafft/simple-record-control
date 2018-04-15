/*jslint es6 */

const app = require("express")();
const bodyParser = require("body-parser");
const pm2 = require("pm2");

const handlers = require("./handlers");
const min = require("./config/css.json");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const devices = handlers.getSource().map((s) => {
        return '<label class="device"><input type="checkbox" class="smooth" name="' + s.id + '">' + s.name + '</label>';
    }).join("");
    
    // TODO Refresh page on successful POST
    const record = '<div class="block"><form method="post">' + devices + '<p><input class="btn btn-b smooth" type="submit" value="record"></p></form></div>';
    
    // const processes = handlers.getStatus().map((s) => {
        // ...
    // }).join("");
    const processes = '<input type="text" name="w00t"><select name="selecting"><option value=0>zero</option><option value=1>one</option><option value=2>two</option><option value=3 selected>three</option><option value=4>four</option></select>';

    const status  = '<div class="block"><form action="/stop" method="post">' + processes + '<br><input class="btn btn-c smooth" type="submit" value="stop"></form></div>';
    
    res.send('<html><head><title>Simple Record | Controls</title><style>' + min.css + '</style></head><body>' + record + status + '</body></html>');
});

app.post("/", (req, res) => {
    console.log(req.body);
    // 1. Start pm2 process(es)
    // 2. if OK =>
    res.status(202);
    // res.send('{ "status" : "recording" }'); ??
    // else =>
    // res.status(500);
    // ... ?
});

app.post("/stop", (req, res) => {
    console.log("!STOP");
    console.log(req.body);
    // res.send("STOP");
});

app.listen(3000, () => console.log("listening on port 3000..."));