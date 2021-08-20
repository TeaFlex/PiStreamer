import { Server as WsServer } from 'ws';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import http from 'http';
import { join } from 'path';
import stream from 'stream';
import winston from 'winston';
import { logger } from './utils/logger'
import { ImageEffects } from './enums';
import { 
    VideoOptions, 
    WsClient, 
    StreamOptions 
} from './interfaces';
import Splitter from 'stream-split';

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
    private streamClients: WsClient[];
    private wsServer: WsServer;
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
    constructor(wsServer: WsServer, options?: StreamOptions) {
        this.streamClients = [];
        this.options = { 
            ...this.defaultOptions, 
            ...options
        };
        this.wsServer = wsServer;

        this.setOptions = this.setOptions.bind(this);
        this.stopFeed = this.stopFeed.bind(this);
        this.startFeed = this.startFeed.bind(this);
        this.createFeed = this.createFeed.bind(this);
        this.broadcast = this.broadcast.bind(this);
        this.newClient = this.newClient.bind(this);

        this.wsServer.on('connection', this.newClient);
    }

    /**
     * Set the options of the stream.
     * @param options 
     */
    public setOptions(options: StreamOptions) {
        this.options = {
            ...this.defaultOptions, 
            ...options
        };
    }

    /**
     * Stop the feed and kill the raspivid process.
     */
    protected stopFeed() {
        if(this.streamer)
            process.kill(-this.streamer.pid);
        this.streamer = null;
        this.readStream = null;
    }

    /**
     * Start the feed by creating one if there's none or by continuing the existant one.
     */
    protected startFeed() {
        if(!this.readStream)
            this.createFeed();
        
        let rStream = this.streamer!.stdout;
        rStream = rStream.pipe(new Splitter(this.buffer));
        rStream.on('data', this.broadcast);
        this.readStream! = rStream;
    }

    /**
     * Create a new feed by starting a new raspivid process.
     */
    protected createFeed() {
        const opts: string[] = ['-t', '0', '-o', '-', '-pf', 'baseline'];
        let opt: keyof VideoOptions;
        for(opt in this.options.videoOptions) {
            const current = this.options.videoOptions![opt];
            opts.push(`--${opt.toLowerCase()}`);
            if(opt === "imxfx")
                opts.push(ImageEffects[current as number])
            else if(opt !== "vFlip" && opt !== "hFlip")
                opts.push(String(current));
        }
        
        PiStreamServer.log.info(`Start of stream !`);

        this.streamer = spawn('raspivid', opts, {detached: true});

        this.streamer.on('error', (error) => {
            PiStreamServer.log.error(error.message);
        });
        
        this.streamer.on('exit', (code) => {
            const msg = (!code)? 'Stream Exit' : `Failure code ${code}`;
            PiStreamServer.log.log((!code)? 'info': 'error', msg);
        });
    }

    /**
     * Broadcast the feed to all the websocket client connected.
     * @param data - Video stream.
     */
    protected broadcast(data: any) {
        for (const socket of this.streamClients) {
            if(socket.buzy)
                return;

            socket.buzy = true;
            socket.buzy = false;

            socket.send(Buffer.concat([this.buffer, data]), 
            { 
                binary: true,
                compress: true
            }, 
            (error) => {
                socket.buzy = false;
            });
        }
    }

    /**
     * Actions done when a new client is connected.
     * @param socket - Client socket.
     */
    protected newClient(socket: WsClient) {
        const userLimit = (this.options.limit! > 0)? this.options.limit! : 0;
        const condition = (!userLimit)? true : (this.wsServer.clients.size <= userLimit);

        if(condition) {
            this.streamClients.push(socket);

            PiStreamServer.log.info(`Someone just connected ! (${this.wsServer.clients.size} user(s) online.)`);

            socket.send(JSON.stringify({
                action: "init",
                width: this.options.videoOptions!.width,
                height: this.options.videoOptions!.height
            }));

            socket.on('close', () => {
                PiStreamServer.log.info(`Someone just left. (${this.wsServer.clients.size} user(s) online.)`);
                if(this.streamer != null)
                    this.readStream!.destroy();
                
                if(this.options.dynamic) {
                    if(this.wsServer.clients.size && this.streamer)
                        this.stopFeed();
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
                            if(this.streamer)
                                throw "A stream already exists.";
                            this.startFeed();
                        break;
                        
                        //Stop the stream
                        case "STOPSTREAM":
                            if(!this.streamer)
                                throw "There's no stream to stop.";
                            this.stopFeed();
                        break;
        
                        //Toggle pause the stream
                        case "clientPAUSESTREAM":
                            if(this.streamClients.includes(socket)) {
                                //TODO: make it work
                                var id = this.streamClients.indexOf(socket);
                                this.streamClients.splice(id-1,1);
                            }
                            else
                                this.streamClients.push(socket);  
                        break;
        
                        case "globalPAUSESTREAM":
                            if(!this.streamer)
                                throw "There's no stream to pause.";
                            else if(this.readStream!.isPaused())                        
                                this.readStream!.read()
                            else
                                this.readStream!.pause()
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
    const server = http.createServer(requestListener);
    const stream = new PiStreamServer(new WsServer({server}), video);
    return server;
}
