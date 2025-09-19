"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("./logger"));
const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false, // Use true for port 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        // Send mail
        const info = await transporter.sendMail({
            from: `Lead Management System <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        });
        logger_1.default.info("Email sent successfully", {
            email,
            messageId: info.messageId,
        });
        return info;
    }
    catch (error) {
        logger_1.default.error("Failed to send email", {
            email,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error; // Rethrow to allow caller to handle
    }
};
exports.default = mailSender;
