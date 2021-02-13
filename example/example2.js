const express = require('express');
const app = express();
const port = 8070;
const server = require('http').createServer(app);
const {PiStreamServer} = require('pistreamer');
const ws = require('ws');
const ws_server = new ws.Server({server});
const stream = new PiStreamServer(ws_server);

app.use(express.static('public'));

ws_server.on("connection", (socket) => {
    socket.on("message", (data) => {
        if(data === "CustomEvent"){
            console.log("Wow a custom event !!!");
        }
    })
});

server.listen(port, () => {
    console.clear();
    console.log(`App running and listening to port ${port}`);
});