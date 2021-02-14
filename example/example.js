const express = require('express');
const app = express();
const port = 8070;
const {createServer, createClient, ImageEffects} = require('pistreamer')
const piStream = createServer(app, {
    videoOptions: {
        framerate: 25,
        height: 244,
        width: 352,
        imxfx: ImageEffects.colourswap,
        vFlip: true
    }
});

app.use(express.static('public'));

piStream.listen(port, () => {
    console.clear();
    createClient('./public');
    console.log(`App running and listening to port ${port}`);
});