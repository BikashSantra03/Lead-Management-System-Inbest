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

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    // Check if user exists
    if (!user) {
        throw new Error("User not registered, please register first!");
    }

    // Check if password matches
    if (!(await bcrypt.compare(data.password, user.password))) {
        throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );

    return { user: { id: user.id, email: user.email, role: user.role }, token };
};

export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
        data: { ...data, password: hashedPassword },
    });
};

export const updateUserPassword = async (
    userId: string,
    data: z.infer<typeof updatePasswordSchema>
) => {
    // Find user by ID
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }

    // Verify current password
    if (!(await bcrypt.compare(data.currentPassword, user.password))) {
        throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { message: "Password updated successfully" };
};

export const registerAdmin = async (
    data: z.infer<typeof adminRegisterSchema>
) => {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error("Email already in use");
    }

    // Check if any admin exists (for one-time use)
    const existingAdmin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
    });
    if (existingAdmin) {
        throw new Error(
            "Admin user already exists! Request admin to create your account."
        );
    }

    // Hash password with higher salt rounds for admin
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create admin user
    const user = await prisma.user.create({
        data: { ...data, password: hashedPassword },
    });

    return { id: user.id, email: user.email, role: user.role };
};
