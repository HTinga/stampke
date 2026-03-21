'use strict';
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, simple } = format;

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd
    ? combine(timestamp(), json())           // structured JSON in prod
    : combine(colorize(), simple()),         // readable in dev
  transports: [
    new transports.Console(),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
