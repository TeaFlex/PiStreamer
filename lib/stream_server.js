const WebSocketServer = require('ws').Server;
const merge = require('lodash.merge');
const Splitter = require('stream-split');
const NALseparator = new Buffer([0,0,0,1]);
const {spawn} = require('child_process');
const util = require('util');
const Notifications = require('./notifications');
const n = new Notifications();

class Stream_server {

    constructor(server, options){

        //process of stream
        this.streamer = null;

        //options of stream and default values if there no option input
        this.options = merge({}, options);
        this.default_values = {
            height: 240,
            width: 480,
            fps: 12
        };

        Object.keys(this.default_values).forEach(key => {
            if(typeof this.options[key] === 'undefined')
                this.options[key] = this.default_values[key]
        });

        //initiation of websocket server
        this.ws_server = new WebSocketServer({ server });
        
        //binding of methods
        this.new_client = this.new_client.bind(this);
        this.start_feed = this.start_feed.bind(this);
        this.stop_feed  = this.stop_feed.bind(this);
        this.broadcast  = this.broadcast.bind(this);

        //on connection to the server
        this.ws_server.on('connection', this.new_client);
    }

    //stopping the stream by killing its process
    stop_feed() {
        process.kill(-this.streamer.pid);
        this.streamer = null;
        this.readStream = null;
    }

    //starting the stream by calling a spawn of the process,
    //all the data is piped and sent via WebSocket
    start_feed() {
        var readStream = this.get_feed();
        this.readStream = readStream;
    
        readStream = readStream.pipe(new Splitter(NALseparator));
        readStream.on("data", this.broadcast);
    }

    //pausing the stream by pausing its process
    pause_feed() {
        if(this.streamer !== null) {
            //TODO: pause the child process of stream
        }
    }

    //spawning of the streaming process "raspivid"
    get_feed() {
        n.print(`Beginning to stream ${this.options.width}x${this.options.height} output at ${this.options.fps}FPS.`, "valid");
        this.streamer = spawn('raspivid', ['-t', '0', '-o', '-', '-w', this.options.width, '-h', this.options.height, '-fps', this.options.fps, '-pf', 'baseline', '-vf'], {detached:true});
        this.streamer.on("exit", function(code){
            var exit_msg = (code === null)? 'Stream Exit' : `Failure ${code}`;
            n.print(exit_msg, "alert");
        });
        return this.streamer.stdout;
    }

    //broadcast of data with websocket
    broadcast(data) {
        this.ws_server.clients.forEach(function(socket) {
            if(socket.buzy)
                return;

            socket.buzy = true;
            socket.buzy = false;

            socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
                socket.buzy = false;
            });
        });
    }

    //when a new client is connected to the server
    new_client(socket, req, cli) {
        var self = this;
        n.print("Someone just connected !", "valid", "+");
        n.print(`${self.ws_server.clients.size} user(s) online.`, "info");

        socket.send(JSON.stringify({
            action: "init",
            width: self.options.width,
            height: self.options.height
        }));

        socket.on('close', ()=>{
            if(self.streamer !== null)
                self.readStream.end();
            n.print("Someone left...", "alert", "-");
            n.print(`${self.ws_server.clients.size} user(s) online.`, "info");
        });

        socket.on("message", function(data){
            var cmd = "" + data, action = data.split(' ')[0];
            n.print(`Incoming action: ${action}`);
    
            switch(action){
                case "REQUESTSTREAM":
                    if(self.streamer === null)
                        self.start_feed();
                break;
                
                case "STOPSTREAM":
                    if(self.streamer !== null)
                        self.stop_feed();
                break;

                case "PAUSESTREAM":
                    break;
            }
        });
    }
}

module.exports = Stream_server;