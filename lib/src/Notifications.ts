import winston, { Logger } from 'winston';

export var logger = winston.createLogger({
    format: winston.format.simple(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.Console()
    ]
});