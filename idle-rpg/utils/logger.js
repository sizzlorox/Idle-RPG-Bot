const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true
    }),
    new winston.transports.File({ filename: './logs/error.log', level: 'error' })
  ]
});

module.exports = logger;
