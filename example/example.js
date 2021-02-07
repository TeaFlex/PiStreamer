const express = require('express');
const app = express();
const port = 8070;
const {createClient, createServer, ImageEffects} = require('pistreamer')
const piStream = createServer(app, {
    videoOptions: {
        framerate: 25,
        height: 244,
        width: 352,
        imxfx: ImageEffects.colourswap,
        vFlip: true
    }
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.render("index");
});

piStream.listen(port, () => {
    console.clear();
    createClient('./public');
    console.log(`App running and listening to port ${port}`);
});