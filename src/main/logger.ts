import winston, { createLogger, format, transports } from 'winston';
import path from 'node:path';
import fs from 'node:fs'; // Import fs for directory creation
import { app } from 'electron';

/**
 * Retrieves the application's user data path for storing logs.
 * Ensures logs are stored in a standard location.
 * Creates the log directory if it doesn't exist.
 * Provides a fallback for non-Electron environments.
 *
 * @returns {string} The absolute path to the log directory.
 * @throws {Error} If the log directory cannot be created.
 */
const getLogDirectory = (): string => {
  let logPath: string;
  try {
    // Use Electron's app path if available
    logPath = path.join(app.getPath('userData'), 'logs');
  } catch (error) {
    // Fallback for environments where 'app' might not be available (e.g., tests)
    console.warn("Could not get Electron's userData path. Falling back to './logs'.", error);
    logPath = path.resolve('./logs'); // Use absolute path for fallback
  }

  try {
    // Ensure the log directory exists
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
    return logPath;
  } catch (mkdirError) {
    // Log critical error if directory creation fails
    console.error(`Failed to create log directory at ${logPath}:`, mkdirError);
    // Depending on requirements, might throw or exit
    throw new Error(`Failed to create log directory: ${logPath}`);
  }
};

/**
 * The directory where log files will be stored.
 * @type {string}
 */
const logDir: string = getLogDirectory();

/**
 * Custom log format function for Winston.
 * Includes timestamp, level, optional module name, and message/stack trace.
 *
 * @param {object} info - Log information object provided by Winston.
 * @param {string} info.timestamp - Log timestamp.
 * @param {string} info.level - Log level (e.g., 'info', 'debug').
 * @param {string} info.message - The log message.
 * @param {string} [info.stack] - Stack trace if the log represents an error.
 * @param {string} [info.module] - Module name provided by a child logger.
 * @returns {string} The formatted log string.
 */
const customFormat = format.printf(({ timestamp, level, message, stack, module, ...rest }) => {
  // Include module name if provided by a child logger, e.g., "[ModuleName] "
  const moduleInfo = module ? `[${module}] ` : '';
  // Use stack trace for errors, otherwise use the message
  const logContent = stack ?? message;
  // Check if there are any additional metadata properties
  let metadata = '';
  if (Object.keys(rest).length > 0) {
    try {
      // Stringify the rest of the properties, handling potential circular references
      metadata = ` ${JSON.stringify(rest, null, 2)}`; // Pretty print JSON
    } catch (e) {
      metadata = ' [Could not stringify additional data]';
    }
  }

  // Format: Timestamp [LEVEL] [OptionalModule] LogContent {Optional JSON Metadata}
  return `${timestamp} [${level}] ${moduleInfo}${logContent}${metadata}`;
});

/**
 * Base Winston logger instance.
 * Configured with console and file transports.
 * Log level defaults to 'debug', capturing detailed information.
 * Logs are timestamped and include stack traces for errors.
 * Use `getLogger(moduleName)` to create context-specific loggers.
 * Includes handlers for uncaught exceptions and rejections.
 *
 * @type {winston.Logger}
 */
const baseLogger: winston.Logger = createLogger({
  // Set the lowest level to capture (debug, info, warn, error)
  // Allows capturing detailed logs during development or troubleshooting.
  level: process.env.LOG_LEVEL || 'debug',
  // Combine multiple formats for the final log output
  format: format.combine(
    // Add timestamp to logs (e.g., '2023-10-27 10:00:00')
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Log stack traces for Error objects passed to the logger
    format.errors({ stack: true }),
    // Apply the custom log format defined above
    customFormat
  ),
  // Define where logs should be outputted
  transports: [
    // Console transport for immediate visibility during development/debugging
    new transports.Console({
      // Apply colorization specifically to the console transport for readability
      format: format.combine(
        format.colorize({ all: true }), // Colorize the level based on severity
        customFormat // Re-apply custom format to ensure consistency with file logs
      ),
      // Ensure console also respects the 'debug' level or higher
      level: 'debug',
    }),
    // File transport for writing all logs (debug and above) to a combined file
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'debug', // Captures debug, info, warn, error
    }),
    // Separate file transport specifically for errors for easier filtering
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error', // Only logs 'error' level messages
    }),
  ],
  // Handle uncaught exceptions to prevent application crashes and log the error
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, 'exceptions.log') }),
    // Optionally, also log exceptions to console during development
    // new transports.Console({ format: format.combine(format.colorize(), customFormat) })
  ],
  // Handle unhandled promise rejections to log errors in async operations
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, 'rejections.log') }),
    // Optionally, also log rejections to console
    // new transports.Console({ format: format.combine(format.colorize(), customFormat) })
  ],
});

/**
 * Creates a child logger with the specified module name attached as metadata.
 * This allows logs to be easily identified by their origin module. Child loggers
 * inherit the configuration (level, format, transports) from the base logger.
 *
 * @param {string} moduleName - The name of the module (e.g., 'ai', 'renderer', 'database').
 *                            This name will appear in the log output like `[moduleName]`.
 * @returns {winston.Logger} A child logger instance configured with the module context.
 * @example
 * ```typescript
 * // In src/renderer/someComponent.ts
 * import { getLogger } from '../main/logger';
 * const logger = getLogger('RendererComponent');
 *
 * logger.info('Component initialized.');
 * // Output: 2023-10-27 10:00:00 [info] [RendererComponent] Component initialized.
 *
 * logger.debug('User data loading.', { userId: 123 }); // Add metadata object
 * // Output: 2023-10-27 10:00:01 [debug] [RendererComponent] User data loading. { userId: 123 }
 * ```
 */
export const getLogger = (moduleName: string): winston.Logger => {
  // Create a child logger inheriting settings but adding module metadata
  // This is efficient as it doesn't recreate transports or formats.
  return baseLogger.child({ module: moduleName });
};

// Log initialization details using the base logger itself before any child loggers are created.
baseLogger.info(`Logger initialized. Log level: ${baseLogger.level}. Log directory: ${logDir}`);

// Note: No default export. Consumers must use the named export `getLogger`.
// This enforces providing a module name for better log traceability.