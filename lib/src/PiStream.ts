import ws from 'ws';
import merge from 'lodash.merge';
import {spawn, ChildProcessWithoutNullStreams} from 'child_process';
import fs from 'fs';
import http from 'http';
import {join} from 'path';
import stream from 'stream';
import winston from 'winston';
import {logger} from './Notifications'
import { StreamOptions } from './interfaces/StreamOptions';
import { ImageEffects } from './enums/ImageEffects';
import { VideoOptions } from './interfaces/VideoOptions';
const Splitter = require('stream-split');

export class PiStreamServer {

    /**
     * Static logger of PiStreamer. You can change the logger by giving 
     * a winston.Logger object.
     * ```ts
     * PiStreamServer.log = winston.createLogger(...);
     * ```
     */
    static log: winston.Logger = logger;
    private buffer: Buffer = Buffer.from([0,0,0,1]);
    private streamer?: ChildProcessWithoutNullStreams | null;
    private readStream?: stream.Readable | null;
    private streamClients: Array<ws>;
    private wsServer: ws.Server;
    private options: StreamOptions;
    private readonly defaultOptions: StreamOptions = {
        videoOptions: {
            height: 240,
            width: 480,
            framerate: 12,
            imxfx: ImageEffects.none,
            brightness: 50,
            saturation: 50, 
            sharpness: 50,
            contrast: 50
        },
        dynamic: true,
        limit: 0
    }

    /**
     * PiStreamServer constructor.
     * @param wsServer - Instance of a websocket server.
     * @param options - Options of the stream.
     */
    constructor(wsServer: ws.Server, options?: StreamOptions) {
        this.streamClients = [];
        this.options = merge(this.defaultOptions, options);
        this.wsServer = wsServer;
        this.wsServer.on('connection', this.newClient);
        this.setOptions.bind(this);
    }

    /**
     * Set the options of the stream.
     * @param options 
     */
    public setOptions(options: StreamOptions) {
        this.options = merge(this.defaultOptions, options);
    }

    /**
     * Stop the feed and kill the raspivid process.
     */
    protected stopFeed = () => {
        process.kill(-this.streamer!.pid);
        this.streamer = null;
        this.readStream = null;
    }

    /**
     * Start the feed by creating one if there's none or by continuing the existant one.
     */
    protected startFeed = () => {
        if(this.readStream == null || this.readStream == undefined)
            this.createFeed();
        
        var rStream = this.streamer!.stdout;
        rStream = rStream.pipe(new Splitter(this.buffer));
        rStream.on('data', this.broadcast);
        this.readStream! = rStream;
    }

    /**
     * Create a new feed by starting a new raspivid process.
     */
    protected createFeed = () => {
        var opts: Array<any> = ['-t', '0', '-o', '-', '-pf', 'baseline'];
        var opt: keyof VideoOptions;
        for(opt in this.options.videoOptions) {
            var current = this.options.videoOptions![opt];
            opts.push(`--${opt.toLowerCase()}`);
            if(opt == "imxfx")
                opts.push(ImageEffects[<number>current])
            else if(opt != "vFlip" && opt != "hFlip")
                opts.push(current);
        }
        
        PiStreamServer.log.info(`Start of stream !`);

        this.streamer = spawn('raspivid', opts, {detached: true});

        this.streamer.on('error', (error) => {
            PiStreamServer.log.error(error.message);
        })
        
        this.streamer!.on('exit', (code) => {
            var msg = (code === null)? 'Stream Exit' : `Failure code ${code}`;
            PiStreamServer.log.log((code === null)? 'info': 'error', msg);
        });
    }

    /**
     * Broadcast the feed to all the websocket client connected.
     * @param data - Video stream.
     */
    protected broadcast = (data: any) => {
        this.streamClients.forEach((socket: any) => {
            if(socket.buzy)
                return;

            socket.buzy = true;
            socket.buzy = false;

            socket.send(Buffer.concat([this.buffer, data]), { binary: true}, function ack(error: any) {
                socket.buzy = false;
            });
        });
    }

    /**
     * Actions done when a new client is connected.
     * @param socket - Client socket.
     */
    protected newClient = (socket: ws) => {
        var userLimit = (this.options.limit! > 0)? this.options.limit! : 0;
        var condition = (userLimit == 0)? true : (this.wsServer.clients.size <= userLimit);
        var self = this;
        

        if(condition) {
            this.streamClients.push(socket);

            PiStreamServer.log.info(`Someone just connected ! (${self.wsServer.clients.size} user(s) online.)`);

            socket.send(JSON.stringify({
                action: "init",
                width: self.options.videoOptions!.width,
                height: self.options.videoOptions!.height
            }));

            socket.on('close', () => {
                PiStreamServer.log.info(`Someone just left. (${self.wsServer.clients.size} user(s) online.)`);
                if(self.streamer != null)
                    self.readStream!.destroy();
                
                if(self.options.dynamic) {
                    if(self.wsServer.clients.size == 0 && self.streamer != null)
                        self.stopFeed();
                }
            });

            socket.on("message", (data: any) => {
                var cmd = "" + data, action = data.split(' ')[0];
                var validAction: boolean = true;
                //All of these actions are executed for all the connected users !
                try {
                    switch(action){
                        //Start the stream
                        case "REQUESTSTREAM":
                            if(self.streamer != null && self.streamer != undefined)
                                throw "A stream already exists.";
                            self.startFeed();
                        break;
                        
                        //Stop the stream
                        case "STOPSTREAM":
                            if(self.streamer == null || self.streamer == undefined)
                                throw "There's no stream to stop.";
                            self.stopFeed();
                        break;
        
                        //Toggle pause the stream
                        case "clientPAUSESTREAM":
                            if(self.streamClients.includes(socket)) {
                                var id = self.streamClients.indexOf(socket);
                                self.streamClients.splice(id-1,1);
                            }
                            else
                                self.streamClients.push(socket);  
                        break;
        
                        case "globalPAUSESTREAM":
                            if(self.streamer == null || self.streamer != undefined)
                                throw "There's no stream to pause.";
                            if(self.readStream!.isPaused())                        
                                self.readStream!.read()
                            else
                                self.readStream!.pause()
                        break;
                        
                        default:
                            validAction = false;
                            break;
                    }
                    if(validAction)
                        PiStreamServer.log.info(`Action incoming: ${action}`);
                } 
                catch (error) {
                    PiStreamServer.log.error(error);
                }
            });
        }
    }
}

/**
 * Creates an instance of PiStreamServer and returns the Http server linked to it. 
 * @param requestListner - Request listener.
 * @param video - Options of the stream.
 */
export const createServer = (requestListener: http.RequestListener, video?: StreamOptions): http.Server => {
    var server = http.createServer(requestListener);
    var stream = new PiStreamServer(new ws.Server({server}), video);
    return server;
}

/**
 * Copy the client file "http-live-player.js" to the given path.
 * @param path - Path of the target folder.
 */
export const createClient = (path='.') => {
    try {
        var file = 'http-live-player.js';
        if(fs.existsSync(path))
            fs.createReadStream(join(__dirname, '../../vendor/'+file)).pipe(fs.createWriteStream(join(path, file)));
    } 
    catch (error) {
        PiStreamServer.log.error(error);
    }
}
