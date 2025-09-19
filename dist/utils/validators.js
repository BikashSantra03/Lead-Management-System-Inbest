"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadsQuerySchema = exports.assignLeadSchema = exports.updateLeadSchema = exports.createLeadSchema = exports.adminRegisterSchema = exports.updatePasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email({ message: "Invalid email address" }),
    password: zod_1.z.string({ message: "Password is required" }),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Name is required" }),
    email: zod_1.z.email({ message: "Invalid email address" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" }),
    role: zod_1.z.enum(["MANAGER", "SALES_REP"], {
        message: "Role must be either MANAGER or SALES_REP",
    }), // Admin can't register admins
});
exports.updatePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(6, {
        message: "Current password must be at least 6 characters",
    }),
    newPassword: zod_1.z
        .string()
        .min(8, { message: "New password must be at least 8 characters" })
        .regex(/[A-Z]/, {
        message: "New password must contain at least one uppercase letter",
    })
        .regex(/[0-9]/, {
        message: "New password must contain at least one number",
    })
        .regex(/[!@#$%^&*]/, {
        message: "New password must contain at least one special character",
    }),
})
    .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});
exports.adminRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Name is required" }),
    email: zod_1.z.email({ message: "Invalid email address" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Admin password must be at least 8 characters" })
        .regex(/[A-Z]/, {
        message: "Admin password must contain at least one uppercase letter",
    })
        .regex(/[0-9]/, {
        message: "Admin password must contain at least one number",
    }),
    role: zod_1.z.literal("ADMIN", { message: "Role must be ADMIN" }),
});
// Lead Schemas
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Name is required" }),
    email: zod_1.z.email({ message: "Invalid email address" }).optional(),
    phone: zod_1.z.string().optional(),
    // status optional, defaults to NEW in DB
    notes: zod_1.z.string().optional(),
});
exports.updateLeadSchema = zod_1.z.object({
    status: zod_1.z
        .enum(["ENGAGED", "DISPOSED"], {
        message: "Status must be ENGAGED or DISPOSED for sales reps",
    })
        .optional(),
    notes: zod_1.z.string().optional(),
});
exports.assignLeadSchema = zod_1.z.object({
    assignedTo: zod_1.z.string(), // Sales Rep User ID
});
exports.getLeadsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(client_1.LeadStatus).optional(), // Filter by status
});
