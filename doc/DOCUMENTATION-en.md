# Documentation (English)

##   Table of Contents
 - [PistreamServer](#pistreamserver---class)
 - [createServer()](#createserver---function)
 - [createClient()](#createclient---function)
 - [StreamOptions](#streamoptions---interface)
 -  [VideoOptions](#videooptions---interface)
 - [ImageEffects](#imageeffects---enum)

## PiStreamServer - [class]
### Fields
|Modifier|  Name | Type | Comment |
|--|--|--|--|
|static | log| winston.Logger | Static logger of PiStreamer. You can change the logger by giving a winston.Logger object.
|private | buffer | Buffer | - |
|private | streamer?|child_process.ChildProcessWithoutNullStreams / null | - |
|private | readStream? | stream.Readable / null| - |
|private | wsServer | ws.Server | Instance of WebSocket server.|
|private |options|PiStreamer.StreamOptions|Options of the stream, including video options and other features.|
|private readonly| defaultOptions| PiStreamer.StreamOptions| Default values for the stream.|
### Functions

|Modifier|  Name | Parameters | Returned value |Comment |
|--|--|--|--|--|
|protected|stopFeed|-|void|Stop the feed and kill the raspivid process.|
|protected|startFeed|-|void|Start the feed by creating one if there's none or by continuing the existant one.|
|protected|createFeed|-|void|Create a new feed by starting a new raspivid process.|
|protected|boradcast|data: any|void|Broadcast the feed to all the websocket client connected.|
|protected|newClient|socket: ws|void|Actions done when a new client is connected.|

### Methods
|Modifier|  Name | Parameters | Returned value |Comment |
|--|--|--|--|--|
|public|setOptions|options: PiStreamer.StreamOptions|void|Set the options of the stream.|

## createServer - [function]
Creates an instance of PiStreamServer and returns the Http server linked to it.
### Parameters
- requestListener : *http.RequestListener* - Request listener.
- video? : PiStreamer.StreamOptions - Options of the stream.
### Return
- *http.Server*

## createClient - [function]
Copy the client file "http-live-player.js" to the given path.
### Parameters
- path : *string* - Path of the target folder.
### Return
- *void*

## StreamOptions - [interface]
|Field name| Type | Comment |
|--|--|--|
|videoOptions?|PiStreamer.VideoOptions|Options relative to the video output.|
|dynamic?|boolean|Set the dynamic stop of the stream. If the value is true, the stream will stop by itself if there's no viewer left.|
|limit?|int|Set the limit of viewers.|

## VideoOptions - [interface]
|Field name| Type | Comment |
|--|--|--|
|height?|int|Height of the image.|
|width?|int|Width of the image.|
|framerate?|int|Framerate of the video.|
|hFlip?|boolean|Flips the image horizontally if true.|
|vFlip?|boolean|Flips the image vertically if true.|
|brightness?|int|Brightness of the video.|
|contrast?|int|Contrast of the video.|
|sharpness?|int|Sharpness of the video.|
|saturation?|int|Saturation of the video.|
|imxfx?|PiStreamer.ImageEffects|Image effect applied the video.|

## ImageEffects - [enum]
Values that can be used to apply an effect to the image of the video. Some effects may not work properly, this entirely depends of the actual version of raspivid. 
### Values: 
-   none: no effect (default)
-   negative: invert the image colours
-   solarise: solarise the image
-   posterise: posterise the image
-   whiteboard: whiteboard effect
-   blackboard: blackboard effect
-   sketch: sketch effect
-   denoise: denoise the image
-   emboss: emboss the image
-   oilpaint: oil paint effect
-   hatch: hatch sketch effect
-   gpen: graphite sketch effect
-   pastel: pastel effect
-   watercolour: watercolour effect
-   film: film grain effect
-   blur: blur the image
-   saturation: colour saturate the image
-   colourswap: not fully implemented
-   washedout: not fully implemented
-   colourpoint: not fully implemented
-   colourbalance: not fully implemented
-   cartoon: not fully implemented

Source: [Raspivid documentation](https://www.raspberrypi.org/documentation/raspbian/applications/camera.md).