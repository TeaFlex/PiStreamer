const express = require('express');
const app = express();
const http = require('http').createServer(app)
const io = require('socket.io')(http);
const port = 8070;
const {spawn} = require('child_process');

app.set('view engine', 'ejs');
app.use(express.static('static_files'));

app.get("/", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.render("index");
});

io.of('/').on('connect', (socket) => {
    console.log("Someone has appeared !");
    socket.on('startStream', ()=>{
        var stream = spawn('raspivid', ['--nopreview', '-w', '640', '-h', '480', '-fps', '12', ''])
    });
});

http.listen(port, () =>{
    console.log(`App running and listening to port ${port}`);
});