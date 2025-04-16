import { createLogger, format, transports } from 'winston';
import path from 'node:path';
import { app } from 'electron';

const logDir = path.join(app.getPath('userData'), 'logs');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}] ${stack ?? message}`;
    })
  ),
  transports: [
    new transports.Console({ format: format.colorize({ all: true }) }),
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});

export default logger;