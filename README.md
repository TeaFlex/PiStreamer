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
  
### Server configuration:
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
	videoOptions: {
		framerate: 15,
		height: 244,
		width: 352
	},
	dynamic: true,
	limit: 5
});

//Put some routing here

piStreamer.listen(port, () => {
	console.log(`App running and listening to port ${port}`);
});
```

### Client configuration:

The client-side depends on the [ts-h264-live-player]() package.
To correctly configure the client, please refer to the [ts-h264-live-player documentation](https://github.com/TeaFlex/ts-h264-live-player).

## Documentation

You can access the documentation of PiStreamer there:
- [English doc :uk:](/doc/DOCUMENTATION-en.md)
- [French doc :fr:](/doc/DOCUMENTATION-fr.md)

## Credits

* [131](https://github.com/131)
* [131/http-live-player](https://github.com/131/h264-live-player)