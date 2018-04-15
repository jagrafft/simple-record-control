/*jslint es6 */
const app = require("express")();
const bodyParser = require("body-parser");
const pm2 = require("pm2");

const handlers = require("./handlers");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const sourceIdInputs = handlers.getSource().map((s) => {
        const checkbox = '<input type="checkbox" name="' + s.id + '">';
        const label = '<label for="' + s.name + '">' + s.name + '</label>';
        return checkbox + label;
    }).join("");
    
    // TODO Refresh page on successful POST
    const sourceSelectForm = '<form method="post">' + sourceIdInputs + '<br><input type="submit" value="record"></form>';
    
    // const status = "";
    
    res.send(sourceSelectForm);
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
    res.send("STOP");
});

app.listen(3000, () => console.log("listening on port 3000..."));