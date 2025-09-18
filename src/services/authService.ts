import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/database";
import {
    registerSchema,
    loginSchema,
    adminRegisterSchema,
    updatePasswordSchema,
} from "../utils/validators";
import { Role } from "@prisma/client";
import logger from "../utils/logger";

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
    try {
        // Validate input data
        const validatedData = loginSchema.parse(data);

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            const error = new Error(
                "User not registered, please register first!"
            );
            logger.error(`Login failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }

        // Check if password matches
        if (!(await bcrypt.compare(validatedData.password, user.password))) {
            const error = new Error("Invalid credentials");
            logger.error(`Login failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
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
        // Log validation or unexpected errors
        logger.error(`Login error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller to handle
    }
};

export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    try {
        // Validate input data
        const validatedData = registerSchema.parse(data);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            const error = new Error("User with this email already exists");
            logger.error(`Registration failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: { ...validatedData, password: hashedPassword },
        });

        // Log successful registration
        logger.info(`User registered successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return user;
    } catch (error: any) {
        // Log validation or database errors
        logger.error(`Registration error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller
    }
};

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
            const error = new Error("User not found");
            logger.error(`Password update failed: ${error.message}`, {
                userId,
            });
            throw error;
        }

        // Verify current password
        if (
            !(await bcrypt.compare(
                validatedData.currentPassword,
                user.password
            ))
        ) {
            const error = new Error("Current password is incorrect");
            logger.error(`Password update failed: ${error.message}`, {
                userId,
            });
            throw error;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Log successful password update
        logger.info(`Password updated successfully`, {
            userId,
        });

        return { message: "Password updated successfully" };
    } catch (error: any) {
        // Log validation or database errors
        logger.error(`Password update error: ${error.message}`, {
            userId,
            error,
        });
        throw error; // Rethrow for controller
    }
};

export const registerAdmin = async (
    data: z.infer<typeof adminRegisterSchema>
) => {
    try {
        // Validate input data
        const validatedData = adminRegisterSchema.parse(data);

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            const error = new Error("Email already in use");
            logger.error(`Admin registration failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }

        // Check if any admin exists (for one-time use)
        const existingAdmin = await prisma.user.findFirst({
            where: { role: Role.ADMIN },
        });
        if (existingAdmin) {
            const error = new Error(
                "Admin user already exists! Request admin to create your account."
            );
            logger.error(`Admin registration failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }

        // Hash password with higher salt rounds for admin
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        // Create admin user
        const user = await prisma.user.create({
            data: { ...validatedData, password: hashedPassword },
        });

        // Log successful admin registration
        logger.info(`Admin registered successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return { id: user.id, email: user.email, role: user.role };
    } catch (error: any) {
        // Log validation or database errors
        logger.error(`Admin registration error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller
    }
};
