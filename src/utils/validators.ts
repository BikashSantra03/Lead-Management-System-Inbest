import { LeadStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    password: z.string({ message: "Password is required" }),
});

export const registerSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" }),
    role: z.enum(["MANAGER", "SALES_REP"], {
        message: "Role must be either MANAGER or SALES_REP",
    }), // Admin can't register admins
});

export const updatePasswordSchema = z
    .object({
        currentPassword: z.string().min(6, {
            message: "Current password must be at least 6 characters",
        }),
        newPassword: z
            .string()
            .min(8, { message: "New password must be at least 8 characters" })
            .regex(/[A-Z]/, {
                message:
                    "New password must contain at least one uppercase letter",
            })
            .regex(/[0-9]/, {
                message: "New password must contain at least one number",
            })
            .regex(/[!@#$%^&*]/, {
                message:
                    "New password must contain at least one special character",
            }),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from current password",
        path: ["newPassword"],
    });

export const adminRegisterSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(8, { message: "Admin password must be at least 8 characters" })
        .regex(/[A-Z]/, {
            message:
                "Admin password must contain at least one uppercase letter",
        })
        .regex(/[0-9]/, {
            message: "Admin password must contain at least one number",
        }),
    role: z.literal("ADMIN", { message: "Role must be ADMIN" }),
});

// Lead Schemas
export const createLeadSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.email({ message: "Invalid email address" }).optional(),
    phone: z.string().optional(),
    // status optional, defaults to NEW in DB
    notes: z.string().optional(),
});

export const updateLeadSchema = z.object({
    status: z
        .enum(["ENGAGED", "DISPOSED"], {
            message: "Status must be ENGAGED or DISPOSED for sales reps",
        })
        .optional(),
    notes: z.string().optional(),
});

export const assignLeadSchema = z.object({
    assignedTo: z.string(), // Sales Rep User ID
});

export const getLeadsQuerySchema = z.object({
    status: z.enum(LeadStatus).optional(), // Filter by status
});
