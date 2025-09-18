import { Response, NextFunction } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../types";
import { Role } from "@prisma/client";

// Ensures sales reps can only access leads assigned to them
export const requireLeadOwnership = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Check if user exists and is a sales rep; if not, bypass check for managers/admins
    if (!req.user || req.user.role !== Role.SALES_REP) {
        return next();
    }

    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
        where: { id },
        select: { assignedTo: true },
    });

    // If lead doesn't exist or isn't assigned to the requesting sales rep, deny access
    if (!lead || lead.assignedTo !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Access denied: Lead not assigned to you",
        });
    }

    // Lead ownership verified; proceed to the next middleware or controller
    next();
};
