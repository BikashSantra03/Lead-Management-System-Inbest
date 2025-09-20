import { Request, Response } from "express";
import { z } from "zod";
import {
    loginUser,
    registerUser,
    updateUserPassword,
} from "../services/authService";
import {
    loginSchema,
    registerSchema,
    updatePasswordSchema,
} from "../utils/validators";
import { AuthRequest } from "../types";

/**
 * Login member controller
 * @param req
 * @param res
 * @returns
 */
export const loginHandler = async (req: Request, res: Response) => {
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

/**
 * Register member controller
 * Only Admin Can register other members
 * @param req
 * @param res
 * @returns
 */
export const registerHandler = async (req: Request, res: Response) => {
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

/**
 * Update Password Handler
 * @param req
 * @param res
 * @returns
 */
export const updatePasswordHandler = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        // Validate input
        const validated = updatePasswordSchema.parse(req.body);

        // Ensure user is authenticated
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        // Update password for the authenticated user
        const result = await updateUserPassword(req.user.id, validated);
        res.json({
            success: true,
            message: result.message,
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
