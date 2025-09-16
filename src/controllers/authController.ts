import { Request, Response } from "express";
import { z } from "zod";
import {
    loginUser,
    registerAdmin,
    registerUser,
} from "../services/authService";
import {
    adminRegisterSchema,
    loginSchema,
    registerSchema,
} from "../utils/validators";

export const login = async (req: Request, res: Response) => {
    try {
        const validated = loginSchema.parse(req.body);
        const result = await loginUser(validated);
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true,
        };
        res.cookie("Token", result.token, options);
        res.json({
            success: true,
            user: result.user,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: (error as Error).message,
        });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const validated = registerSchema.parse(req.body);
        // Only admins can register (checked via RBAC middleware)
        const result = await registerUser(validated);
        res.status(201).json({
            success: true,
            data: { id: result.id, email: result.email, role: result.role },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: (error as Error).message,
        });
    }
};

export const createInitAdmin = async (req: Request, res: Response) => {
    try {
        // Validate input
        const validated = adminRegisterSchema.parse(req.body);

        // Create admin user
        const result = await registerAdmin(validated);
        res.status(201).json({
            success: true,
            data: { id: result.id, email: result.email, role: result.role },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: (error as Error).message,
        });
    }
};
