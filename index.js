const express = require('express');
const app = express();
const http = require('http').createServer(app)
const port = 8070;
const Stream_server = require('./lib/stream_server');
const stream = new Stream_server(http,{
    fps:15,
    height: 360,
    width: 640
});

app.set('view engine', 'ejs');
app.use(express.static('static_files'));

app.get("/", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.render("index");
});

http.listen(port, () =>{
    console.clear();
    console.log(`App running and listening to port ${port}`);
});