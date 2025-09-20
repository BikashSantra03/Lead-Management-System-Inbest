import prisma from "../config/database";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
} from "../utils/validators";
import { comparePassword, hashPassword } from "../utils";
import logger from "../utils/logger";
import { registrationSuccess } from "../mail/templates/registrationSuccess";
import mailSender from "../utils/mailsender";

/**
 * User Login Service
 * @param data
 * @returns
 */
export const loginUser = async (data: z.infer<typeof loginSchema>) => {
    try {
        // Validate input data
        const validatedData = loginSchema.parse(data);

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            throw new Error("User not registered, please register first!");
        }

        if (!(await comparePassword(validatedData.password, user.password))) {
            throw new Error("Invalid credentials");
        }
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "2h" }
        );

        // Log successful login
        logger.info(`User logged in successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: { id: user.id, email: user.email, role: user.role },
            token,
        };
    } catch (error: any) {
        throw error; // Rethrow for controller to handle
    }
};

/**
 * User Registration Service
 * @param data
 * @returns
 */
export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    try {
        // Validate input data
        const validatedData = registerSchema.parse(data);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        // Create user within a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    ...validatedData,
                    password: await hashPassword(validatedData.password, 10),
                },
            });
            return newUser;
        });

        // Send registration email asynchronously
        try {
            const emailBody = registrationSuccess(
                user.email,
                user.name,
                validatedData.password // Include plain-text password
            );
            await mailSender(user.email, "Registration Successful", emailBody);
            logger.info(`Email sent successfully`, {
                email: user.email,
                messageId: "dynamic-message-id", // Replace with actual messageId if available
            });
        } catch (emailError: any) {
            logger.error(`Email sending failed: ${emailError.message}`, {
                email: user.email,
                emailError,
            });
        }

        // Log successful registration
        logger.info(`User registered successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return user;
    } catch (error: any) {
        logger.error(`Registration error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller
    }
};

/**
 * Update Password Service
 * @param userId
 * @param data
 * @returns
 */
export const updateUserPassword = async (
    userId: string,
    data: z.infer<typeof updatePasswordSchema>
) => {
    try {
        // Validate input data
        const validatedData = updatePasswordSchema.parse(data);

        // Find user by ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("User not found");
        }

        // Verify current password
        if (
            !(await comparePassword(
                validatedData.currentPassword,
                user.password
            ))
        ) {
            throw new Error("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await hashPassword(
            validatedData.newPassword,
            10
        );

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: "Password updated successfully" };
    } catch (error: any) {
        throw error; // Rethrow for controller
    }
};
