const express = require('express');
const app = express();
const port = 8070;
const server = require('http').createServer(app);
const {PiStreamServer, createClient} = require('pistreamer');
const ws = require('ws');
const ws_server = new ws.Server({server});
const stream = new PiStreamServer(ws_server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.render("index");
});

server.listen(port, () => {
    console.clear();
    createClient('./public');
    console.log(`App running and listening to port ${port}`);
});