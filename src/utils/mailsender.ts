import nodemailer from "nodemailer";
import logger from "./logger";

interface MailResponse {
    messageId?: string;
}

const mailSender = async (
    email: string,
    title: string,
    body: string
): Promise<MailResponse | undefined> => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false, // Use true for port 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_APP_PASS,
            },
        });

        // Send mail
        const info = await transporter.sendMail({
            from: `Lead Management System <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        });

        logger.info("Email sent successfully", {
            email,
            messageId: info.messageId,
        });
        return info;
    } catch (error) {
        logger.error("Failed to send email", {
            email,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error; // Rethrow to allow caller to handle
    }
};

export default mailSender;
