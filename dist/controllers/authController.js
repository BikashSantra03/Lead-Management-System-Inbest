"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.register = exports.login = void 0;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const validators_1 = require("../utils/validators");
const login = async (req, res) => {
    try {
        const validated = validators_1.loginSchema.parse(req.body);
        const result = await (0, authService_1.loginUser)(validated);
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true,
        };
        res.cookie("Token", result.token, options);
        res.json({
            success: true,
            user: result.user,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const validated = validators_1.registerSchema.parse(req.body);
        // Only admins can register (checked via RBAC middleware)
        const result = await (0, authService_1.registerUser)(validated);
        res.status(201).json({
            success: true,
            data: { id: result.id, email: result.email, role: result.role },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.register = register;
const updatePassword = async (req, res) => {
    try {
        // Validate input
        const validated = validators_1.updatePasswordSchema.parse(req.body);
        // Ensure user is authenticated
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }
        // Update password for the authenticated user
        const result = await (0, authService_1.updateUserPassword)(req.user.id, validated);
        res.json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const message = error.issues
                .map((issue) => issue.message)
                .join(", ");
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updatePassword = updatePassword;
