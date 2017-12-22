const winston = require('winston');

const logger = winston.createLogger({
  level: ['info', 'welcome', 'action', 'move'],
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true
    }),
    new winston.transports.File({ filename: './logs/info.log', level: 'info', silent: false, timestamp: true }),
    new winston.transports.File({ filename: './logs/welcome.log', level: 'welcome', silent: false, timestamp: true }),
    new winston.transports.File({ filename: './logs/action.log', level: 'action', silent: true, timestamp: true }),
    new winston.transports.File({ filename: './logs/move.log', level: 'move', silent: true, timestamp: true }),
    new winston.transports.File({ filename: './logs/error.log', level: 'error', silent: false, timestamp: true })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: './logs/exceptions.log', silent: false })
  ]
});

module.exports = logger;
