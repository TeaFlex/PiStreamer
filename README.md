# PiStreamer 🎥

PiStreamer is a nodeJS module that allows streaming the raspberry pi camera module output over websocket to a webpage using a modified version of [131/h264-live-player](https://github.com/131/h264-live-player).

[![License](https://img.shields.io/badge/license-ISC-green.svg)](http://opensource.org/licenses/ISC) [![NPM version](https://img.shields.io/npm/v/pistreamer.svg?style=flat)](https://npmjs.com/package/pistreamer) [![NPM downloads](https://img.shields.io/npm/dm/pistreamer.svg?style=flat)](https://npmjs.com/package/pistreamer)

## Origin

PiStreamer has been created due to a need of a streaming module for my end-of-studies work. When looking for a suitable one that could fulfill my expectations, I've found the amazing [131's repository](https://github.com/131/h264-live-player). I reworked and simplified the server side in Typescript ~~and modded the client decoder~~ (not anymore!!) according to my needs.

## Installation

```
npm i pistreamer
```

## Example

To run an example of the project, enter the following commands:
```
git clone https://github.com/TeaFlex/PiStreamer.git
cd PiStreamer
npm i
npm run test
```

## Usage
  
Server configuration:
```js 
const http = require('http');
const {createClient, createServer} = require('pistreamer');
const port = 8000;
/*
Create a server with an instance of PiStreamerServer with
the given options. Here, it will stream a 244x352 video at 15 fps, 
the stream will end if there's no viewers left and there's a limit of 5 viewers.
*/
const piStreamer = createServer(http,{
	fps: 15,
	height: 244,
	width: 352,
	dynamic: true,
	limit: 5
});

//Put some routing here

piStreamer.listen(port, () => {
	//create a 131-http-live-player-mod.js file in your static folder.
	createClient('./some-static-folder');
	console.log(`App running and listening to port ${port}`);
});
```

Client configuration:
```html
<!--Call the script that you generated earlier.-->
<script src="/http-live-player.js"></script>

```

```js
var canvas = document.createElement("canvas");
//Pass a canvas to de decoder.
var player = new WSAvcPlayer(canvas, "webgl", 1, 35);
//Connect to your server.
player.connect('ws://your-ip-or-domain-name');
window.player = player;

//Call any function of the player.
document.getElementById('startStream').addEventListener('click', () => {
    player.playStream();
    document.body.appendChild(canvas);
});
document.getElementById('stopStream').addEventListener('click', () => {
    player.stopStream();
    document.body.removeChild(canvas);
});
document.getElementById('disconnect').addEventListener('click', () => {
    player.disconnet();
    document.body.removeChild(canvas);
});
```

If you want to send personnalized messages, you can also do like this:

```js
var canvas = document.createElement("canvas");
var player = new WSAvcPlayer(canvas, "webgl", 1, 35);
player.connect('ws://your-ip-or-domain-name');
//We take the ws client from the player;
var wsClient = player.ws;
window.player = player;

document.getElementById('myaction').addEventListener('click', () => {
    wsClient.send("my personnalized action");
});

//*Do stuff with player methods*
```

## Documentation

You can access the documentation of PiStreamer there:
- [English doc :uk:](/doc/DOCUMENTATION-en.md)
- [French doc :fr:](/doc/DOCUMENTATION-fr.md)

## Credits

* [131](https://github.com/131)
* [131/http-live-player](https://github.com/131/h264-live-player)