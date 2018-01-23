const winston = require('winston');
const path = require('path');
const { rootPath } = require('../../settings');
require('winston-daily-rotate-file');

const logger = {
  infoLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      info: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'info',
        level: 'info',
        filename: 'info.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ],
    exceptionHandlers: [
      new winston.transports.DailyRotateFile({
        name: 'exceptions',
        filename: 'exceptions.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        silent: false,
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),

  welcomeLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      welcome: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'welcome',
        level: 'welcome',
        filename: 'welcome.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),

  actionLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      action: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'action',
        level: 'action',
        filename: 'action.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),

  moveLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      move: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'move',
        level: 'move',
        filename: 'move.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),

  errorLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      error: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'error',
        level: 'error',
        filename: 'error.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),

  commandLog: new winston.Logger({
    // format: winston.format.json(),
    levels: {
      command: 0,
    },
    transports: [
      new winston.transports.DailyRotateFile({
        name: 'command',
        level: 'command',
        filename: 'command.log',
        dirname: path.join(`${rootPath}`, 'logs'),
        datePattern: path.normalize('/yyyy-MM-dd/'),
        localTime: true,
        prepend: true,
        maxDays: 30,
        timestamp: true,
        prettyPrint: true,
        createTree: true,
        json: true
      })
    ]
  }),
};

module.exports = logger;
