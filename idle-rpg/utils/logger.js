const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  levels: {
    info: 0,
    welcome: 1,
    action: 2,
    move: 3,
    error: 4,
    command: 5
  },
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/info.log',
      level: 'info',
      silent: false,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/welcome.log',
      level: 'welcome',
      silent: false,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/action.log',
      level: 'action',
      silent: true,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/move.log',
      level: 'move',
      silent: true,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/error.log',
      level: 'error',
      silent: false,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    }),

    new winston.transports.DailyRotateFile({
      filename: './logs/command.log',
      level: 'command',
      silent: false,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      maxDays: 30,
      timestamp: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: './logs/exceptions.log', silent: false })
  ]
});

module.exports = logger;
