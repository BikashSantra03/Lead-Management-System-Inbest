"use strict";
/**
 * -------------------------------------------------------------------------------------------------------------
 * NOTE: log manager function
 *
 * AUTHOR: santrabikash921@gmail.com
 * VERSION: 1.0.0
 * -------------------------------------------------------------------------------------------------------------
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path")); // Added for cleaner file path handling
/**
 * Create log format
 * Enhanced to include error stack traces and metadata (e.g., userId, leadId)
 */
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Standardized timestamp format
winston_1.default.format.errors({ stack: true }), // Capture stack traces for errors
winston_1.default.format.metadata(), // Include metadata (e.g., userId, leadId)
winston_1.default.format.colorize(), // Colorize console output for readability (dev only)
winston_1.default.format.align(), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, metadata, stack } = info;
    // Safely check if metadata is a non-null object before using Object.keys
    const metaString = metadata && typeof metadata === 'object' && Object.keys(metadata).length
        ? ` ${JSON.stringify(metadata)}`
        : '';
    // Include stack trace for errors, otherwise just message
    const messageOrStack = stack || message;
    return `${timestamp} ${level}: ${messageOrStack}${metaString}`;
}));
/**
 * Create logger transports
 * Supports console (all envs) and file rotation (dev + production)
 */
const transports = [];
// Console transport for all environments
transports.push(new winston_1.default.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Debug in dev, info in prod
}));
// File transport for both development and production with daily rotation
const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || 'logs'; // Configurable log directory via .env
const logFile = process.env.LOG_FILE || 'app-%DATE%.log'; // Configurable log file name
// Create rotation transporter for daily logs
const fileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, logFile), // e.g., logs/app-2025-09-18.log
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
const logger = winston_1.default.createLogger({
    format: logFormat,
    transports,
    // Ensure errors are logged with stack traces
    exceptionHandlers: [
        new winston_1.default.transports.Console({ level: 'error' }),
        new winston_1.default.transports.File({ filename: path_1.default.join(logDir, 'exceptions.log') }),
    ],
    // Log unhandled promise rejections
    rejectionHandlers: [
        new winston_1.default.transports.Console({ level: 'error' }),
        new winston_1.default.transports.File({ filename: path_1.default.join(logDir, 'rejections.log') }),
    ],
});
exports.default = logger;
