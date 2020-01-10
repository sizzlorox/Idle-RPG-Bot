const bunyan = require('bunyan');
const path = require('path');
const RotatingFileStream = require('bunyan-rotating-file-stream');
const { rootPath } = require('../../settings');

const logger = {
  infoLog: bunyan.createLogger({
    name: 'info',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/info.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),

  exceptionLog: bunyan.createLogger({
    name: 'exception',
    streams: [{
      stream: process.stderr
    },
    {
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/exception.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),

  welcomeLog: bunyan.createLogger({
    name: 'welcome',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/welcome.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),

  actionLog: bunyan.createLogger({
    name: 'action',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/action.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),

  moveLog: bunyan.createLogger({
    name: 'move',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/move.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),

  errorLog: bunyan.createLogger({
    name: 'error',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/error.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    },
    {
      stream: process.stdout
    }]
  }),

  commandLog: bunyan.createLogger({
    name: 'command',
    streams: [{
      stream: new RotatingFileStream({
        path: path.join(rootPath, 'logs/command.%d-%b-%y.log'),
        period: '15d',          // daily rotation
        totalFiles: 10,        // keep up to 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',      // Rotate log files larger than 10 megabytes
        totalSize: '20m',      // Don't keep more than 20mb of archived log files
      })
    }]
  }),
};

process.on('SIGUSR2', () => {
  logger.infoLog.reopenFileStreams();
  logger.welcomeLog.reopenFileStreams();
  logger.actionLog.reopenFileStreams();
  logger.moveLog.reopenFileStreams();
  logger.errorLog.reopenFileStreams();
  logger.commandLog.reopenFileStreams();
  logger.exceptionLog.reopenFileStreams();
});

module.exports = logger;
