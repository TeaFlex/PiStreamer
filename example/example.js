const express = require('express');
const app = express();
const port = 8070;
const stream = require('pistreamer').createServer(app, {
    fps: 24,
    height: 244,
    width: 352
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.render("index");
});

stream.listen(port, () => {
    console.clear();
    require('pistreamer').createClient('./public');
    console.log(`App running and listening to port ${port}`);
});