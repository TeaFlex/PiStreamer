import ws from 'ws';
import merge from 'lodash.merge';
import {spawn, ChildProcessWithoutNullStreams} from 'child_process';
import fs from 'fs';
import http from 'http';
import {join} from 'path';
import {Options} from './Options'
import stream from 'stream';
import winston, { log } from 'winston';
import {logger} from './Notifications'
const Splitter = require('stream-split');

export class PiStreamServer {

    static log: winston.Logger = logger;
    private buffer: Buffer = Buffer.from([0,0,0,1]);
    private streamer?: ChildProcessWithoutNullStreams | null;
    private readStream?: stream.Readable | null;
    private streamClients: Array<ws>;
    private wsServer: ws.Server;
    private options: Options;
    private readonly defaultOptions: Options = {
        height: 240,
        width: 480,
        fps: 12,
        dynamic: true,
        limit: 0
    }

    constructor(wsServer: ws.Server, options?: Options) {
        this.streamClients = [];
        this.options = merge(this.defaultOptions, options);
        this.wsServer = wsServer;
        this.wsServer.on('connection', this.newClient);
    }

    stopFeed = () => {
        process.kill(-this.streamer!.pid);
        this.streamer = null;
        this.readStream = null;
    }

    startFeed = () => {
        if(this.readStream == null || this.readStream == undefined)
            this.getFeed();
        
        var rStream = this.streamer!.stdout;
        rStream = rStream.pipe(new Splitter(this.buffer));
        rStream.on('data', this.broadcast);
        this.readStream! = rStream;
    }

    getFeed = () => {
        PiStreamServer.log.info(`Beginning to stream ${this.options.width}x${this.options.height} output at ${this.options.fps}FPS.`);
        var opts: Array<any> = ['-t', '0', '-o', '-', '-w', 
        this.options.width, '-h', this.options.height, 
        '-fps', this.options.fps, '-pf', 'baseline', '-vf'];
        this.streamer = spawn('raspivid', opts, {detached: true});
        this.streamer!.on('exit', (code) => {
            var msg = (code === null)? 'Stream Exit' : `Failure code ${code}`;
        });
    }

    broadcast = (data: any) => {
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

    newClient = (socket: ws) => {
        var userLimit = (this.options.limit! > 0)? this.options.limit! : 0;
        var condition = (userLimit == 0)? true : (this.wsServer.clients.size <= userLimit);
        var self = this;
        

        if(condition) {
            this.streamClients.push(socket);

            PiStreamServer.log.info(`Someone just connected ! (${self.wsServer.clients.size} user(s) online.)`);

            socket.send(JSON.stringify({
                action: "init",
                width: self.options.width,
                height: self.options.height
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

                PiStreamServer.log.info(`Action incoming: ${action}`);
        
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
                    }
                } 
                catch (error) {
                    PiStreamServer.log.error(error);
                }
            });
        }
    }
}

export var createServer = (requestListner: http.RequestListener, video: Options): http.Server => {
    var server = http.createServer(requestListner);
    var stream = new PiStreamServer(new ws.Server({server}), video);
    return server;
}

export var createClient = (path='.') => {
    try {
        var file = 'http-live-player.js';
        if(fs.existsSync(path)){
            fs.createReadStream(join(__dirname, '../client/'+file)).pipe(fs.createWriteStream(join(path, file)));
        }
    } 
    catch (error) {
        console.log(error);
    }
}