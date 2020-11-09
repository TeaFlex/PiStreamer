const chalk = require('chalk');
const merge = require('lodash.merge');

class Notifications { 

    constructor(types, location = "en-GB") {
        this.location = location;
        this.types = merge({
            normal: {
                symbol: "*",
                color: chalk.white
            },
            info: {
                symbol: 'i',
                color: chalk.yellow
            },
            alert: {
                symbol: '!',
                color: chalk.bold.red
            },
            valid: {
                symbol: 'V',
                color: chalk.green
            },
            invalid: {
                symbol: 'X',
                color: chalk.bgRed.black
            },
            debug: {
                symbol: 'D',
                color: chalk.bgBlue.black
            }
        }, types);
    }
    print(msg, type='normal', symbol=this.types[type]['symbol']) {
        var timeStamp = new Date().toLocaleString(this.location);
        console.log(this.types[type]['color'](`(${timeStamp})\t[${symbol}]: ${msg}`));
    }
}

module.exports = Notifications;