import { Role } from "@prisma/client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export const requireRole = (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ success: false, message: "Insufficient permissions" });
        }
        next();
    };
};

// Usage: requireRole(['ADMIN']) for admin-only
