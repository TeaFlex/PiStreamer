const chalk = require('chalk');
const merge = require('lodash.merge');

class Notifications { 

    constructor(types) {
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
            }
        }, types);
    }
    print(msg, type='normal', symbol=this.types[type]['symbol']) {
        var timeStamp = new Date().toLocaleString('en-GB');
        console.log(this.types[type]['color'](`(${timeStamp})\t[${symbol}]: ${msg}`));
    }
}

module.exports = Notifications;