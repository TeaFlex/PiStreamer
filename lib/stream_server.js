const WebSocketServer = require('ws').Server;
const merge = require('lodash.merge');
const Splitter = require('stream-split');
const NALseparator = new Buffer([0,0,0,1]);
const {spawn} = require('child_process');
const util = require('util');

class Stream_server {

    constructor(server, options){

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
        console.log(this.options);
        this.ws_server = new WebSocketServer({ server });
        
        this.new_client = this.new_client.bind(this);
        this.start_feed = this.start_feed.bind(this);
        this.broadcast  = this.broadcast.bind(this);

        this.ws_server.on('connection', this.new_client);
    }

    new_client(socket) {
        var self = this;
        console.log("Someone just connected !");

        socket.send(JSON.stringify({
            action: "init",
            width: self.options.width,
            height: self.options.height
        }));

        socket.on('close', ()=>{
            self.readStream.end();
            console.log("Someone left...");
        });

        socket.on("message", function(data){
            var cmd = "" + data, action = data.split(' ')[0];
            console.log(`Incoming action: ${action}`);
    
            if(action == "REQUESTSTREAM")
                self.start_feed();
            if(action == "STOPSTREAM")
                self.readStream.pause();
        });
    }

    start_feed() {
        var readStream = this.get_feed();
        this.readStream = readStream;
    
        readStream = readStream.pipe(new Splitter(NALseparator));
        readStream.on("data", this.broadcast);
    }
    
    get_feed() {
        var cmd = `raspivid -t 0 -o - -w ${this.options.width} -h ${this.options.height} -fps ${this.options.fps}`;
        console.log(cmd);
        var streamer = spawn('raspivid', ['-t', '0', '-o', '-', '-w', this.options.width, '-h', this.options.height, '-fps', this.options.fps, '-pf', 'baseline']);
        streamer.on("exit", function(code){
            console.log("Failure", code);
        });
        return streamer.stdout;
    }

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
}

module.exports = Stream_server;