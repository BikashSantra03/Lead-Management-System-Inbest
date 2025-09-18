// src/utils/logger.ts
/**
 * -------------------------------------------------------------------------------------------------------------
 * NOTE: log manager function
 * 
 * AUTHOR: santrabikash921@gmail.com
 * VERSION: 1.0.2  // Updated version for type safety fix
 * -------------------------------------------------------------------------------------------------------------
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path"; // Added for cleaner file path handling

/**
 * Create log format
 * Enhanced to include error stack traces and metadata (e.g., userId, leadId)
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Standardized timestamp format
    winston.format.errors({ stack: true }), // Capture stack traces for errors
    winston.format.metadata(), // Include metadata (e.g., userId, leadId)
    winston.format.colorize(), // Colorize console output for readability (dev only)
    winston.format.align(),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, metadata, stack } = info;
            // Safely check if metadata is a non-null object before using Object.keys
            const metaString = metadata && typeof metadata === 'object' && Object.keys(metadata).length
                ? ` ${JSON.stringify(metadata)}`
                : '';
            // Include stack trace for errors, otherwise just message
            const messageOrStack = stack || message;
            return `${timestamp} ${level}: ${messageOrStack}${metaString}`;
        }
    )
);

/**
 * Create logger transports
 * Supports console (all envs) and file rotation (dev + production)
 */
const transports: winston.transport[] = [];

// Console transport for all environments
transports.push(
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Debug in dev, info in prod
    })
);

// File transport for both development and production with daily rotation
const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || 'logs'; // Configurable log directory via .env
const logFile = process.env.LOG_FILE || 'app-%DATE%.log'; // Configurable log file name

// Create rotation transporter for daily logs
const fileTransport = new DailyRotateFile({
    filename: path.join(logDir, logFile), // e.g., logs/app-2025-09-18.log
    datePattern: 'YYYY-MM-DD', // Rotate daily
    zippedArchive: true, // Compress old logs
    maxSize: '20m', // Max 20MB per file
    maxFiles: '14d', // Keep 14 days of logs
    level: isProduction ? 'info' : 'debug', // Match console levels
});

transports.push(fileTransport);

/**
 * Create logger instance
 * Configured for both console and file output with environment-specific levels
 */
const logger = winston.createLogger({
    format: logFormat,
    transports,
    // Ensure errors are logged with stack traces
    exceptionHandlers: [
        new winston.transports.Console({ level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') }),
    ],
    // Log unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.Console({ level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'rejections.log') }),
    ],
});

export default logger;